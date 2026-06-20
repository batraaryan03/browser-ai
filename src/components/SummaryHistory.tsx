"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { getAllSummaries, deleteSummary } from "@/lib/store";
import type { SummaryResult } from "@/types";

export function SummaryHistory() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<SummaryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    getAllSummaries().then((s) => {
      setSummaries(s);
      setLoading(false);
    });
  }, []);

  const filtered = search
    ? summaries.filter((s) => s.filename.toLowerCase().includes(search.toLowerCase()))
    : summaries;

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    try {
      await deleteSummary(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      toast.success("Summary deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }, []);

  const totalWords = summaries.reduce((s, x) => s + x.originalWordCount, 0);
  const totalPages = summaries.reduce((s, x) => s + x.pageCount, 0);
  const avgCompression = summaries.length > 0
    ? Math.round(summaries.reduce((s, x) => s + x.compressionRatio, 0) / summaries.length)
    : 0;

  if (loading || summaries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-2xl mx-auto mt-16"
    >
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Summaries", value: summaries.length },
          { label: "Words Analyzed", value: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords.toLocaleString() },
          { label: "Pages", value: totalPages },
          { label: "Avg Compression", value: avgCompression > 0 ? `${avgCompression}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl border border-black/[0.06] bg-white/[0.85] backdrop-blur-xl px-3.5 py-3">
            <div className="absolute inset-0 rounded-xl glass-ring pointer-events-none" />
            <p className="relative z-10 text-[10px] font-medium uppercase tracking-wider text-gray-400/60">{s.label}</p>
            <p className="relative z-10 mt-1 text-lg font-medium">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="search by filename..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border-b border-black/[0.06] bg-transparent pb-2 text-sm focus:border-blue-400/40 focus:outline-none transition-colors placeholder:text-gray-400/50"
      />

      {/* List */}
      <div className="mt-4 space-y-0 divide-y divide-black/[0.04]">
        <AnimatePresence mode="popLayout">
          {filtered.map((s) => (
            <motion.div
              key={s.id}
              layout
              exit={{ opacity: 0, x: -10, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center justify-between py-3"
            >
              <button
                onClick={() => router.push(`/summary/${s.id}`)}
                className="flex items-center gap-3 min-w-0 text-left flex-1"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <path d="M9 1v3a1 1 0 001 1h3M3 13h8a2 2 0 002-2V5l-4-4H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[180px] sm:max-w-[350px]">{s.filename}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{s.pageCount} pg</span>
                    <span>·</span>
                    <span>{s.summaryWordCount.toLocaleString()} words</span>
                    <span>·</span>
                    <span className="text-blue-500">{s.compressionRatio}%</span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="rounded p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete"
                >
                  {deleting === s.id ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M3 3.5h7M4.5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5 5v4.5M8 5v4.5M2.5 3.5h8" /></svg>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {search && filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 mt-6">no matches</p>
      )}
    </motion.div>
  );
}
