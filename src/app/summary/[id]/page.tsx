"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { getSummary, deleteSummary } from "@/lib/store";
import type { SummaryResult } from "@/types";
import { Navbar } from "@/components/Navbar";

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      getSummary(params.id as string).then((s) => {
        setSummary(s);
        setLoading(false);
      });
    }
  }, [params.id]);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.summary);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary.summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = summary.filename.replace(".pdf", "_summary.txt");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloading summary...");
  };

  const handleDelete = async () => {
    if (!summary) return;
    await deleteSummary(summary.id);
    toast.success("Summary deleted");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-400 animate-spin-slow">
          <circle cx="9" cy="9" r="6" strokeDasharray="28" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[var(--bg)]">
        <p className="text-sm text-gray-500">Summary not found</p>
        <button onClick={() => router.push("/")} className="text-xs text-black underline underline-offset-4">back to home</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar showBack />

      {/* Action bar */}
      <div className="border-b border-black/[0.04]">
        <div className="mx-auto max-w-2xl px-5 h-11 flex items-center justify-between">
          <p className="text-sm font-medium truncate pr-4">{summary.filename}</p>

          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors" title="Copy">
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-black"><path d="M2.5 6.5l3 3 5-5" /></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square"><rect x="4" y="4" width="7.5" height="7.5" /><path d="M1.5 9V2A.5.5 0 012 1.5h6.5" /></svg>
              )}
            </button>
            <button onClick={handleDownload} className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors" title="Download">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square"><path d="M6.5 2v7M4.5 6l2 2 2-2M2 10v.5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V10" /></svg>
            </button>
            <button onClick={handleDelete} className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors" title="Delete">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square"><path d="M3 3.5h7M4.5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5 5v4.5M8 5v4.5M2.5 3.5h8" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Stats */}
          <div className="bg-white p-4 mb-4">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{summary.pageCount} pg</span>
              <span className="w-px h-3 bg-gray-300/50" />
              <span>{summary.originalWordCount.toLocaleString()} → {summary.summaryWordCount.toLocaleString()} words</span>
              <span className="w-px h-3 bg-gray-300/50" />
              <span className="text-black font-medium">{summary.compressionRatio}%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {(summary.genTimeMs / 1000).toFixed(1)}s · {summary.chunksProcessed} chunks · T5-small · local AI
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Summary</p>
            <p className="text-sm leading-[1.8] whitespace-pre-wrap">{summary.summary}</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
