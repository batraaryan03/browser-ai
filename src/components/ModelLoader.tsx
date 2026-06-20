"use client";

import type { ModelProgress } from "@/types";
import { MODEL_SIZE_BYTES } from "@/lib/t5";

interface ModelLoaderProps {
  progress: ModelProgress;
}

function formatSpeed(bps: number): string {
  if (bps <= 0) return "—";
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatDur(s: number): string {
  if (s < 1) return `${(s * 1000).toFixed(0)}ms`;
  if (s < 60) return `${s.toFixed(0)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

export function ModelLoader({ progress }: ModelLoaderProps) {
  const remaining = 100 - progress.loaded;
  // ETA = remaining_pct / (speed_bps / total_bytes * 100) => seconds
  const eta = progress.speedBps
    ? remaining / ((progress.speedBps / MODEL_SIZE_BYTES) * 100)
    : null;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-5 shadow-sm">
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 dark:ring-white/5 pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-blue-500 dark:text-blue-400">
                  <circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="8" className="animate-spin [transform-origin:center]" style={{ animationDuration: "1.5s" }} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress.status === "compiling" ? "Compiling model..." : "Downloading AI model"}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(progress.loaded)}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-gray-200/50 dark:bg-gray-700/50">
            <div
              className="h-full rounded-full bg-blue-500/70 dark:bg-blue-400/60 transition-all duration-700 ease-out"
              style={{ width: `${progress.loaded}%` }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 dark:text-gray-500">
            <div>
              <span className="text-gray-400/60">File: </span>
              <span className="font-medium text-gray-500 dark:text-gray-400 truncate block">
                {progress.currentFile ?? "—"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400/60">Speed: </span>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {progress.speedBps ? formatSpeed(progress.speedBps) : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400/60">Size: </span>
              <span className="font-medium text-gray-500 dark:text-gray-400">~{(MODEL_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400/60">ETA: </span>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {eta && eta > 0 && eta < 3600 ? `~${formatDur(eta)}` : "—"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400/50 dark:text-gray-500/50 leading-relaxed">
            Downloaded once, cached in your browser. Subsequent uses need no download.
          </p>
        </div>
      </div>
    </div>
  );
}
