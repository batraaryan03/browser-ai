"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { useSummarizer } from "@/hooks/useSummarizer";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { UploadZone } from "@/components/UploadZone";
import { LiveMonitor } from "@/components/LiveMonitor";
import { SummaryResult } from "@/components/SummaryResult";
import { SummaryHistory } from "@/components/SummaryHistory";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { stage, error, modelProgress, chunkProgress, result, processFile: startProcess, processText: startProcessText, reset } = useSummarizer();
  const [showInfo, setShowInfo] = useState(false);

  // Download confirmation dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  // Check if model is already cached in IndexedDB
  const isModelCached = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof indexedDB !== "undefined" && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        return dbs.some(
          (db) => db.name && (db.name.toLowerCase().includes("xenova") || db.name.toLowerCase().includes("t5")),
        );
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  // Handle file received — check cache, show dialog if needed
  const handleFileReceived = useCallback(
    async (f: File) => {
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Please upload a PDF file.");
        return;
      }

      // If model already loaded, process immediately
      if (stage === "done" || !modelProgress) {
        const cached = await isModelCached();
        if (cached) {
          startProcess(f);
          return;
        }
      }

      // Show download confirmation dialog
      setPendingFile(f);
      setShowDialog(true);
    },
    [stage, modelProgress, startProcess, isModelCached],
  );

  // Dialog confirm — start download + processing
  const handleDialogConfirm = useCallback(() => {
    setShowDialog(false);
    if (pendingFile) {
      startProcess(pendingFile);
      setPendingFile(null);
    } else if (pendingText) {
      startProcessText(pendingText, "pasted-text.txt");
      setPendingText(null);
    }
  }, [pendingFile, pendingText, startProcess, startProcessText]);

  // Dialog cancel
  const handleDialogCancel = useCallback(() => {
    setShowDialog(false);
    setPendingFile(null);
    setPendingText(null);
  }, []);

  const handleTextPaste = useCallback(
    async (text: string) => {
      // Check cache first, show dialog if needed
      const cached = await isModelCached();
      if (!cached && !modelProgress) {
        setPendingText(text);
        setShowDialog(true);
        return;
      }

      startProcessText(text, "pasted-text.txt");
    },
    [modelProgress, isModelCached, startProcessText],
  );

  const isProcessing = stage === "extracting" || stage === "loading" || stage === "summarizing" || stage === "saving";

  return (
    <div className="relative min-h-dvh flex flex-col">
      <Navbar onInfoClick={() => setShowInfo(!showInfo)} />

      {/* Info banner */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-auto max-w-lg px-5 pt-3 pb-2">
              <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-xl p-4">
                <div className="absolute inset-0 rounded-2xl glass-ring pointer-events-none" />
                <div className="relative z-10 space-y-1.5 text-xs text-gray-500 leading-relaxed">
                  <p>
                    <strong className="text-gray-700">100% local.</strong> Your PDF never leaves your device.
                    Uses T5-small (~308 MB) via ONNX Runtime Web.
                  </p>
                  <p>Built with Transformers.js, pdf.js, and Next.js. No servers, no API keys, no tracking.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        {/* Hero — show when idle and no result */}
        {stage === "idle" && !result && !error && <HeroSection />}

        {/* Upload zone — show when idle or error and no result */}
        {(stage === "idle" || stage === "error") && !result && (
          <div className={stage === "idle" ? "mt-8 relative z-10" : "mt-4 relative z-10"}>
            <UploadZone
              onFile={handleFileReceived}
              onText={handleTextPaste}
              disabled={isProcessing}
              showDialog={showDialog}
              pendingFileName={pendingFile?.name ?? null}
              onDialogConfirm={handleDialogConfirm}
              onDialogCancel={handleDialogCancel}
            />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg mx-auto mt-4 relative z-10"
            >
              <div className="relative overflow-hidden rounded-xl border border-red-200/60 bg-red-50/60 backdrop-blur-xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="mt-0.5 shrink-0 text-red-500">
                    <circle cx="7" cy="7" r="5" /><path d="M7 4.5v3M7 10v.5" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">Error</p>
                    <p className="text-xs text-red-500/70 mt-0.5">{error}</p>
                  </div>
                  <button onClick={reset} className="text-xs text-red-500 underline underline-offset-2 hover:text-red-600 shrink-0">
                    Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Monitor — shows during download / inference */}
        <div className="mt-6 relative z-10">
          <LiveMonitor modelProgress={modelProgress} chunkProgress={chunkProgress} stage={stage} />
        </div>

        {/* Summary result */}
        {result && (
          <div className="relative z-10 w-full flex flex-col items-center">
            <SummaryResult result={result} chunkProgress={chunkProgress} onReset={reset} />
            <SummaryHistory />
          </div>
        )}

        {/* How it works + History — show when idle, no result, no error */}
        {stage === "idle" && !result && !error && (
          <div className="relative z-10 w-full flex flex-col items-center">
            <SummaryHistory />
            <HowItWorks />
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
