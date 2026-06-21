/**
 * Browser-based ONNX Chat Inference
 *
 * Loads an ONNX model from ArrayBuffer and runs text generation
 * entirely in-browser using onnxruntime-web. No server needed.
 *
 * Usage:
 *   const chat = await OnnxChat.create(modelBuffer, configJson, tokenizerJson);
 *   const response = await chat.generate("Hello!", { maxTokens: 128 });
 */

import * as ort from "onnxruntime-web";
import { BPETokenizer, type TokenizerConfig } from "./bpe-tokenizer";

// ── Types ────────────────────────────────────────────────────────────

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  repetitionPenalty?: number;
  systemPrompt?: string;
  /** Conversation history for multi-turn context */
  messages?: Array<{ role: string; content: string }>;
  /** Callback for streaming tokens */
  onToken?: (token: string) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface ModelConfig {
  model_type?: string;
  hidden_size?: number;
  num_attention_heads?: number;
  num_hidden_layers?: number;
  max_position_embeddings?: number;
  vocab_size?: number;
  [key: string]: unknown;
}

// ── Sampling helpers ─────────────────────────────────────────────────

/**
 * Sample a token from logits using temperature + top-p.
 */
function sampleFromLogits(
  logits: Float32Array,
  temperature: number,
  topP: number,
): number {
  // Apply temperature
  if (temperature > 0) {
    for (let i = 0; i < logits.length; i++) {
      logits[i] = logits[i] / temperature;
    }
  }

  // Softmax (use actual max for numerical stability)
  let maxVal = logits[0];
  for (let i = 1; i < logits.length; i++) {
    if (logits[i] > maxVal) maxVal = logits[i];
  }
  let sum = 0;
  const probs = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const shifted = Math.exp(logits[i] - maxVal);
    probs[i] = shifted;
    sum += shifted;
  }
  for (let i = 0; i < probs.length; i++) {
    probs[i] /= sum;
  }

  // Top-p (nucleus) sampling
  if (topP < 1.0) {
    const indices = Array.from({ length: probs.length }, (_, i) => i);
    indices.sort((a, b) => probs[b] - probs[a]);

    let cumSum = 0;
    const cutoffIdx = indices.findIndex((i) => {
      cumSum += probs[i];
      return cumSum >= topP;
    });

    if (cutoffIdx > 0) {
      const keepSet = new Set(indices.slice(0, cutoffIdx + 1));
      for (let i = 0; i < probs.length; i++) {
        if (!keepSet.has(i)) probs[i] = 0;
      }
      // Renormalize
      const newSum = Array.from(probs).reduce((a, b) => a + b, 0);
      for (let i = 0; i < probs.length; i++) {
        probs[i] /= newSum;
      }
    }
  }

  // Sample from the probability distribution
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }

  return probs.length - 1; // Fallback
}

/**
 * Apply repetition penalty to logits.
 */
function applyRepetitionPenalty(
  logits: Float32Array,
  tokenIds: number[],
  penalty: number,
): void {
  if (penalty <= 1.0) return;
  for (const id of tokenIds) {
    if (id < logits.length) {
      logits[id] /= penalty;
    }
  }
}

// ── OnnxChat class ───────────────────────────────────────────────────

export class OnnxChat {
  private session: ort.InferenceSession;
  private tokenizer: BPETokenizer;
  private config: ModelConfig;
  private numLayers: number;
  private numHeads: number;
  private headDim: number;
  private hiddenSize: number;
  private maxSeqLen: number;
  /** Dynamically detected KV cache output name for each layer */
  private kvPrefixOutput: string;

  private constructor(
    session: ort.InferenceSession,
    tokenizer: BPETokenizer,
    config: ModelConfig,
  ) {
    this.session = session;
    this.tokenizer = tokenizer;
    this.config = config;
    this.numLayers = (config.num_hidden_layers as number) ?? 24;
    this.numHeads = (config.num_attention_heads as number) ?? 12;
    this.hiddenSize = (config.hidden_size as number) ?? 768;
    this.headDim = this.hiddenSize / this.numHeads;
    this.maxSeqLen = (config.max_position_embeddings as number) ?? 2048;
    this.kvPrefixOutput = "present"; // default, will be detected on first pass
  }

  /**
   * Create an OnnxChat instance from uploaded model data.
   */
  static async create(
    onnxBuffer: ArrayBuffer,
    configJson: ModelConfig,
    tokenizerJson: TokenizerConfig,
  ): Promise<OnnxChat> {
    // Configure ONNX Runtime Web for browser
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/";

    // Try to use WebGPU, fallback to WASM
    const executionProviders: ort.InferenceSession.SessionOptions["executionProviders"] = [
      "webgpu",
      "wasm",
    ];

    const session = await ort.InferenceSession.create(onnxBuffer, {
      executionProviders,
      graphOptimizationLevel: "all",
    });

    const tokenizer = new BPETokenizer(tokenizerJson);
    return new OnnxChat(session, tokenizer, configJson);
  }

  /**
   * Generate a response to a user message.
   * Returns the full response text.
   */
  async generate(
    message: string,
    options: GenerateOptions = {},
  ): Promise<string> {
    const {
      maxTokens = 256,
      temperature = 0.7,
      topP = 0.9,
      repetitionPenalty = 1.1,
      systemPrompt,
      messages: historyMessages,
      onToken,
      signal,
    } = options;

    // Build conversation
    const fullMessages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      fullMessages.push({ role: "system", content: systemPrompt });
    }

    if (historyMessages) {
      fullMessages.push(...historyMessages);
    }

    fullMessages.push({ role: "user", content: message });

