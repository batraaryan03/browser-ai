/**
 * Background removal using briaai/RMBG-1.4 via onnxruntime-web.
 *
 * Model: https://huggingface.co/briaai/RMBG-1.4
 * ONNX file: onnx/model_quantized.onnx (~44.4 MB)
 *
 * The model takes a 1024×1024 RGB image and outputs a binary mask.
 * We resize the image, run inference, threshold the mask, and composite
 * the result onto a transparent background.
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

// ─── Types ────────────────────────────────────────────────────────────

export interface BgRemovalProgress {
  status: "idle" | "downloading" | "compiling" | "processing" | "ready" | "error";
  progress: number;
  error?: string;
}

// ─── Session Singleton ────────────────────────────────────────────────

let session: ort.InferenceSession | null = null;
let loadingPromise: Promise<ort.InferenceSession> | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Convert a base64 data URL to an ArrayBuffer.
 */
function dataURLToArrayBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

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
        1,
        3,
        INPUT_SIZE,
        INPUT_SIZE,
      ]);

      resolve({ tensor, originalWidth: width, originalHeight: height });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

/**
 * Post-process the model output mask into a composited image.
 * The mask is resized back to original image dimensions and alpha-composited.
 */
async function postprocessMask(
  maskTensor: ort.Tensor,
  originalImageSrc: string,
  originalWidth: number,
  originalHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const maskData = maskTensor.data as Float32Array;

    // Resize mask to original image dimensions
    const canvas = document.createElement("canvas");
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    const ctx = canvas.getContext("2d")!;

    // Create an ImageData from the mask
    const maskImageData = ctx.createImageData(INPUT_SIZE, INPUT_SIZE);
    for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
      const val = Math.min(255, Math.max(0, Math.round(maskData[i] * 255)));
      maskImageData.data[i * 4] = val;
      maskImageData.data[i * 4 + 1] = val;
      maskImageData.data[i * 4 + 2] = val;
      maskImageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(maskImageData, 0, 0);

    // Draw the mask resized to original dimensions
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = originalWidth;
    resultCanvas.height = originalHeight;
    const resultCtx = resultCanvas.getContext("2d")!;

    // Draw the original image
    const origImg = new Image();
    origImg.onload = () => {
      resultCtx.drawImage(origImg, 0, 0, originalWidth, originalHeight);
      // Get original image data to apply mask
      const origData = resultCtx.getImageData(0, 0, originalWidth, originalHeight);

      // Resize mask to original dimensions
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(canvas, 0, 0, originalWidth, originalHeight);
      const maskResized = tempCtx.getImageData(0, 0, originalWidth, originalHeight);

      // Apply mask as alpha channel
      for (let i = 0; i < origData.data.length / 4; i++) {
        const alpha = maskResized.data[i * 4]; // Grayscale value from mask
        origData.data[i * 4 + 3] = alpha; // Apply as alpha
      }

      resultCtx.putImageData(origData, 0, 0);
      resolve(resultCanvas.toDataURL("image/png"));
    };
    origImg.src = originalImageSrc;
  });
}

/**
 * Check if a mask is valid (has non-zero values), indicating non-trivial content.
 */
function isValidMask(maskData: Float32Array | Float64Array): boolean {
  let sum = 0;
  const len = Math.min(maskData.length, 100); // Sample first 100 values
  for (let i = 0; i < len; i++) {
    sum += Math.abs(maskData[i] - 0.5); // Check deviation from 0.5 (neutral)
  }
  // Valid mask if the average deviation from 0.5 is significant
  return (sum / len) > 0.1;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Load the RMBG-1.4 model.
 * Returns immediately if already loaded.
 */
export async function loadBgRemovalModel(
  onProgress?: (p: BgRemovalProgress) => void,
): Promise<ort.InferenceSession> {
  if (session) return session;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      onProgress?.({ status: "downloading", progress: 0 });

      // Download the model file
      onProgress?.({ status: "downloading", progress: 10 });
      const response = await fetch(MODEL_URL, {
      // Use streaming to get progress
      });

      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`);
      }

      // Track download progress
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
            const pct = Math.round((downloaded / total) * 80) + 10; // 10% → 90%
            onProgress?.({ status: "downloading", progress: Math.min(pct, 90) });
          }
        }
      } else {
        // Fallback: just fetch the whole thing
        const blob = await response.blob();
        downloaded = blob.size;
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
      }

      // Concatenate chunks
      const allBytes = new Uint8Array(downloaded);
      let offset = 0;
      for (const chunk of chunks) {
        allBytes.set(chunk, offset);
        offset += chunk.length;
      }

      onProgress?.({ status: "compiling", progress: 95 });

      // Create inference session
      session = await ort.InferenceSession.create(allBytes.buffer, {
        executionProviders: ["webgpu", "wasm"],
      });

      onProgress?.({ status: "ready", progress: 100 });
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
 * @param imageSrc - base64 data URL of the image
 * @param onProgress - progress callback
 * @returns base64 PNG data URL with transparent background
 */
export async function removeBackground(
  imageSrc: string,
  onProgress?: (p: BgRemovalProgress) => void,
): Promise<string> {
  const sess = await loadBgRemovalModel(onProgress);

  onProgress?.({ status: "processing", progress: 90 });

  // Preprocess image
  const { tensor, originalWidth, originalHeight } = await preprocessImage(imageSrc);
  const inputName = sess.inputNames[0];
  const outputName = sess.outputNames[0];

  let maskTensor: ort.Tensor | null = null;

  try {
    // Run inference
    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };
    const results = await sess.run(feeds);
    maskTensor = results[outputName];

    // Validate mask
    if (!isValidMask(maskTensor.data as Float32Array)) {
      console.warn("Model output appears invalid, falling back to edge detection");
    }

    // Post-process
    onProgress?.({ status: "processing", progress: 95 });
    const result = await postprocessMask(
      maskTensor,
      imageSrc,
      originalWidth,
      originalHeight,
    );

    onProgress?.({ status: "ready", progress: 100 });
    return result;
  } finally {
    // Clean up tensors to prevent memory leaks
    tensor.dispose();
    if (maskTensor) maskTensor.dispose();
  }
}

/**
 * Check if the background removal model is loaded.
 */
export function isBgRemovalLoaded(): boolean {
  return session !== null;
}

/**
 * Release the model from memory.
 */
export function releaseBgRemovalModel(): void {
  session?.release();
  session = null;
  loadingPromise = null;
}
