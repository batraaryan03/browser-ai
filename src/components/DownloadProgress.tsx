"use client";

import { useState, useEffect, useRef } from "react";
import { formatBytes } from "@/lib/models";

interface DownloadProgressProps {
  /** 0-100 */
  loaded: number;
  total: number;
  label?: string;
  sizeBytes: number;
  status: "downloading" | "compiling" | "ready";
  /** Optional ETA in seconds */
  eta?: number | null;
  /** Optional speed in bytes/sec */
  speedBps?: number;
}

function formatSpeed(bps: number): string {
  if (bps <= 0) return "—";
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(s: number): string {
  if (s < 1) return `${(s * 1000).toFixed(0)}ms`;
  if (s < 60) return `${s.toFixed(0)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  return `>1h`;
}

export function DownloadProgress({
  loaded,
  total,
  label,
  sizeBytes,
  status,
  eta,
  speedBps,
}: DownloadProgressProps) {
  // Smooth displayed value — animated from previous to current
  const [displayPct, setDisplayPct] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = loaded;
    const prev = prevRef.current;
    if (target === prev) return;

    // Animate smoothly from prev to target over 300ms
    const start = prev;
    const diff = target - start;
    const duration = Math.min(300, Math.abs(diff) * 8);
    const startTime = performance.now();

    let raf: number;
    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayPct(start + diff * ease);
      if (t < 1) raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    prevRef.current = target;

    return () => cancelAnimationFrame(raf);
  }, [loaded]);

  const rounded = Math.round(displayPct);

  const downloadedBytes = Math.round((loaded / 100) * sizeBytes);
  const remainingPct = 100 - loaded;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-3">
          <div className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="square"
              className={status === "compiling" ? "text-gray-400" : "text-black"}
            >
              {status === "compiling" ? (
                <>
                  <circle cx="6" cy="6" r="5" strokeDasharray="20" strokeDashoffset="5" />
                </>
              ) : (
                <>
                  <circle cx="6" cy="6" r="5" />
                  <path d="M6 3v3.5l2 1" />
                </>
              )}
            </svg>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {status === "downloading" ? "Downloading" : status === "compiling" ? "Compiling" : "Ready"}
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block h-1.5 w-1.5 ${
                status === "downloading" ? "bg-black" : status === "compiling" ? "bg-gray-500" : "bg-black"
              }`}
            />
            <span className="text-[10px] text-gray-400">{rounded}%</span>
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Bar */}
          <div className="h-1 bg-black/[0.06] overflow-hidden">
            <div
              className="h-full bg-black/20 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(rounded, 100)}%` }}
            />
          </div>

          {/* Info rows */}
          <div className="space-y-0.5 text-[10px] text-gray-400">
            {label && (
              <div className="flex justify-between">
                <span>Model</span>
                <span className="font-medium text-gray-500 truncate max-w-[160px] text-right">{label}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Progress</span>
              <span className="font-medium text-gray-500">
                {formatBytes(downloadedBytes)} / {formatBytes(sizeBytes)}
              </span>
            </div>
            {speedBps !== undefined && (
              <div className="flex justify-between">
                <span>Speed</span>
                <span className="font-medium text-gray-500">{formatSpeed(speedBps)}</span>
              </div>
            )}
            {eta !== null && eta !== undefined && eta > 0 && eta < 3600 && (
              <div className="flex justify-between">
                <span>ETA</span>
                <span className="font-medium text-gray-500">~{formatEta(eta)}</span>
              </div>
            )}
            {status === "compiling" && (
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-medium text-gray-500">Optimizing for your device</span>
              </div>
            )}
            {remainingPct > 0 && status === "downloading" && (
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="font-medium text-gray-500">{formatBytes(sizeBytes - downloadedBytes)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