    // Format with chat template and tokenize
    const prompt = this.tokenizer.applyChatTemplate(fullMessages, true);
    let inputIds = this.tokenizer.encode(prompt);
    const promptLen = inputIds.length;

    // Track all generated token IDs for repetition penalty
    const allIds = [...inputIds];

    // KV cache state: maps layer index → { key: Tensor, value: Tensor }
    const pastKeyValues: Array<{ key: ort.Tensor | null; value: ort.Tensor | null }> = [];
    for (let i = 0; i < this.numLayers; i++) {
      pastKeyValues.push({ key: null, value: null });
    }

    // Dynamically detect KV cache output naming from the session output names
    let kvPrefix = this.kvPrefixOutput;

    let generatedTokens = 0;
    const outputTokens: number[] = [];

    while (generatedTokens < maxTokens) {
      if (signal?.aborted) break;

      const isFirstPass = generatedTokens === 0;

      if (isFirstPass) {
        // Full prompt processing
        const inputTensor = new ort.Tensor("int64", BigInt64Array.from(inputIds.map(BigInt)), [1, promptLen]);
        const attnArray = new BigInt64Array(promptLen);
        for (let i = 0; i < promptLen; i++) attnArray[i] = BigInt(1);
        const attentionMask = new ort.Tensor("int64", attnArray, [1, promptLen]);

        const feeds: Record<string, ort.Tensor> = {
          input_ids: inputTensor,
          attention_mask: attentionMask,
        };

        const results = await this.session.run(feeds);

        // Detect KV cache output naming from session output names
        // Optimum typically uses "present.{i}.{key|value}", but other exports may differ.
        // We scan result keys to find the pattern dynamically.
        const resultKeys = Object.keys(results);
        const kvKeyExample = resultKeys.find((k) => k.includes(".0.key"));
        if (kvKeyExample) {
          kvPrefix = kvKeyExample.replace(".0.key", "");
          this.kvPrefixOutput = kvPrefix;
        }

        // Extract logits (last position)
        const logitsData = results.logits.data as Float32Array;
        const vocabSize = this.config.vocab_size!;
        const lastLogits = logitsData.slice(
          (promptLen - 1) * vocabSize,
          promptLen * vocabSize,
        );

        const nextToken = this.sampleToken(lastLogits, temperature, topP, repetitionPenalty, allIds);
        outputTokens.push(nextToken);
        allIds.push(nextToken);

        // Store KV cache outputs for next pass (using detected prefix)
        for (let i = 0; i < this.numLayers; i++) {
          const keyName = `${kvPrefix}.${i}.key`;
          const valueName = `${kvPrefix}.${i}.value`;
          pastKeyValues[i].key = (results[keyName] as ort.Tensor) ?? null;
          pastKeyValues[i].value = (results[valueName] as ort.Tensor) ?? null;
        }

        generatedTokens++;
      } else {
        // Decode phase — only process latest token with KV cache
        const lastToken = BigInt(outputTokens[outputTokens.length - 1]);
        const inputTensor = new ort.Tensor("int64", new BigInt64Array([lastToken]), [1, 1]);

        const currentSeqLen = promptLen + generatedTokens;
        const attnArray = new BigInt64Array(currentSeqLen);
        for (let i = 0; i < currentSeqLen; i++) attnArray[i] = BigInt(1);
        const attentionMask = new ort.Tensor("int64", attnArray, [1, currentSeqLen]);

        const feeds: Record<string, ort.Tensor> = {
          input_ids: inputTensor,
          attention_mask: attentionMask,
        };

        // Add past key values (input names always use "past_key_values" prefix)
        for (let i = 0; i < this.numLayers; i++) {
          feeds[`past_key_values.${i}.key`] = pastKeyValues[i].key!;
          feeds[`past_key_values.${i}.value`] = pastKeyValues[i].value!;
        }

        const results = await this.session.run(feeds);

        // Extract logits (only 1 position)
        const logitsData = results.logits.data as Float32Array;
        const lastLogits = logitsData.slice(0, this.config.vocab_size!);

        const nextToken = this.sampleToken(lastLogits, temperature, topP, repetitionPenalty, allIds);
        outputTokens.push(nextToken);
        allIds.push(nextToken);

        // Store updated KV cache (using dynamically detected prefix for outputs)
        for (let i = 0; i < this.numLayers; i++) {
          const keyName = `${kvPrefix}.${i}.key`;
          const valueName = `${kvPrefix}.${i}.value`;
          pastKeyValues[i].key = (results[keyName] as ort.Tensor) ?? null;
          pastKeyValues[i].value = (results[valueName] as ort.Tensor) ?? null;
        }

        generatedTokens++;
      }

      // Emit token via callback
      if (onToken && outputTokens.length > 0) {
        const partial = this.tokenizer.decode(outputTokens);
        onToken(partial);
      }

      // Stop on EOS
      if (outputTokens[outputTokens.length - 1] === this.tokenizer.eos) {
        break;
      }

      // Yield to browser event loop periodically
      if (generatedTokens % 4 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Decode and return
    return this.tokenizer.decode(outputTokens).trim();
  }

  /**
   * Count tokens in a prompt string.
   */
  countTokens(text: string): number {
    return this.tokenizer.countTokens(text);
  }

  // ── Private ──────────────────────────────────────────────────────

  private sampleToken(
    logits: Float32Array,
    temperature: number,
    topP: number,
    repetitionPenalty: number,
    allIds: number[],
  ): number {
    // Apply repetition penalty
    if (repetitionPenalty > 1.0) {
      applyRepetitionPenalty(logits, allIds, repetitionPenalty);
    }

    // Sample
    return sampleFromLogits(logits, temperature, topP);
  }
}
