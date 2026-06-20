"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SummaryResult as T, ChunkProgress } from "@/types";

interface SummaryResultProps {
  result: T;
  chunkProgress: ChunkProgress | null;
  onReset: () => void;
}

export function SummaryResult({ result, chunkProgress, onReset }: SummaryResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [result.summary]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([result.summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename.replace(".pdf", "_summary.txt");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloading summary...");
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Stats bar */}
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/[0.85] backdrop-blur-xl p-4 shadow-sm">
        <div className="absolute inset-0 rounded-2xl glass-ring pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate pr-4">{result.filename}</p>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopy}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all"
                title="Copy"
              >
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-emerald-500"><path d="M2.5 6.5l3 3 5-5" /></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7.5" height="7.5" rx="1" /><path d="M1.5 9V2A.5.5 0 012 1.5h6.5" /></svg>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all"
                title="Download"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 2v7M4.5 6l2 2 2-2M2 10v.5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V10" /></svg>
              </button>
              <button
                onClick={onReset}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all ml-1"
                title="New summary"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5h9M6.5 2v9" /></svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span>{result.pageCount} pg</span>
            <span className="w-px h-3 bg-gray-300/50" />
            <span>{result.originalWordCount.toLocaleString()} → {result.summaryWordCount.toLocaleString()} words</span>
            <span className="w-px h-3 bg-gray-300/50" />
            <span className="text-blue-600 font-medium">{result.compressionRatio}% compression</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400/60">
            <span>{(result.genTimeMs / 1000).toFixed(1)}s</span>
            <span className="w-px h-2.5 bg-gray-300/30" />
            <span>{result.chunksProcessed} chunks</span>
            <span className="w-px h-2.5 bg-gray-300/30" />
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              client-side: T5-small
            </span>
          </div>

          {chunkProgress && (
            <p className="text-[11px] text-gray-400/60 mt-1">
              Chunk {chunkProgress.index + 1} / {chunkProgress.total} · {chunkProgress.timeMs}s
            </p>
          )}
        </div>
      </div>

      {/* Summary text */}
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/[0.85] backdrop-blur-xl shadow-sm">
        <div className="absolute inset-0 rounded-2xl glass-ring pointer-events-none" />
        <div className="relative z-10 px-5 py-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Summary</p>
          <p className="text-sm leading-[1.8] whitespace-pre-wrap">{result.summary}</p>
        </div>
      </div>
    </motion.div>
  );
}
