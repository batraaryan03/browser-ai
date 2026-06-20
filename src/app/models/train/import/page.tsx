"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatBytes, createThrottledProgress } from "@/lib/models";
import { saveModel, getAllModels, deleteModel, bufferToBase64, base64ToBuffer } from "@/lib/model-store";
import { getPipeline } from "@/lib/t5";
import type { StoredModel } from "@/lib/model-store";
import type { ModelProgress } from "@/types";

/**
 * Build a completion-format prompt for T5-small.
 *
 * T5-small was NOT instruction-tuned. Unlike FLAN-T5, it doesn't follow
 * instructions like "Respond as this author". Instead, it treats input as
 * text to continue. This completion format presents the style as neutral
 * statements + vocabulary examples, then ends with User/Response so T5
 * naturally generates a continuation in the correct style.
 *
 * Reference: ML Personality Pipeline — "For T5-Small (Completion Format)"
 */
function buildStylePrompt(
  styleDescription: string,
  topWords: [string, number][],
  stats: {
    uppercaseRatio: number;
    avgSentenceLength: number;
    emojiCount: number;
  },
  question: string,
): string {
  // Build natural description of the style as neutral facts
  const descParts: string[] = [];
  descParts.push(`The writing style uses ${stats.avgSentenceLength}-character sentences on average.`);
  if (stats.uppercaseRatio < 0.02) descParts.push("Text is mostly lowercase.");
  else if (stats.uppercaseRatio > 0.08) descParts.push("Text uses frequent capitalization.");
  if (stats.emojiCount > 5) descParts.push("The writer uses emojis frequently.");
  else if (stats.emojiCount > 0) descParts.push("Emojis appear occasionally.");

  // The style description from the model
  descParts.push(`Style: ${styleDescription}.`);

  // Vocabulary examples — these act as "seed" text for T5 to match
  const topWordList = topWords.slice(0, 8).map(([w]) => w).join(", ");
  if (topWordList) descParts.push(`Common vocabulary: ${topWordList}.`);

  return [
    descParts.join("\n"),
    `\nUser: ${question}`,
    `\nResponse:`,
  ].join("");
}

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [models, setModels] = useState<StoredModel[]>([]);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<StoredModel | null>(null);
  const [usable, setUsable] = useState<StoredModel | null>(null);
  const [demoPrompt, setDemoPrompt] = useState("");
  const [demoOutput, setDemoOutput] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<"idle" | "loading-model" | "generating" | "done" | "error">("idle");
  const [t5Progress, setT5Progress] = useState<ModelProgress | null>(null);
  const [personalityData, setPersonalityData] = useState<{
    styleDescription: string;
    topWords: [string, number][];
    avgSentenceLength: number;
    uppercaseRatio: number;
    emojiCount: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const throttleRef = useRef(createThrottledProgress(3, 250));

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load models from IndexedDB on mount
  useEffect(() => {
    getAllModels().then((m) => {
      if (mountedRef.current) {
        setModels(m);
        setLoading(false);
      }
    });
  }, []);

  const parsePersonalityJson = useCallback((buffer: ArrayBuffer): typeof personalityData | null => {
    try {
      const decoded = new TextDecoder().decode(buffer);
      const parsed = JSON.parse(decoded);
      if (parsed.type === "personality-model" && parsed.styleDescription) {
        return {
          styleDescription: parsed.styleDescription,
          topWords: parsed.topWords || [],
          avgSentenceLength: parsed.avgSentenceLength || 80,
          uppercaseRatio: parsed.uppercaseRatio || 0.05,
          emojiCount: parsed.emojiCount || 0,
        };
      }
    } catch { /* not parseable */ }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setImporting(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const valid = ["safetensors", "onnx", "json", "bin"];
      if (!ext || !valid.includes(ext)) {
        toast.error(`Unsupported format: .${ext}. Use .safetensors, .onnx, .json, or .bin`);
        return;
      }

      const buffer = await file.arrayBuffer();
      const base64 = bufferToBase64(buffer);

      let baseModel = ext === "json" ? "personality-lstm" : "t5-small";
      let styleDescription: string | undefined;

      if (ext === "json") {
        const parsed = parsePersonalityJson(buffer);
        if (parsed) {
          styleDescription = parsed.styleDescription;
          baseModel = "personality-lstm";
        }
      }

      const modelEntry: StoredModel = {
        id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: `.${ext}`,
        sizeBytes: buffer.byteLength,
        baseModel,
        importedAt: new Date().toISOString(),
        data: base64,
        styleDescription,
      };

      await saveModel(modelEntry);
      setModels((prev) => [modelEntry, ...prev]);
      toast.success(`${file.name} imported successfully`);
      setViewing(modelEntry);
    } catch {
      toast.error("Failed to import file");
    } finally {
      setImporting(false);
    }
  }, [parsePersonalityJson]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteModel(id);
    setModels((prev) => prev.filter((m) => m.id !== id));
    if (viewing?.id === id) setViewing(null);
    toast.success("Model removed");
  }, [viewing]);

  const handleUseModel = useCallback(async (m: StoredModel) => {
    // Parse full personality data from stored base64
    try {
      const buffer = base64ToBuffer(m.data);
      const data = parsePersonalityJson(buffer);
      if (data) {
        setPersonalityData(data);
        setUsable(m);
        setViewing(null);
        setDemoPrompt("");
        setDemoOutput(null);
        setDemoLoading("idle");
      } else {
        toast.error("Could not parse personality model data");
      }
    } catch {
      toast.error("Failed to read model data");
    }
  }, [parsePersonalityJson]);

  const handleGenerate = useCallback(async () => {
    if (!usable || !personalityData || !demoPrompt.trim()) return;

    setDemoLoading("loading-model");

    try {
      // Step 1: Load T5 (may already be cached)
      await getPipeline((p) => {
        if (!mountedRef.current) return;
        const throttled = throttleRef.current(p.loaded);
        if (throttled !== null) {
          setT5Progress(p);
        }
      });

      if (!mountedRef.current) return;
      setDemoLoading("generating");

      // Step 2: Build style-conditioned prompt
      const prompt = buildStylePrompt(
        personalityData.styleDescription,
        personalityData.topWords,
        {
          uppercaseRatio: personalityData.uppercaseRatio,
          avgSentenceLength: personalityData.avgSentenceLength,
          emojiCount: personalityData.emojiCount,
        },
        demoPrompt.trim(),
      );

      // Step 3: Use the already-loaded T5 pipeline
      const pipe = await getPipeline();

      const output = await pipe(prompt, {
        max_new_tokens: 150,
        temperature: 0.9,
        do_sample: true,
        top_p: 0.92,
        num_beams: 1,
      });

      if (!mountedRef.current) return;

      const generatedText =
        (Array.isArray(output) ? output[0]?.generated_text : (output as any)?.generated_text) ?? "";

      // Extract the generated response — take everything after "Response:"
      const response = generatedText.split("Response:")[1]?.trim() ||
                       generatedText.split("response:")[1]?.trim() ||
                       "";
      setDemoOutput(response || "[T5 did not generate a response. Try rephrasing your question.]");

      setDemoLoading("done");
      setT5Progress(null);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
      setDemoLoading("error");
    }
  }, [usable, personalityData, demoPrompt]);

  const closeUsable = useCallback(() => {
    setUsable(null);
    setPersonalityData(null);
    setDemoOutput(null);
    setDemoLoading("idle");
    setT5Progress(null);
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Import Model</h1>
            <p className="text-sm text-gray-400">
              Upload a trained model file. It&apos;s stored in your browser&apos;s IndexedDB and ready to use.
              Supports .json (personality), .safetensors (LoRA), .onnx (merged), .bin formats.
            </p>
          </div>

          {/* Drop zone */}
          <input ref={inputRef} type="file" accept=".safetensors,.onnx,.json,.bin" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => !importing && inputRef.current?.click()}
            className={`bg-white px-5 py-10 text-center cursor-pointer select-none transition-all ${dragging ? "bg-black/[0.03]" : "hover:bg-black/[0.015]"} ${importing ? "opacity-40 pointer-events-none" : ""}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mx-auto mb-3 text-gray-400">
              <path d="M12 4v10M8 10l4 4 4-4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
            </svg>
            <p className="text-sm text-gray-500">Drop a model file here or <span className="text-black underline underline-offset-4">browse</span></p>
            <p className="text-[10px] text-gray-300 mt-2">.safetensors · .onnx · .json · .bin</p>
          </div>

          {/* Importing indicator */}
          {importing && (
            <div className="bg-white p-4 flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500 animate-spin">
                <circle cx="7" cy="7" r="5.5" strokeDasharray="22" strokeDashoffset="8" />
              </svg>
              <span className="text-xs text-gray-500">Importing model to browser storage...</span>
            </div>
          )}

          {/* Viewing a model */}
          {viewing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Imported Model</p>
                <span className="text-[10px] text-black font-medium">{viewing.baseModel}</span>
              </div>
              <div className="space-y-1 text-[11px] text-gray-400">
                <div className="flex justify-between"><span>Name</span><span className="text-gray-500">{viewing.name}</span></div>
                <div className="flex justify-between"><span>Size</span><span className="text-gray-500">{formatBytes(viewing.sizeBytes)}</span></div>
                <div className="flex justify-between"><span>Format</span><span className="text-gray-500">{viewing.type}</span></div>
                <div className="flex justify-between"><span>Imported</span><span className="text-gray-500">{new Date(viewing.importedAt).toLocaleDateString()}</span></div>
              </div>
              {viewing.styleDescription && (
                <div className="bg-black/[0.02] p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Style</p>
                  <p className="text-xs text-gray-600 italic">{viewing.styleDescription}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setViewing(null)} className="bg-black text-white px-4 py-2 text-[10px] font-medium uppercase tracking-wider hover:opacity-80 transition-opacity">Done</button>
                {viewing.baseModel === "personality-lstm" && viewing.styleDescription && (
                  <button onClick={() => handleUseModel(viewing)} className="bg-black text-white px-4 py-2 text-[10px] font-medium uppercase tracking-wider hover:opacity-80 transition-opacity">Use personality</button>
                )}
                <button onClick={() => handleDelete(viewing.id)} className="bg-black/[0.03] px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">Delete</button>
              </div>
            </motion.div>
          )}

          {/* Using a model — real T5 generation */}
          {usable && personalityData && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Using: {usable.name}</p>
                <button onClick={closeUsable} className="text-[10px] text-gray-400 hover:text-black underline underline-offset-4">Close</button>
              </div>

              {/* Style description */}
              <div className="bg-black/[0.02] p-3">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Style</p>
                <p className="text-xs text-gray-600 italic">{personalityData.styleDescription}</p>
              </div>

              {/* T5 download progress */}
              {demoLoading === "loading-model" && t5Progress && (
                <div className="bg-white border border-black/[0.06] p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{t5Progress.status === "downloading" ? "Loading T5 model for generation..." :
                           t5Progress.status === "compiling" ? "Compiling model..." : "Preparing..."}</span>
                    <span>{t5Progress.status === "downloading" ? `${Math.round(t5Progress.loaded)}%` : ""}</span>
                  </div>
                  {t5Progress.status === "downloading" && (
                    <div className="h-1 bg-black/[0.04]">
                      <motion.div
                        className="h-full bg-black"
                        initial={{ width: 0 }}
                        animate={{ width: `${t5Progress.loaded}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Generating state */}
              {demoLoading === "generating" && (
                <div className="bg-black/[0.02] p-4 text-center space-y-2">
                  <div className="inline-block w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Generating response in style...</p>
                </div>
              )}

              {/* Input */}
              <div className="space-y-2">
                <textarea
                  placeholder="Ask a question — T5 will respond in this author's style..."
                  rows={3}
                  value={demoPrompt}
                  onChange={(e) => setDemoPrompt(e.target.value)}
                  disabled={demoLoading === "loading-model" || demoLoading === "generating"}
                  className="w-full resize-none bg-transparent border border-black/[0.06] px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none disabled:opacity-40"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!demoPrompt.trim() || demoLoading === "loading-model" || demoLoading === "generating"}
                  className="bg-black text-white px-4 py-2 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                >
                  {demoLoading === "loading-model" ? "Loading model..." :
                   demoLoading === "generating" ? "Generating..." :
                   "Generate Response"}
                </button>
              </div>

              {/* Real T5 output */}
              {demoOutput && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-black/[0.02] p-3">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Generated Response</p>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{demoOutput}</p>
                </motion.div>
              )}

              {/* Error */}
              {demoLoading === "error" && (
                <div className="bg-black/[0.02] p-3 text-center">
                  <p className="text-xs text-gray-500">Generation failed. Try again or check the console.</p>
                  <button onClick={handleGenerate} className="mt-2 text-[10px] text-black underline underline-offset-4">Retry</button>
                </div>
              )}

              <p className="text-[9px] text-gray-300">
                Powered by <strong>Xenova/t5-small</strong> (308 MB). Generates responses conditioned on the
                imported model&apos;s style profile (vocabulary, sentence structure, punctuation patterns).
                Model downloads once from Hugging Face and caches in your browser.
              </p>
            </motion.div>
          )}

          {/* Imported models list */}
          {!loading && models.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Imported models ({models.length})</p>
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {models.map((m) => (
                    <motion.button
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={() => setViewing(m)}
                      className="w-full flex items-center justify-between bg-white px-4 py-3 text-left hover:bg-black/[0.015] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/[0.03]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                            <path d="M5 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5l-3-4H5z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px]">{m.name}</p>
                          <p className="text-xs text-gray-400">{formatBytes(m.sizeBytes)} · {m.type} · {m.baseModel}</p>
                        </div>
                      </div>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-300 shrink-0">
                        <path d="M3.5 2l3 3-3 3" />
                      </svg>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white px-5 py-6 text-center">
              <p className="text-xs text-gray-400">Loading imported models...</p>
            </div>
          )}

          {!loading && models.length === 0 && !importing && (
            <div className="bg-white px-5 py-6 text-center">
              <p className="text-xs text-gray-400">No imported models yet. Export one from the training page or drop a file above.</p>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
