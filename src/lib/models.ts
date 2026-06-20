/**
 * Model registry — central catalog of all browser-available models.
 * Each model has a unique slug, metadata, and is mapped to a route.
 *
 * All vision models use Transformers.js (image-classification, object-detection,
 * image-segmentation, image-to-text). Background removal uses onnxruntime-web
 * directly with RMBG-1.4 ONNX model.
 *
 * Models are downloaded on-demand from Hugging Face CDN and cached in the
 * browser's Cache API automatically by Transformers.js.
 */

export type ModelCategory = "text" | "vision" | "training";

export interface ModelInfo {
  slug: string;
  name: string;
  description: string;
  category: ModelCategory;
  /** Transformers.js model ID or path */
  repo: string;
  /** Download size in bytes (quantized fp32) */
  sizeBytes: number;
  /** Pipeline task name */
  task: string;
  /** Whether this model can be used offline after initial download */
  offlineCapable: boolean;
  /** Recommended dtype */
  dtype: string;
  /** Whether the model page is fully built with real inference */
  enabled: boolean;
}

const MODELS: ModelInfo[] = [
  // ── Text Models ─────────────────────────────────────────────────────
  {
    slug: "summarize",
    name: "Summarization",
    description:
      "Distill PDFs, articles, and long text into concise summaries using T5-small (60M params). Runs entirely in-browser via Transformers.js + ONNX Runtime Web.",
    category: "text",
    repo: "Xenova/t5-small",
    sizeBytes: 308_000_000,
    task: "text2text-generation",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },

  // ── Vision Models (Transformers.js) ─────────────────────────────────
  {
    slug: "remove-bg",
    name: "Background Removal",
    description:
      "Remove backgrounds from portraits and product photos using RMBG-1.4 (~44 MB ONNX). Upload an image, get a clean cutout. Powered by ONNX Runtime Web with WebGPU acceleration.",
    category: "vision",
    repo: "briaai/RMBG-1.4",
    sizeBytes: 44_400_000,
    task: "background-removal",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },
  {
    slug: "classify",
    name: "Image Classifier",
    description:
      "Classify any image into 1,000 ImageNet categories. Uses MobileNet-v2 (~25 MB) via Transformers.js. Runs entirely in-browser with ONNX Runtime Web.",
    category: "vision",
    repo: "Xenova/mobilenet-v2",
    sizeBytes: 25_000_000,
    task: "image-classification",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },
  {
    slug: "detect",
    name: "Object Detection",
    description:
      "Detect and locate 80 COCO object types (people, cars, animals). Uses YOLOS-tiny (~40 MB) via Transformers.js. Pure-transformer object detector running client-side.",
    category: "vision",
    repo: "Xenova/yolos-tiny",
    sizeBytes: 40_000_000,
    task: "object-detection",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },
  {
    slug: "segment",
    name: "Segmentation",
    description:
      "Segment images into 150 semantic classes at the pixel level. Uses SegFormer-B0 (~15 MB) — the smallest transformer segmentation model. Via Transformers.js.",
    category: "vision",
    repo: "Xenova/segformer-b0-finetuned-ade-512-512",
    sizeBytes: 15_000_000,
    task: "image-segmentation",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },
  {
    slug: "ocr",
    name: "Text Recognition (OCR)",
    description:
      "Extract printed text from images using TrOCR-base (~330 MB). A transformer-based OCR model by Microsoft. Runs entirely in-browser via Transformers.js.",
    category: "vision",
    repo: "Xenova/trocr-base-printed",
    sizeBytes: 330_000_000,
    task: "image-to-text",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },

  // ── Training ────────────────────────────────────────────────────────
  {
    slug: "train",
    name: "Model Training",
    description:
      "Train small models entirely in your browser (character-level LSTM personality training), or use your own GPU for advanced fine-tuning via the BYO GPU workflow.",
    category: "training",
    repo: "batraaryan03/browser-ai",
    sizeBytes: 0,
    task: "training",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },
];

export function getModels(): ModelInfo[] {
  return MODELS;
}

export function getModel(slug: string): ModelInfo | undefined {
  return MODELS.find((m) => m.slug === slug);
}

export function getEnabledModels(): ModelInfo[] {
  return MODELS.filter((m) => m.enabled);
}

export function getCategoryModels(category: ModelCategory): ModelInfo[] {
  return MODELS.filter((m) => m.category === category && m.enabled);
}

/**
 * Format bytes to human-readable string (KB, MB, GB).
 */
export function formatBytes(b: number): string {
  if (b === 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(0)} MB`;
}

/**
 * Smooth progress callback — throttles updates to avoid UI flicker.
 * Returns the new rounded percentage if it should update, or null if throttled.
 */
export function createThrottledProgress(
  threshold = 3,
  intervalMs = 200,
): (pct: number) => number | null {
  let lastReported = -1;
  let lastTime = 0;
  return (pct: number): number | null => {
    const now = Date.now();
    const delta = Math.abs(pct - lastReported);
    if (delta >= threshold || now - lastTime >= intervalMs) {
      lastReported = pct;
      lastTime = now;
      return Math.round(pct);
    }
    return null;
  };
}
