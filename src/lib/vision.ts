/**
 * Vision model inference using @huggingface/transformers.
 *
 * Each model downloads from Hugging Face CDN on first use, caches in browser via
 * Cache API, and runs via ONNX Runtime (WebAssembly/WebGPU).
 *
 * Supported pipelines:
 *   - image-classification  → Xenova/vit-base-patch16-224  (~80 MB q4)
 *   - object-detection      → Xenova/yolos-tiny    (~40 MB)
 *   - image-segmentation    → Xenova/segformer-b0-finetuned-ade-512-512  (~15 MB)
 *   - image-to-text (OCR)   → Xenova/trocr-base-printed  (~330 MB)
 */

import { pipeline } from "@huggingface/transformers";

// ─── Custom types (not all exported from @huggingface/transformers) ───

type ProgressInfo = {
  status: string;
  progress?: number;
  file?: string;
  name?: string;
};

type ProgressCb = (progress: ProgressInfo) => void;

/** Image input accepted by Transformers.js pipelines */
type ImageInput = string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | Blob | ImageData | File;

// ─── Model Registry ───────────────────────────────────────────────────

export type VisionTask =
  | "image-classification"
  | "object-detection"
  | "image-segmentation"
  | "image-to-text";

export interface VisionModelConfig {
  task: VisionTask;
  modelId: string;
  /** Human-readable name */
  name: string;
  /** Approximate download size in bytes (quantized fp32) */
  sizeBytes: number;
  /** Load opts */
  dtype?: "fp32" | "q4" | "q8";
}

export const VISION_MODELS: Record<string, VisionModelConfig> = {
  classify: {
    task: "image-classification",
    modelId: "Xenova/vit-base-patch16-224",
    name: "ViT-base-patch16-224",
    sizeBytes: 80_000_000,
    dtype: "q4",
  },
  detect: {
    task: "object-detection",
    modelId: "Xenova/yolos-tiny",
    name: "YOLOS-tiny",
    sizeBytes: 40_000_000,
    dtype: "fp32",
  },
  segment: {
    task: "image-segmentation",
    modelId: "Xenova/segformer-b0-finetuned-ade-512-512",
    name: "SegFormer-B0",
    sizeBytes: 15_000_000,
    dtype: "fp32",
  },
  ocr: {
    task: "image-to-text",
    modelId: "Xenova/trocr-base-printed",
    name: "TrOCR-base",
    sizeBytes: 330_000_000,
    dtype: "fp32",
  },
};

// ─── Pipeline Registry (singletons) ───────────────────────────────────

interface PipelineCache {
  "image-classification"?: unknown;
  "object-detection"?: unknown;
  "image-segmentation"?: unknown;
  "image-to-text"?: unknown;
}

const pipelines: PipelineCache = {};
const loadingPromises: Partial<Record<VisionTask, Promise<any>>> = {};

// ─── Progress Types ───────────────────────────────────────────────────

export interface VisionProgress {
  status: "downloading" | "compiling" | "ready" | "error";
  /** Progress 0-100 */
  progress: number;
  /** Current file being downloaded */
  currentFile?: string;
  error?: string;
}

function makeProgressCallback(
  onProgress: (p: VisionProgress) => void,
): ProgressCb {
  return (progress: ProgressInfo) => {
    if (progress.status === "progress" || progress.status === "download") {
      onProgress({
        status: "downloading",
        progress: progress.progress ?? 0,
        currentFile: progress.name ?? progress.file ?? "model",
      });
    } else if (
      progress.status === "init" ||
      progress.status === "compile" ||
      progress.status === "loading"
    ) {
      onProgress({ status: "compiling", progress: 0 });
    } else if (progress.status === "ready") {
      onProgress({ status: "ready", progress: 100 });
    }
  };
}

// ─── Pipeline Loader ──────────────────────────────────────────────────

async function loadPipeline<T>(
  task: VisionTask,
  modelId: string,
  onProgress: (p: VisionProgress) => void,
  dtype = "fp32",
): Promise<T> {
  if ((pipelines as any)[task]) return (pipelines as any)[task] as T;
  if (loadingPromises[task]) return loadingPromises[task] as Promise<T>;

  loadingPromises[task] = (async () => {
    try {
      onProgress({ status: "downloading", progress: 0, currentFile: "Preparing..." });

      const pipe = (await pipeline(task as any, modelId, {
        dtype,
        progress_callback: makeProgressCallback(onProgress),
      } as any)) as T;

      (pipelines as any)[task] = pipe;
      onProgress({ status: "ready", progress: 100 });
      return pipe;
    } catch (err) {
      loadingPromises[task] = undefined;
      const msg = err instanceof Error ? err.message : "Failed to load model";
      onProgress({ status: "error", progress: 0, error: msg });
      throw err;
    }
  })();

  return loadingPromises[task] as Promise<T>;
}

// ─── Public Inference Functions ───────────────────────────────────────

/**
 * Classify an image into ImageNet categories.
 * Returns { label, score }[] sorted by confidence descending.
 */
export async function classifyImage(
  image: ImageInput,
  onProgress: (p: VisionProgress) => void,
): Promise<{ label: string; score: number }[]> {
  const cfg = VISION_MODELS.classify;
  const pipe: any = await loadPipeline<any>(cfg.task, cfg.modelId, onProgress, cfg.dtype);
  const result = await pipe(image);
  return result as any;
}

