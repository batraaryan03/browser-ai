"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isVisionModelLoaded, classifyImage, releaseVisionModel } from "@/lib/vision";
import { useVisionModel } from "@/hooks/useVisionModel";
import { getModel } from "@/lib/models";

interface Prediction {
  label: string;
  score: number;
}

const modelInfo = getModel("classify");

export default function ClassifyPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const { loadState, setLoadState, running, setRunning, makeProgressCallback, resetLoadState } = useVisionModel();
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setPredictions(null);
    setImageFile(file);
    resetLoadState();

    const reader = new FileReader();
    reader.onload = () => {
      if (mountedRef.current) setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [resetLoadState]);

  const classify = useCallback(async () => {
    if (!image) return;
    setRunning(true);
    setPredictions(null);

    try {
      const onProgress = makeProgressCallback();
      const results = await classifyImage(image, onProgress);
      if (!mountedRef.current) return;

      // Map label IDs to readable names and sort by confidence
      const sorted = (results as any[])
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((r) => ({
          label: typeof r.label === "string" ? r.label : `Class ${r.label}`,
          score: typeof r.score === "number" ? r.score : 0,
        }));

      setPredictions(sorted);
      setRunning(false);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "Classification failed";
      toast.error(msg);
      setRunning(false);
    }
  }, [image, makeProgressCallback, setRunning]);

  const reset = useCallback(() => {
    setImage(null);
    setImageFile(null);
    setPredictions(null);
    resetLoadState();
    releaseVisionModel("classify");
  }, [resetLoadState]);

  const progress = loadState.status === "downloading"
    ? Math.round(loadState.progress)
    : loadState.status === "compiling"
    ? 100
    : null;

  const isReady = loadState.status === "ready" || isVisionModelLoaded("classify");

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Image Classifier</h1>
            <p className="text-sm text-gray-400">
              Upload any image and get instant predictions from 1,000 ImageNet categories.
              Uses <strong>MobileNet-v2</strong> ({modelInfo ? `${(modelInfo.sizeBytes / 1_000_000).toFixed(0)} MB` : "25 MB"}) via ONNX Runtime Web — runs entirely in-browser.
            </p>
          </div>

          {/* Download progress */}
          {progress !== null && progress < 100 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{loadState.currentFile ? `Downloading ${loadState.currentFile}...` : "Downloading model..."}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-black/[0.04]">
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Compiling state */}
          {loadState.status === "compiling" && (
            <div className="bg-white p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Compiling model — almost ready...</p>
            </div>
          )}

          {loadState.status === "error" && (
            <div className="bg-white p-4">
              <p className="text-[11px] text-black/60">Error loading model: {loadState.error}</p>
              <button onClick={() => classify()} className="mt-2 text-[10px] text-black underline underline-offset-4">Retry</button>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />

          {!image && (
            <div onClick={() => inputRef.current?.click()} className="bg-white px-5 py-14 text-center cursor-pointer hover:bg-black/[0.015] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mx-auto mb-3 text-gray-400">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <p className="text-sm text-gray-500">Upload an image to classify</p>
              <p className="text-[10px] text-gray-300 mt-1">JPG · PNG · WEBP</p>
            </div>
          )}

          {image && (
            <div className="space-y-4">
              <div className="bg-white p-4">
                <img src={image} alt="Uploaded" className="w-full h-auto max-h-64 object-contain" />
              </div>

              {!predictions && !running && (
                <button onClick={classify} disabled={loadState.status !== "idle" && !isReady} className="w-full bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  {loadState.status === "idle" ? "Load Model & Classify" :
                   loadState.status === "downloading" ? `Downloading model... ${progress ?? 0}%` :
                   loadState.status === "compiling" ? "Compiling model..." :
                   "Classify Image"}
                </button>
              )}

              {running && (
                <div className="bg-white p-4 text-center">
                  <div className="inline-block w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Running inference...</p>
                </div>
              )}

              {predictions && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 space-y-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Top Predictions</p>
                  {predictions.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/[0.03] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-4">{i + 1}.</span>
                        <span className="text-sm">{p.label.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums">{(p.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={classify} className="flex-1 bg-black/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                      Re-classify
                    </button>
                    <button onClick={reset} className="flex-1 bg-black/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                      Try another
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div className="bg-white px-4 py-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Powered by <strong>Xenova/vit-base-patch16-224</strong> (~{modelInfo ? `${(modelInfo.sizeBytes / 1_000_000).toFixed(0)}` : "80"} MB) via Transformers.js.
              Model downloads once from Hugging Face and caches in your browser. No data leaves your device.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
