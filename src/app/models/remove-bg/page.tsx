"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { removeBackground, isBgRemovalLoaded, loadBgRemovalModel, releaseBgRemovalModel, type BgRemovalProgress } from "@/lib/background-removal";
import { getModel } from "@/lib/models";
import { createThrottledProgress } from "@/lib/models";

const modelInfo = getModel("remove-bg");

export default function RemoveBgPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loadState, setLoadState] = useState<{
    status: "idle" | "downloading" | "compiling" | "processing" | "ready" | "error";
    progress: number;
    error?: string;
  }>({ status: "idle", progress: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const throttledRef = useRef(createThrottledProgress(3, 250));

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; releaseBgRemovalModel(); };
  }, []);

  const handleBgProgress = useCallback((p: BgRemovalProgress) => {
    if (!mountedRef.current) return;
    const throttled = throttledRef.current(p.progress);
    if (throttled !== null) {
      setLoadState({
        status: p.status,
        progress: throttled,
        error: p.error,
      });
    }
    if (p.status === "ready") {
      setLoadState({ status: "ready", progress: 100 });
    }
    if (p.status === "error") {
      setLoadState({ status: "error", progress: 0, error: p.error });
    }
  }, []);

  const handleImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setResult(null);
    setLoadState({ status: "idle", progress: 0 });
    throttledRef.current = createThrottledProgress(3, 250);

    const reader = new FileReader();
    reader.onload = () => {
      if (mountedRef.current) setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = useCallback(async () => {
    if (!image) return;
    setProcessing(true);

    try {
      // The removeBackground function automatically loads the model
      const resultDataUrl = await removeBackground(image, handleBgProgress);
      if (!mountedRef.current) return;

      setResult(resultDataUrl);
      setProcessing(false);
      toast.success("Background removed!");
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "Background removal failed";
      toast.error(msg);
      setProcessing(false);
    }
  }, [image, handleBgProgress]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = "background-removed.png";
    a.click();
    toast.success("Downloaded!");
  }, [result]);

  const handleReset = useCallback(() => {
    setImage(null);
    setResult(null);
    setLoadState({ status: "idle", progress: 0 });
  }, []);

  const isReady = loadState.status === "ready" || isBgRemovalLoaded();
  const progress =
    loadState.status === "downloading" ? Math.round(loadState.progress) :
    loadState.status === "compiling" ? 98 :
    processing ? Math.round(loadState.progress) :
    null;

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Background Removal</h1>
            <p className="text-sm text-gray-400">
              Remove backgrounds from portraits and photos using <strong>RMBG-1.4</strong> ({modelInfo ? `${(modelInfo.sizeBytes / 1_000_000).toFixed(0)} MB` : "44 MB"} ONNX).
              Powered by <strong>ONNX Runtime Web</strong> — runs entirely in-browser with WebGPU acceleration.
            </p>
          </div>

          {/* Download / processing progress */}
          {progress !== null && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>
                  {loadState.status === "downloading" ? "Downloading model (44 MB)..." :
                   loadState.status === "compiling" ? "Compiling model..." :
                   processing ? "Removing background..." : ""}
                </span>
                <span>{Math.min(progress, 99)}%</span>
              </div>
              <div className="h-1 bg-black/[0.04]">
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {loadState.status === "error" && (
            <div className="bg-white p-4">
              <p className="text-[11px] text-black/60">Error loading model: {loadState.error}</p>
              <button onClick={() => processImage()} className="mt-2 text-[10px] text-black underline underline-offset-4">Retry</button>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />

          {!image && (
            <div
              onClick={() => inputRef.current?.click()}
              className="bg-white px-5 py-14 text-center cursor-pointer hover:bg-black/[0.015] transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mx-auto mb-3 text-gray-400">
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <circle cx="8.5" cy="10.5" r="1.5" />
                <path d="M21 15l-4-5-3.5 4.5L10.5 12 6 17" />
              </svg>
              <p className="text-sm text-gray-500">Upload an image to remove its background</p>
              <p className="text-[10px] text-gray-300 mt-1">JPG · PNG · WEBP</p>
            </div>
          )}

          {image && !result && !processing && (
            <div className="space-y-4">
              <div className="bg-white p-4">
                <img src={image} alt="Uploaded" className="w-full h-auto max-h-80 object-contain" />
              </div>
              <button
                onClick={processImage}
                disabled={loadState.status !== "idle" && !isReady}
                className="w-full bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {loadState.status === "idle" ? "Load Model & Remove Background" :
                 loadState.status === "downloading" ? `Downloading model... ${progress ?? 0}%` :
                 loadState.status === "compiling" ? "Compiling model..." :
                 "Remove Background"}
              </button>
            </div>
          )}

          {processing && (
            <div className="bg-white p-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Processing — this may take a moment...</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-3">Result (transparent background)</p>
                <img src={result} alt="Background removed" className="w-full h-auto max-h-80 object-contain" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownload} className="flex-1 bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity">
                  Download PNG
                </button>
                <button onClick={handleReset} className="flex-1 bg-black/[0.03] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                  Try another
                </button>
              </div>
            </motion.div>
          )}

          <div className="bg-white px-4 py-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Powered by <strong>briaai/RMBG-1.4</strong> (~44 MB quantized ONNX) via ONNX Runtime Web with WebGPU acceleration.
              The model downloads once from Hugging Face and runs entirely in your browser. No data leaves your device.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
