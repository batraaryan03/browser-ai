/**
 * T5-small ONNX pipeline using @huggingface/transformers.
 * Runs entirely in-browser via WebAssembly ONNX Runtime.
 * Model: Xenova/t5-small (fp32, ~308MB, ~60M params)
 *
 * Uses a singleton pattern - model loads once, cached in IndexedDB.
 * Chunks long text with overlap to stay within T5's 512-token limit.
 */
import { pipeline } from "@huggingface/transformers";
import type { Text2TextGenerationPipeline } from "@huggingface/transformers";
import type { ModelProgress, ChunkProgress } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────

/** Total download size of Xenova/t5-small fp32 in bytes (encoder + decoder) */
export const MODEL_SIZE_BYTES = 308_000_000;

// ─── Singleton ────────────────────────────────────────────────────────

let t5Pipeline: Text2TextGenerationPipeline | null = null;
let loadingPromise: Promise<Text2TextGenerationPipeline> | null = null;

// ─── Chunking ─────────────────────────────────────────────────────────

const MAX_WORDS = 380;
const OVERLAP_WORDS = 20;

function chunkText(text: string): string[] {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS) return [text];
  const step = MAX_WORDS - OVERLAP_WORDS;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += step) {
    chunks.push(words.slice(i, i + MAX_WORDS).join(" "));
    if (i + MAX_WORDS >= words.length) break;
  }
  return chunks;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 100_000);
}

// ─── Pipeline Loader ──────────────────────────────────────────────────

export async function getPipeline(
  onProgress?: (p: ModelProgress) => void,
): Promise<Text2TextGenerationPipeline> {
  if (t5Pipeline) return t5Pipeline;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      onProgress?.({ status: "downloading", loaded: 0, total: 100, currentFile: "Preparing..." });

      t5Pipeline = (await pipeline("text2text-generation", "Xenova/t5-small", {
        dtype: "fp32",
        progress_callback: (p: any) => {
          if (p.status === "progress" || p.status === "download") {
            onProgress?.({
              status: "downloading",
              loaded: p.progress ?? 0,
              total: 100,
              currentFile: p.name ?? p.file ?? "model",
            });
          }
          if (p.status === "init") {
            onProgress?.({ status: "compiling", loaded: 0, total: 0 });
          }
        },
      } as any)) as unknown as Text2TextGenerationPipeline;

      onProgress?.({ status: "ready", loaded: 100, total: 100 });
      return t5Pipeline!;
    } catch (err) {
      loadingPromise = null;
      const msg = err instanceof Error ? err.message : "Failed to load model";
      onProgress?.({ status: "error", loaded: 0, total: 0, error: msg });
      throw err;
    }
  })();

  return loadingPromise;
}

export function resetPipeline(): void {
  t5Pipeline = null;
  loadingPromise = null;
}

// ─── Summarization ────────────────────────────────────────────────────

export async function summarize(
  text: string,
  onChunk?: (c: ChunkProgress) => void,
  signal?: AbortSignal,
): Promise<string> {
  const pipe = await getPipeline();
  const cleaned = cleanText(text);
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/);
  if (words.length < 50) return cleaned;

  const chunks = chunkText(cleaned);
  const results: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    await new Promise((r) => setTimeout(r, 0)); // yield to UI

    const start = performance.now();
    const output = await pipe(`summarize: ${chunks[i]}`, {
      max_new_tokens: 150,
      temperature: 0.7,
      do_sample: true,
      num_beams: 1,
    });
    const elapsed = performance.now() - start;

    const text = (Array.isArray(output) ? output[0]?.generated_text : (output as any)?.generated_text) ?? "";
    const trimmed = text.trim();
    results.push(trimmed);

    onChunk?.({ index: i, total: chunks.length, timeMs: Math.round(elapsed * 100) / 100, text: trimmed });
  }

  return results.join("\n\n").replace(/^./, (c) => c.toUpperCase());
}
