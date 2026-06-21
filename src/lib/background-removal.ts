/**
 * Background removal using briaai/RMBG-1.4 via onnxruntime-web.
 *
 * Model: https://huggingface.co/briaai/RMBG-1.4
 * ONNX file: onnx/model_quantized.onnx (~44.4 MB)
 *
 * The model takes a 1024×1024 RGB image and outputs a binary mask.
 * We resize the image, run inference, threshold the mask, and composite
 * the result onto a transparent background.
 *
 * The ONNX binary is cached in the Cache API (keyed by MODEL_URL) so the
 * model only downloads once, surviving page navigations and browser restarts.
 * The ONNX Runtime session is also cached in memory for instant reuse within
 * the same page visit.
 */

import * as ort from "onnxruntime-web";

// ─── Constants ────────────────────────────────────────────────────────

/** URL for the quantized ONNX model file */
const MODEL_URL =
  "https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx";

/** Model input size (square) */
const INPUT_SIZE = 1024;

/** Download size in bytes (approximate) */
export const MODEL_SIZE_BYTES = 44_400_000;

/** Cache API name for persistent ONNX storage */
const CACHE_NAME = "onnx-models";

// ─── Types ────────────────────────────────────────────────────────────

export interface BgRemovalProgress {
  status: "idle" | "downloading" | "compiling" | "processing" | "ready" | "error";
  progress: number;
  label?: string;
  error?: string;
}

// ─── Session Singleton (in-memory, survives re-renders) ───────────────

let session: ort.InferenceSession | null = null;
let loadingPromise: Promise<ort.InferenceSession> | null = null;

// ─── Cache API helpers (persists across navigations) ──────────────────

async function getCachedModelBytes(url: string): Promise<ArrayBuffer | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    if (response && response.ok) {
      return response.arrayBuffer();
    }
  } catch {
    // Cache API unavailable or corrupted — will fetch fresh
  }
  return null;
}

