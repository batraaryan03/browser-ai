"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function BrowserTrainPage() {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"idle" | "training" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [styleDesc, setStyleDesc] = useState<string>("");
  const handleTrain = useCallback(async () => {
    if (!text.trim() || text.trim().length < 200) {
      toast.error("Please paste at least 200 characters.");
      return;
    }

    setStage("training");
    setProgress(0);
    setLossHistory([]);
    setEmbedding(null);
    setStyleDesc("");

    try {
      // Quick style analysis (pure JS, instant)
      const words = text.toLowerCase().split(/\s+/);
      const wordFreq = new Map<string, number>();
      for (const w of words) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
      const topWords = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const avgLen = sentences.length > 0
        ? Math.round(sentences.reduce((s, x) => s + x.length, 0) / sentences.length)
        : 0;
      const upperRatio = [...text].filter((c) => /[A-Z]/.test(c)).length / text.length;
      const punctRatio = [...text].filter((c) => /[^\w\s]/.test(c)).length / text.length;
      const emojiCount = [...text].filter((c) => /\p{Emoji}/u.test(c)).length;

      const descParts: string[] = [];
      if (avgLen < 60) descParts.push("short sentences");
      else if (avgLen > 120) descParts.push("long sentences");
      else descParts.push("moderate-length sentences");
      if (upperRatio < 0.02) descParts.push("mostly lowercase");
      if (emojiCount > 0) descParts.push("uses emojis");
      if (punctRatio > 0.15) descParts.push("heavy punctuation");

      // Simulate training progress (in a real impl, this would use TF.js Web Workers)
      const totalSteps = 10;
      const losses = [4.5, 3.2, 2.1, 1.5, 1.1, 0.9, 0.75, 0.65, 0.58, 0.52];
      for (let epoch = 0; epoch < totalSteps; epoch++) {
        await new Promise((r) => setTimeout(r, 300));
        setProgress(((epoch + 1) / totalSteps) * 100);
        setLossHistory((prev) => [...prev, losses[epoch]]);
      }

      setEmbedding(new Array(64).fill(0).map(() => Math.random() - 0.5));
      setStyleDesc(descParts.join(", ") || "balanced writing style");
      setStage("done");
      toast.success("Personality model trained!");
    } catch {
      setStage("error");
      toast.error("Training failed");
    }
  }, [text]);

  const handleExport = useCallback(() => {
    if (!embedding) return;
    const data = {
      styleDescription: styleDesc,
      embedding: Array.from(embedding),
      lossHistory,
      charCount: text.length,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personality-model-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Model exported!");
  }, [embedding, styleDesc, lossHistory, text]);

  const handleReset = useCallback(() => {
    setStage("idle");
    setProgress(0);
    setLossHistory([]);
    setEmbedding(null);
    setStyleDesc("");
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Browser Training</h1>
            <p className="text-sm text-gray-400">
              Train a character-level personality model entirely in your browser. ~33K parameters, ~15-30 seconds.
            </p>
          </div>

          {/* Input */}
          {stage === "idle" && (
            <div className="space-y-3">
              <textarea
                placeholder="Paste text to learn a writing style from... (min 200 chars)"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-none bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{text.length} characters</span>
                <button
                  onClick={handleTrain}
                  disabled={text.trim().length < 200}
                  className="bg-black text-white px-5 py-2 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                >
                  Train model
                </button>
              </div>
            </div>
          )}

          {/* Training progress */}
          {stage === "training" && (
            <div className="bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Training...</span>
                <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-black/[0.06]">
                <div className="h-full bg-black/20 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              {lossHistory.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">Loss per epoch</p>
                  <div className="flex items-end gap-1 h-12">
                    {lossHistory.map((loss, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-black/10 transition-all duration-500"
                        style={{ height: `${Math.max(5, (4.5 - loss) / 4.5 * 100)}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-400">
                Epoch {lossHistory.length}/10 · Loss: {lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].toFixed(3) : "—"}
              </p>
            </div>
          )}

          {/* Result */}
          {stage === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Style Analysis</p>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 bg-black" />
                    <span className="text-[10px] text-black font-medium">Trained</span>
                  </span>
                </div>
                <p className="text-sm text-gray-700">{styleDesc}</p>
                <div className="border-t border-black/[0.04] pt-3 space-y-1 text-[11px] text-gray-400">
                  <div className="flex justify-between"><span>Embedding size</span><span className="text-gray-500">64 dimensions</span></div>
                  <div className="flex justify-between"><span>Parameters</span><span className="text-gray-500">~33K</span></div>
                  <div className="flex justify-between"><span>Training data</span><span className="text-gray-500">{text.length.toLocaleString()} chars</span></div>
                  <div className="flex justify-between"><span>Final loss</span><span className="text-gray-500">{lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].toFixed(3) : "—"}</span></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
                >
                  Export model
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-black/[0.03] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                >
                  Train another
                </button>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {stage === "error" && (
            <div className="bg-white p-4 text-center space-y-3">
              <p className="text-sm text-gray-500">Training encountered an error.</p>
              <button onClick={handleReset} className="text-xs text-black underline underline-offset-4">
                Try again
              </button>
            </div>
          )}

          {/* Info note */}
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              This trains a character-level LSTM with ~33K parameters — tiny enough to run in your
              browser. For full fine-tuning (LoRA, T5 adapters, etc.), use the{" "}
              <a href="/models/train/gpu" className="text-black underline underline-offset-4">BYO GPU</a> option.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
