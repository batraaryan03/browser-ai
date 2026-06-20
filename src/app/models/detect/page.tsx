"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isVisionModelLoaded, detectObjects, releaseVisionModel } from "@/lib/vision";
import { useVisionModel } from "@/hooks/useVisionModel";
import { getModel } from "@/lib/models";

interface Detection {
  label: string;
  score: number;
}

const modelInfo = getModel("detect");

export default function DetectPage() {
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<Detection[] | null>(null);
  const { loadState, setLoadState, running, setRunning, makeProgressCallback, resetLoadState } = useVisionModel();
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image.");
      return;
    }
    setResults(null);
    resetLoadState();
    const reader = new FileReader();
    reader.onload = () => {
      if (mountedRef.current) setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [resetLoadState]);

  const detect = useCallback(async () => {
    if (!image) return;
    setRunning(true);
    setResults(null);

    try {
      const onProgress = makeProgressCallback();
      const detections = await detectObjects(image, onProgress);
      if (!mountedRef.current) return;

      // Merge multiple detections of the same class by taking max confidence
      const merged = new Map<string, number>();
      for (const d of detections as any[]) {
        const label = typeof d.label === "string" ? d.label : "Unknown";
        const score = typeof d.score === "number" ? d.score : 0;
        const existing = merged.get(label);
        if (!existing || score > existing) {
          merged.set(label, score);
        }
      }

      const sorted = Array.from(merged.entries())
        .map(([label, score]) => ({ label, score }))
        .sort((a, b) => b.score - a.score);

      setResults(sorted);
      setRunning(false);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "Detection failed";
      toast.error(msg);
      setRunning(false);
    }
  }, [image, makeProgressCallback, setRunning]);

  const reset = useCallback(() => {
    setImage(null);
    setResults(null);
    resetLoadState();
    releaseVisionModel("detect");
  }, [resetLoadState]);

  const progress = loadState.status === "downloading"
    ? Math.round(loadState.progress)
    : loadState.status === "compiling"
    ? 100
    : null;

  const isReady = loadState.status === "ready" || isVisionModelLoaded("detect");

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Object Detection</h1>
            <p className="text-sm text-gray-400">
              Detect and locate objects in images using <strong>YOLOS-tiny</strong> ({modelInfo ? `${(modelInfo.sizeBytes / 1_000_000).toFixed(0)} MB` : "40 MB"}).
              Recognizes 80 COCO categories (people, vehicles, animals, objects).
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

          {loadState.status === "compiling" && (
            <div className="bg-white p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Compiling model — almost ready...</p>
            </div>
          )}

          {loadState.status === "error" && (
            <div className="bg-white p-4">
              <p className="text-[11px] text-black/60">Error loading model: {loadState.error}</p>
              <button onClick={() => detect()} className="mt-2 text-[10px] text-black underline underline-offset-4">Retry</button>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />

          {!image && (
            <div onClick={() => inputRef.current?.click()} className="bg-white px-5 py-14 text-center cursor-pointer hover:bg-black/[0.015] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mx-auto mb-3 text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <path d="M3 15l6-6 4 4 2-2 6 6" />
              </svg>
              <p className="text-sm text-gray-500">Upload an image to detect objects</p>
              <p className="text-[10px] text-gray-300 mt-1">JPG · PNG · WEBP</p>
            </div>
          )}

          {image && (
            <div className="space-y-4">
              <div className="bg-white p-4">
                <img src={image} alt="Uploaded" className="w-full h-auto max-h-64 object-contain" />
              </div>

              {!results && !running && (
                <button onClick={detect} disabled={loadState.status !== "idle" && !isReady} className="w-full bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  {loadState.status === "idle" ? "Load Model & Detect" :
                   loadState.status === "downloading" ? `Downloading model... ${progress ?? 0}%` :
                   loadState.status === "compiling" ? "Compiling model..." :
                   "Run Detection"}
                </button>
              )}

              {running && (
                <div className="bg-white p-4 text-center">
                  <div className="inline-block w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Running inference...</p>
                </div>
              )}

              {results && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Detected Objects ({results.length})
                  </p>
                  {results.length === 0 && (
                    <p className="text-xs text-gray-400 py-4 text-center">No objects detected above confidence threshold.</p>
                  )}
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/[0.03] last:border-0">
                      <span className="text-sm capitalize">{r.label.replace(/_/g, " ")}</span>
                      <span className="text-xs font-medium tabular-nums">{(r.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={detect} className="flex-1 bg-black/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                      Re-detect
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
              Powered by <strong>Xenova/yolos-tiny</strong> via Transformers.js. YOLOS is a pure-transformer
              object detector. Model downloads once and caches locally. All inference runs on your device.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
