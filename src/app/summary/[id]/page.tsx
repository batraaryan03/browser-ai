"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { getSummary, deleteSummary } from "@/lib/store";
import type { SummaryResult } from "@/types";
import { Navbar } from "@/components/Navbar";

type Tab = "summary";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
];

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

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
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-gray-400 animate-spin-slow">
          <circle cx="9" cy="9" r="6" strokeDasharray="28" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[var(--bg)]">
        <p className="text-sm text-gray-500">Summary not found</p>
        <button onClick={() => router.push("/")} className="text-xs text-blue-500 underline underline-offset-2">back to home</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar showBack />

      {/* Tabs bar */}
      <div className="border-b border-black/[0.04]">
        <div className="mx-auto max-w-5xl px-5 py-0 flex items-center justify-between">
          <div className="flex items-center gap-0.5 rounded-lg bg-white/70 p-0.5 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all" title="Copy">
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-emerald-500"><path d="M2.5 6.5l3 3 5-5" /></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7.5" height="7.5" rx="1" /><path d="M1.5 9V2A.5.5 0 012 1.5h6.5" /></svg>
              )}
            </button>
            <button onClick={handleDownload} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all" title="Download">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 2v7M4.5 6l2 2 2-2M2 10v.5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V10" /></svg>
            </button>
            <button onClick={handleDelete} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-black/[0.04] transition-all" title="Delete">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M3 3.5h7M4.5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5 5v4.5M8 5v4.5M2.5 3.5h8" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 pt-6 pb-16">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Stats */}
          <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/[0.85] backdrop-blur-xl p-4 shadow-sm mb-4">
            <div className="absolute inset-0 rounded-2xl glass-ring pointer-events-none" />
            <div className="relative z-10">
              <p className="text-sm font-medium">{summary.filename}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{summary.pageCount} pg</span>
                <span className="w-px h-3 bg-gray-300/50" />
                <span>{summary.originalWordCount.toLocaleString()} → {summary.summaryWordCount.toLocaleString()} words</span>
                <span className="w-px h-3 bg-gray-300/50" />
                <span className="text-blue-600 font-medium">{summary.compressionRatio}%</span>
              </div>
              <p className="text-[11px] text-gray-400/60 mt-1">
                {(summary.genTimeMs / 1000).toFixed(1)}s · {summary.chunksProcessed} chunks · T5-small · local AI
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/[0.85] backdrop-blur-xl shadow-sm">
            <div className="absolute inset-0 rounded-2xl glass-ring pointer-events-none" />
            <div className="relative z-10 px-5 py-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Summary</p>
              <p className="text-sm leading-[1.8] whitespace-pre-wrap">{summary.summary}</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
