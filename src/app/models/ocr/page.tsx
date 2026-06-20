"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isVisionModelLoaded, ocrImage, releaseVisionModel } from "@/lib/vision";
import { useVisionModel } from "@/hooks/useVisionModel";
import { getModel } from "@/lib/models";

const modelInfo = getModel("ocr");

export default function OCRPage() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const { loadState, running, setRunning, makeProgressCallback, resetLoadState } = useVisionModel();
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
    setText(null);
    resetLoadState();
    const reader = new FileReader();
    reader.onload = () => {
      if (mountedRef.current) setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [resetLoadState]);

  const extractText = useCallback(async () => {
    if (!image) return;
    setRunning(true);
    setText(null);

    try {
      const onProgress = makeProgressCallback();
      const recognized = await ocrImage(image, onProgress);
      if (!mountedRef.current) return;

      setText(recognized || "No text detected in the image.");
      setRunning(false);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : "OCR failed";
      toast.error(msg);
      setRunning(false);
    }
  }, [image, makeProgressCallback, setRunning]);

  const reset = useCallback(() => {
    setImage(null);
    setText(null);
    resetLoadState();
    releaseVisionModel("ocr");
  }, [resetLoadState]);

  const progress = loadState.status === "downloading"
    ? Math.round(loadState.progress)
    : loadState.status === "compiling"
    ? 100
    : null;

  const isReady = loadState.status === "ready" || isVisionModelLoaded("ocr");

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Text Recognition (OCR)</h1>
            <p className="text-sm text-gray-400">
              Extract printed text from images using <strong>TrOCR-base</strong> ({(modelInfo ? (modelInfo.sizeBytes / 1_000_000).toFixed(0) : "330")} MB).
              A transformer-based OCR model that runs entirely in your browser.
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
              <button onClick={() => extractText()} className="mt-2 text-[10px] text-black underline underline-offset-4">Retry</button>
            </div>
          )}

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />

          {!image && (
            <div onClick={() => inputRef.current?.click()} className="bg-white px-5 py-14 text-center cursor-pointer hover:bg-black/[0.015] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mx-auto mb-3 text-gray-400">
                <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                <rect x="6" y="10" width="12" height="4" />
              </svg>
              <p className="text-sm text-gray-500">Upload an image with text to extract</p>
              <p className="text-[10px] text-gray-300 mt-1">JPG · PNG · WEBP</p>
            </div>
          )}

          {image && !text && !running && (
            <div className="space-y-4">
              <div className="bg-white p-4">
                <img src={image} alt="Upload" className="w-full h-auto max-h-64 object-contain" />
              </div>
              <button onClick={extractText} disabled={loadState.status !== "idle" && !isReady} className="w-full bg-black text-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {loadState.status === "idle" ? "Load Model & Extract Text" :
                 loadState.status === "downloading" ? `Downloading model... ${progress ?? 0}%` :
                 loadState.status === "compiling" ? "Compiling model..." :
                 "Extract Text"}
              </button>
            </div>
          )}

          {running && (
            <div className="bg-white p-4 text-center">
              <div className="inline-block w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Running inference...</p>
            </div>
          )}

          {text && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Recognized Text</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{text}</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { navigator.clipboard.writeText(text ?? ""); toast.success("Copied!"); }} className="flex-1 bg-black/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                  Copy to clipboard
                </button>
                <button onClick={reset} className="flex-1 bg-black/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                  Try another
                </button>
              </div>
            </motion.div>
          )}

          <div className="bg-white px-4 py-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Powered by <strong>Xenova/trocr-base-printed</strong> via Transformers.js. TrOCR is a
              transformer-based OCR model by Microsoft that recognizes printed text from images.
              First download is ~330 MB (cached after). All data stays on your device.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
