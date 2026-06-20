"use client";

import type { ModelProgress, ChunkProgress } from "@/types";
import { MODEL_SIZE_BYTES } from "@/lib/t5";

interface LiveMonitorProps {
  modelProgress: ModelProgress | null;
  chunkProgress: ChunkProgress | null;
  stage: string;
}

function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(0)} MB`;
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

export function LiveMonitor({ modelProgress, chunkProgress, stage }: LiveMonitorProps) {
  const isDownloading = modelProgress?.status === "downloading" || modelProgress?.status === "compiling";
  const isSummarizing = stage === "summarizing";
  const isReady = modelProgress?.status === "ready";

  if (!isDownloading && !isSummarizing && !isReady) return null;

  const remaining = modelProgress ? 100 - modelProgress.loaded : 0;
  const eta = modelProgress?.speedBps
    ? remaining / ((modelProgress.speedBps / MODEL_SIZE_BYTES) * 100)
    : null;

  const hasPerf = typeof performance !== "undefined" && (performance as any).memory;
  const heap = hasPerf ? (performance as any).memory.usedJSHeapSize : null;
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : null;
  const conn = typeof navigator !== "undefined" ? (navigator as any).connection : null;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/[0.85] backdrop-blur-xl shadow-sm">
        <div className="absolute inset-0 rounded-2xl glass-ring pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-black/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-gray-400">
              <circle cx="6" cy="6" r="5" />
              <path d="M6 3v3.5l2 1" />
            </svg>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {isDownloading ? "Downloading model" : isSummarizing ? "Running inference" : "Model ready"}
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${
              isDownloading ? "bg-blue-500" : isSummarizing ? "bg-amber-500" : "bg-emerald-500"
            }`} />
            <span className="text-[10px] text-gray-400/60">
              {isDownloading ? "downloading" : isSummarizing ? "processing" : "idle"}
            </span>
          </span>
        </div>

        {/* Body */}
        <div className="relative z-10 grid grid-cols-1 divide-y divide-black/[0.04] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {/* Column 1: Download */}
          <div className="p-4">
            {isDownloading && modelProgress ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-400/60">Model files</span>
                    <span className="text-[10px] text-gray-400/60">{Math.round(modelProgress.loaded)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full bg-blue-500/60 transition-all duration-700 ease-out"
                      style={{ width: `${modelProgress.loaded}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px] text-gray-400/60">
                  <div className="flex justify-between">
                    <span>Progress</span>
                    <span className="font-medium text-gray-500">
                      {formatBytes((modelProgress.loaded / 100) * MODEL_SIZE_BYTES)} / {formatBytes(MODEL_SIZE_BYTES)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed</span>
                    <span className="font-medium text-gray-500">{modelProgress.speedBps ? formatSpeed(modelProgress.speedBps) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETA</span>
                    <span className="font-medium text-gray-500">{eta && eta > 0 && eta < 3600 ? `~${formatDur(eta)}` : "—"}</span>
                  </div>
                  {modelProgress.currentFile && (
                    <div className="flex justify-between">
                      <span>File</span>
                      <span className="font-medium text-gray-500 truncate max-w-[120px] text-right">{modelProgress.currentFile}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : isReady ? (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-500">
                  <path d="M3 7l3 3 5-5" />
                </svg>
                <p className="mt-1 text-xs font-medium text-emerald-600">Model ready</p>
                <p className="text-[10px] text-gray-400/60">Cached locally</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <p className="text-xs text-gray-400/60">N/A</p>
              </div>
            )}
          </div>

          {/* Column 2: Inference */}
          <div className="p-4">
            {isSummarizing && chunkProgress ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-400/60">Chunks</span>
                    <span className="text-[10px] text-gray-400/60">{chunkProgress.index + 1} / {chunkProgress.total}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full bg-amber-500/60 transition-all duration-500"
                      style={{ width: `${((chunkProgress.index + 1) / chunkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px] text-gray-400/60">
                  <div className="flex justify-between">
                    <span>Chunk time</span>
                    <span className="font-medium text-gray-500">{chunkProgress.timeMs}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining</span>
                    <span className="font-medium text-gray-500">
                      ~{((chunkProgress.total - chunkProgress.index - 1) * chunkProgress.timeMs).toFixed(0)}s
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <p className="text-xs text-gray-400/60">
                  {isReady ? "Drag a PDF to start" : "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* Column 3: System */}
          <div className="p-4">
            <div className="space-y-0.5 text-[10px] text-gray-400/60">
              <div className="flex justify-between">
                <span>Memory</span>
                <span className="font-medium text-gray-500">{heap ? formatBytes(heap) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>CPU cores</span>
                <span className="font-medium text-gray-500">{cores ?? "—"}</span>
              </div>
              {conn && (
                <>
                  <div className="flex justify-between">
                    <span>Network</span>
                    <span className="font-medium text-gray-500">{conn.effectiveType?.toUpperCase() ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downlink</span>
                    <span className="font-medium text-gray-500">{conn.downlink ? `${conn.downlink.toFixed(1)} Mbps` : "—"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
