/**
 * Model registry — central catalog of all browser-available models.
 * Each model has a unique slug, metadata, and a loader function.
 *
 * Architecture:
 *   - Models are registered here with size, description, and capabilities
 *   - Loader functions handle download + cache + pipeline creation
 *   - Progress is throttled for smooth UI updates
 */

export type ModelCategory = "text" | "vision" | "multimodal" | "training";

export interface ModelInfo {
  slug: string;
  name: string;
  description: string;
  category: ModelCategory;
  /** Hugging Face repo or path */
  repo: string;
  /** Download size in bytes (quantized) */
  sizeBytes: number;
  /** Task description for the pipeline */
  task: string;
  /** Whether this model can be used offline after initial download */
  offlineCapable: boolean;
  /** Recommended dtype */
  dtype: string;
  /** Feature flag — hide from selector if not ready */
  enabled: boolean;
}

const MODELS: ModelInfo[] = [
  {
    slug: "summarize",
    name: "Summarization",
    description: "Distill PDFs, articles, and long text into concise summaries. Runs T5-small entirely in-browser.",
    category: "text",
    repo: "Xenova/t5-small",
    sizeBytes: 308_000_000,
    task: "text2text-generation",
    offlineCapable: true,
    dtype: "fp32",
    enabled: true,
  },
  {
    slug: "remove-bg",
    name: "Background Removal",
    description: "Remove backgrounds from images with MODNet. Upload a portrait, get a clean cutout in seconds.",
    category: "vision",
    repo: "Xenova/modnet",
    sizeBytes: 100_000_000,
    task: "image-segmentation",
    offlineCapable: true,
    dtype: "fp32",
    enabled: false, // Coming soon
  },
  {
    slug: "classify",
    name: "Image Classifier",
    description: "Classify images into 1,000 categories using MobileNet. Drag an image and get instant predictions.",
    category: "vision",
    repo: "Xenova/mobilenet-v2",
    sizeBytes: 25_000_000,
    task: "image-classification",
    offlineCapable: true,
    dtype: "fp32",
    enabled: false, // Coming soon
  },
  {
    slug: "train",
    name: "Model Training",
    description: "Train small models entirely in your browser. Or bring your own GPU for advanced fine-tuning.",
    category: "training",
    repo: "",
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
 * Returns a wrapped callback that only fires when the percentage
 * changes by at least `threshold` or `intervalMs` has elapsed.
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
