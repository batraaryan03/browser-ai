/**
 * Generic React hook for loading + running Transformers.js vision models
 * with smooth download progress tracking.
 */
"use client";

import { useState, useCallback, useRef } from "react";
import type { VisionProgress } from "@/lib/vision";

export interface ModelLoadState {
  status: "idle" | "downloading" | "compiling" | "ready" | "error";
  progress: number;
  error?: string;
  currentFile?: string;
}

/**
 * Hook for loading and running a vision model with throttled progress.
 * Returns the load state, a run function, and control methods.
 */
export function useVisionModel() {
  const [loadState, setLoadState] = useState<ModelLoadState>({
    status: "idle",
    progress: 0,
  });
  const [running, setRunning] = useState(false);

  // Track last reported progress to throttle UI updates
  const lastReportedRef = useRef(-1);
  const lastTimeRef = useRef(0);

  const makeProgressCallback = useCallback(
    () =>
      (p: VisionProgress) => {
        const now = Date.now();
        const delta = Math.abs(p.progress - lastReportedRef.current);
        const timeDelta = now - lastTimeRef.current;

        // Only update if progress changed by ≥3% or ≥250ms have elapsed
        if (delta >= 3 || timeDelta >= 250) {
          lastReportedRef.current = p.progress;
          lastTimeRef.current = now;

          const rounded = Math.round(p.progress);
          setLoadState({
            status: p.status,
            progress: rounded,
            error: p.error,
            currentFile: p.currentFile,
          });
        }

        if (p.status === "ready") {
          setLoadState({ status: "ready", progress: 100 });
        }
        if (p.status === "error") {
          setLoadState({ status: "error", progress: 0, error: p.error });
        }
      },
    [],
  );

  const resetLoadState = useCallback(() => {
    setLoadState({ status: "idle", progress: 0 });
    lastReportedRef.current = -1;
    lastTimeRef.current = 0;
  }, []);

  return {
    loadState,
    setLoadState,
    running,
    setRunning,
    makeProgressCallback,
    resetLoadState,
  };
}
