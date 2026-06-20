"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { extractText } from "@/lib/pdf";
import { getPipeline, summarize } from "@/lib/t5";
import { saveSummary } from "@/lib/store";
import type { ModelProgress, ChunkProgress, SummaryResult } from "@/types";

export function useSummarizer() {
  const [stage, setStage] = useState<"idle" | "extracting" | "loading" | "summarizing" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState<ModelProgress | null>(null);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      processingRef.current = false;
    };
  }, []);

  const processFile = useCallback(async (f: File) => {
    if (processingRef.current || !mountedRef.current) return;
    processingRef.current = true;

    setFile(f);
    setResult(null);
    setError(null);
    setChunkProgress(null);
    setModelProgress(null);

    try {
      // Step 1: Extract text
      if (!mountedRef.current) return;
      setStage("extracting");
      const extraction = await extractText(f);
      if (!mountedRef.current) return;

      if (!extraction.text.trim()) {
        throw new Error("No text could be extracted from this PDF.");
      }

      // Step 2: Load model
      if (!mountedRef.current) return;
      setStage("loading");
      await getPipeline((p) => {
        if (mountedRef.current) setModelProgress({ ...p });
      });
      if (!mountedRef.current) return;

      // Step 3: Summarize
      setStage("summarizing");
      setModelProgress(null);

      abortRef.current = new AbortController();
      const genStart = performance.now();
      const summaryText = await summarize(
        extraction.text,
        (c) => {
          if (mountedRef.current) setChunkProgress({ ...c });
        },
        abortRef.current.signal,
      );
      if (!mountedRef.current) return;

      const genTimeMs = Math.round(performance.now() - genStart);

      if (!summaryText.trim()) throw new Error("Summary generation failed.");

      const originalWords = extraction.text.split(/\s+/).length;
      const summaryWords = summaryText.split(/\s+/).length;

      // Step 4: Save
      if (!mountedRef.current) return;
      setStage("saving");
      const summaryResult: SummaryResult = {
        id: uuidv4(),
        filename: extraction.filename,
        original: extraction.text,
        summary: summaryText,
        pageCount: extraction.pageCount,
        originalWordCount: originalWords,
        summaryWordCount: summaryWords,
        chunksProcessed: Math.ceil(originalWords / 380),
        genTimeMs,
        compressionRatio: Math.round((summaryWords / originalWords) * 1000) / 10,
        createdAt: new Date().toISOString(),
      };

      await saveSummary(summaryResult);
      if (!mountedRef.current) return;

      setResult(summaryResult);
      setStage("done");
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      if (err instanceof DOMException && err.name === "AbortError") {
        setStage("idle");
        return;
      }
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setStage("error");
    } finally {
      processingRef.current = false;
    }
  }, []);

  /** Process plain text directly (skips PDF extraction) */
  const processText = useCallback(async (text: string, filename = "pasted-text.txt") => {
    if (processingRef.current || !mountedRef.current) return;
    processingRef.current = true;

    setFile(null);
    setResult(null);
    setError(null);
    setChunkProgress(null);
    setModelProgress(null);

    try {
      if (!mountedRef.current) return;
      setStage("extracting");

      const cleaned = text.replace(/\s+/g, " ").trim();
      if (!cleaned || cleaned.length < 50) throw new Error("Please paste at least 50 characters.");
      const wordCount = cleaned.split(/\s+/).length;

      if (!mountedRef.current) return;
      setStage("loading");
      await getPipeline((p) => { if (mountedRef.current) setModelProgress({ ...p }); });
      if (!mountedRef.current) return;

      setStage("summarizing");
      setModelProgress(null);

      abortRef.current = new AbortController();
      const genStart = performance.now();
      const summaryText = await summarize(cleaned, (c) => {
        if (mountedRef.current) setChunkProgress({ ...c });
      }, abortRef.current.signal);
      if (!mountedRef.current) return;

      const genTimeMs = Math.round(performance.now() - genStart);
      if (!summaryText.trim()) throw new Error("Summary generation failed.");

      const summaryWords = summaryText.split(/\s+/).length;

      if (!mountedRef.current) return;
      setStage("saving");
      const summaryResult: SummaryResult = {
        id: uuidv4(),
        filename,
        original: cleaned,
        summary: summaryText,
        pageCount: 1,
        originalWordCount: wordCount,
        summaryWordCount: summaryWords,
        chunksProcessed: Math.ceil(wordCount / 380),
        genTimeMs,
        compressionRatio: Math.round((summaryWords / wordCount) * 1000) / 10,
        createdAt: new Date().toISOString(),
      };

      await saveSummary(summaryResult);
      if (!mountedRef.current) return;
      setResult(summaryResult);
      setStage("done");
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      if (err instanceof DOMException && err.name === "AbortError") { setStage("idle"); return; }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    } finally {
      processingRef.current = false;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    processingRef.current = false;
    setStage("idle");
    setModelProgress(null);
    setChunkProgress(null);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    processingRef.current = false;
    setStage("idle");
    setError(null);
    setModelProgress(null);
    setChunkProgress(null);
    setResult(null);
    setFile(null);
  }, []);

  return {
    stage,
    error,
    modelProgress,
    chunkProgress,
    result,
    file,
    processFile,
    processText,
    abort,
    reset,
  };
}