/**
 * Detect objects in an image (80 COCO classes).
 * Returns { label, score, box: { xmin, ymin, xmax, ymax } }[].
 */
export async function detectObjects(
  image: ImageInput,
  onProgress: (p: VisionProgress) => void,
): Promise<
  { label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }[]
> {
  const cfg = VISION_MODELS.detect;
  const pipe: any = await loadPipeline<any>(cfg.task, cfg.modelId, onProgress, cfg.dtype);
  const result = await pipe(image, { threshold: 0.5 });
  return result as any;
}

/**
 * Distinct color palette for segmentation overlay rendering.
 * Each class gets a semi-transparent color from this palette.
 */
const SEGMENT_COLORS: [number, number, number][] = [
  [255, 50, 50], [50, 255, 50], [50, 50, 255], [255, 255, 50], [255, 50, 255],
  [50, 255, 255], [200, 100, 0], [0, 200, 100], [100, 0, 200], [200, 0, 100],
  [100, 200, 0], [0, 100, 200], [200, 100, 100], [100, 200, 100], [100, 100, 200],
  [200, 150, 0], [0, 200, 150], [150, 0, 200], [200, 0, 150], [150, 200, 0],
  [0, 150, 200], [200, 150, 150], [150, 200, 150], [150, 150, 200], [255, 100, 100],
  [100, 255, 100], [100, 100, 255], [255, 200, 100], [255, 100, 200], [200, 255, 100],
];

/**
 * Render a colored segmentation overlay from per-class masks.
 * Returns a data URL of the overlay (semi-transparent colored regions).
 */
function renderSegmentationOverlay(segments: any[]): string | null {
  if (!segments || segments.length === 0) return null;

  // Determine canvas size from the first mask
  const first = segments[0];
  let width = 512;
  let height = 512;
  if (first.mask) {
    width = first.mask.width || 512;
    height = first.mask.height || 512;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Clear with transparent background
  ctx.clearRect(0, 0, width, height);

  // Composite each class mask with its color
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const mask = seg.mask;
    if (!mask || !mask.data) continue;

    const [r, g, b] = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const maskData = mask.data as Uint8Array;

    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;

    for (let j = 0; j < maskData.length && j < width * height; j++) {
      if (maskData[j] > 64) {
        pixels[j * 4] = r;
        pixels[j * 4 + 1] = g;
        pixels[j * 4 + 2] = b;
        pixels[j * 4 + 3] = 160; // semi-transparent
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  return canvas.toDataURL();
}

/**
 * Segment an image into semantic regions.
 *
 * Renders a colored overlay from raw masks (to prevent OOM from holding
 * all masks in memory) and returns only lightweight label data + overlay image.
 *
 * Returns { labels: { label, score }[], overlayUrl: string | null }.
 */
export async function segmentImage(
  image: ImageInput,
  onProgress: (p: VisionProgress) => void,
): Promise<{
  labels: { label: string; score: number }[];
  overlayUrl: string | null;
}> {
  const cfg = VISION_MODELS.segment;
  const pipe: any = await loadPipeline<any>(cfg.task, cfg.modelId, onProgress, cfg.dtype);
  const segments = await pipe(image);
  const arr = Array.isArray(segments) ? segments : [segments];

  // Render overlay first (while masks are still in memory)
  const overlayUrl = renderSegmentationOverlay(arr);

  // Extract only labels + scores, discard mask data
  const labelMap = new Map<string, number>();
  for (const s of arr) {
    const label = typeof s.label === "string" ? s.label : "Unknown";
    const score = typeof s.score === "number" ? s.score : 0;
    if (!labelMap.has(label) || score > labelMap.get(label)!) {
      labelMap.set(label, score);
    }
  }

  const labels = Array.from(labelMap.entries())
    .map(([label, score]) => ({ label, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30); // Top 30 to avoid overwhelming UI

  return { labels, overlayUrl };
}

/**
 * Extract text from an image (OCR).
 * Returns the recognized text string.
 */
export async function ocrImage(
  image: ImageInput,
  onProgress: (p: VisionProgress) => void,
): Promise<string> {
  const cfg = VISION_MODELS.ocr;
  const pipe: any = await loadPipeline<any>(cfg.task, cfg.modelId, onProgress, cfg.dtype);
  const result = await pipe(image);
  const items = result as { generated_text: string }[];
  return items[0]?.generated_text ?? "";
}

/**
 * Load a vision model without running inference (pre-cache).
 */
export async function preloadVisionModel(
  slug: string,
  onProgress: (p: VisionProgress) => void,
): Promise<void> {
  const cfg = VISION_MODELS[slug];
  if (!cfg) throw new Error(`Unknown vision model: ${slug}`);
  await loadPipeline<any>(cfg.task, cfg.modelId, onProgress, cfg.dtype);
}

/**
 * Check if a pipeline is already loaded and ready.
 */
export function isVisionModelLoaded(slug: string): boolean {
  const cfg = VISION_MODELS[slug];
  if (!cfg) return false;
  return !!(pipelines as any)[cfg.task];
}

/**
 * Release a vision pipeline from memory.
 */
export function releaseVisionModel(slug: string): void {
  const cfg = VISION_MODELS[slug];
  if (!cfg) return;
  delete (pipelines as any)[cfg.task];
  delete loadingPromises[cfg.task];
}