async function storeModelBytes(url: string, data: ArrayBuffer): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, new Response(data));
  } catch {
    // Non-critical — model still works, just won't be cached
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Resize and preprocess an image to the model's expected input format.
 * Returns a Float32Array of shape [1, 3, 1024, 1024] normalized to [0, 1].
 */
async function preprocessImage(imageSrc: string): Promise<{
  tensor: ort.Tensor;
  originalWidth: number;
  originalHeight: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      // Create a canvas to resize to 1024×1024
      const canvas = document.createElement("canvas");
      canvas.width = INPUT_SIZE;
      canvas.height = INPUT_SIZE;
      const ctx = canvas.getContext("2d")!;

      // Draw image centered (cover crop)
      const scale = Math.max(INPUT_SIZE / width, INPUT_SIZE / height);
      const sw = width * scale;
      const sh = height * scale;
      const sx = (INPUT_SIZE - sw) / 2;
      const sy = (INPUT_SIZE - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
      const pixels = imageData.data;

      // Convert HWC → CHW, normalize to [0, 1]
      const float32Data = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
      for (let y = 0; y < INPUT_SIZE; y++) {
        for (let x = 0; x < INPUT_SIZE; x++) {
          const srcIdx = (y * INPUT_SIZE + x) * 4;
          const dstIdxR = y * INPUT_SIZE + x;
          const dstIdxG = dstIdxR + INPUT_SIZE * INPUT_SIZE;
          const dstIdxB = dstIdxG + INPUT_SIZE * INPUT_SIZE;
          float32Data[dstIdxR] = pixels[srcIdx] / 255;       // R
          float32Data[dstIdxG] = pixels[srcIdx + 1] / 255;   // G
          float32Data[dstIdxB] = pixels[srcIdx + 2] / 255;   // B
        }
      }

      const tensor = new ort.Tensor("float32", float32Data, [
        1, 3, INPUT_SIZE, INPUT_SIZE,
      ]);

      resolve({ tensor, originalWidth: width, originalHeight: height });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

/**
 * Post-process the model output mask into a composited image.
 * Pixels with mask values below the confidence threshold become transparent.
 */
async function postprocessMask(
  maskTensor: ort.Tensor,
  originalImageSrc: string,
  originalWidth: number,
  originalHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const maskData = maskTensor.data as Float32Array;

    // Build mask canvas at INPUT_SIZE
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = INPUT_SIZE;
    maskCanvas.height = INPUT_SIZE;
    const maskCtx = maskCanvas.getContext("2d")!;
    const maskImageData = maskCtx.createImageData(INPUT_SIZE, INPUT_SIZE);

    // Apply threshold — values below 0.08 → transparent, above → keep
    const threshold = 0.08;
    for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
      const raw = maskData[i];
      let alpha: number;
      if (raw < threshold) {
        // Smooth fade below threshold
        alpha = Math.max(0, Math.round(((raw - threshold * 0.5) / (threshold * 0.5)) * 255));
      } else {
        alpha = 255;
      }
      alpha = Math.min(255, Math.max(0, alpha));
      maskImageData.data[i * 4] = 255;
      maskImageData.data[i * 4 + 1] = 255;
      maskImageData.data[i * 4 + 2] = 255;
      maskImageData.data[i * 4 + 3] = alpha;
    }
    maskCtx.putImageData(maskImageData, 0, 0);

    // Composite onto original image at full resolution
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = originalWidth;
    resultCanvas.height = originalHeight;
    const resultCtx = resultCanvas.getContext("2d")!;

    const origImg = new Image();
    origImg.onload = () => {
      resultCtx.drawImage(origImg, 0, 0, originalWidth, originalHeight);
      const origData = resultCtx.getImageData(0, 0, originalWidth, originalHeight);

      // Resize mask to original dimensions
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(maskCanvas, 0, 0, originalWidth, originalHeight);
      const maskResized = tempCtx.getImageData(0, 0, originalWidth, originalHeight);

      // Apply mask alpha
      for (let i = 0; i < origData.data.length / 4; i++) {
        origData.data[i * 4 + 3] = maskResized.data[i * 4 + 3];
      }

      resultCtx.putImageData(origData, 0, 0);
      resolve(resultCanvas.toDataURL("image/png"));
    };
    origImg.src = originalImageSrc;
  });
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Load (or retrieve from cache) the RMBG-1.4 model.
 *
 * Caching strategy (two-tier):
 *   1. In-memory `session` singleton — instant reuse within page visit
 *   2. Cache API — persists the ONNX bytes across navigations
 *
 * Only downloads the model once from Hugging Face.
 */
export async function loadBgRemovalModel(
  onProgress?: (p: BgRemovalProgress) => void,
): Promise<ort.InferenceSession> {
  // Tier 1: already compiled in memory
  if (session) return session;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      let modelBytes: ArrayBuffer | null = null;

      // Tier 2: check Cache API for previously downloaded bytes
      modelBytes = await getCachedModelBytes(MODEL_URL);
      if (modelBytes) {
        onProgress?.({ status: "compiling", progress: 80, label: "Loading cached model..." });
      } else {
        // Download from Hugging Face with streaming progress
        onProgress?.({ status: "downloading", progress: 0, label: "Starting download..." });

        const response = await fetch(MODEL_URL);
        if (!response.ok) {
          throw new Error(`Failed to download model: ${response.statusText}`);
        }

        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : MODEL_SIZE_BYTES;
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];
        let downloaded = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              downloaded += value.length;
              const pct = Math.round((downloaded / total) * 80) + 10;
              onProgress?.({ status: "downloading", progress: Math.min(pct, 90), label: "Downloading model..." });
            }
          }
        } else {
          const blob = await response.blob();
          downloaded = blob.size;
          chunks.push(new Uint8Array(await blob.arrayBuffer()));
        }

        const allBytes = new Uint8Array(downloaded);
        let offset = 0;
        for (const chunk of chunks) {
          allBytes.set(chunk, offset);
          offset += chunk.length;
        }

        modelBytes = allBytes.buffer as ArrayBuffer;

        // Persist to Cache API for future visits
        storeModelBytes(MODEL_URL, modelBytes);

        onProgress?.({ status: "compiling", progress: 95, label: "Compiling model..." });
      }

      // Create inference session
      // ONNX Runtime's C++ code logs to console.error when compiled to WASM
      // via Emscripten. We suppress the harmless node-assignment warning.
      const ogWarn = console.warn;
      const ogError = console.error;
      const isOnnxWarning = (args: any[]) =>
        typeof args[0] === "string" &&
        (args[0].includes("Some nodes were not assigned to the preferred") ||
         args[0].includes("Rerunning with verbose output"));
      console.warn = (...args: any[]) => {
        if (isOnnxWarning(args)) return;
        ogWarn.apply(console, args);
      };
      console.error = (...args: any[]) => {
        if (isOnnxWarning(args)) return;
        ogError.apply(console, args);
      };
      try {
        session = await ort.InferenceSession.create(modelBytes!, {
          executionProviders: ["webgpu", "wasm"],
        });
      } finally {
        console.warn = ogWarn;
        console.error = ogError;
      }

      onProgress?.({ status: "ready", progress: 100, label: "Ready!" });
      return session;
    } catch (err) {
      loadingPromise = null;
      const msg = err instanceof Error ? err.message : "Failed to load model";
      onProgress?.({ status: "error", progress: 0, error: msg });
      throw err;
    }
  })();

  return loadingPromise;
}

/**
 * Remove background from an image.
 *
 * @param imageSrc - base64 data URL of the image
 * @param onProgress - progress callback
 * @returns base64 PNG data URL with transparent background
 */
export async function removeBackground(
  imageSrc: string,
  onProgress?: (p: BgRemovalProgress) => void,
): Promise<string> {
  const sess = await loadBgRemovalModel(onProgress);

  // Step 1: Preprocess
  onProgress?.({ status: "processing", progress: 85, label: "Preprocessing image..." });
  const { tensor, originalWidth, originalHeight } = await preprocessImage(imageSrc);
  const inputName = sess.inputNames[0];
  const outputName = sess.outputNames[0];

  let maskTensor: ort.Tensor | null = null;

  try {
    // Step 2: Run inference
    onProgress?.({ status: "processing", progress: 90, label: "Running inference..." });
    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };
    const results = await sess.run(feeds);
    maskTensor = results[outputName];

    // Step 3: Post-process mask
    onProgress?.({ status: "processing", progress: 94, label: "Applying mask..." });
    const result = await postprocessMask(
      maskTensor,
      imageSrc,
      originalWidth,
      originalHeight,
    );

    onProgress?.({ status: "ready", progress: 100, label: "Done!" });
    return result;
  } finally {
    tensor.dispose();
    if (maskTensor) maskTensor.dispose();
  }
}

/**
 * Check if the background removal model is loaded in memory.
 */
export function isBgRemovalLoaded(): boolean {
  return session !== null;
}

/**
 * Release the model from memory only (cache stays).
 * Can be called on unmount to free GPU memory without losing cached bytes.
 */
export function releaseBgRemovalModel(): void {
  session?.release();
  session = null;
  loadingPromise = null;
}
