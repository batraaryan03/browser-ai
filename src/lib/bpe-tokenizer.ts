/**
 * Minimal BPE Tokenizer for browser-based ONNX inference.
 *
 * Parses a Hugging Face tokenizer.json file and provides
 * encode/decode for GPT-2-style ByteLevel BPE tokenizers
 * (used by SmolLM2, Llama, GPT-2, and many others).
 *
 * Usage:
 *   const t = new BPETokenizer(tokenizerJson);
 *   const ids = t.encode("Hello world");
 *   const text = t.decode(ids);
 */

// ── Helper: bytes_to_unicode (GPT-2 style) ──────────────────────────

function bytesToUnicode(): Map<number, string> {
  const map = new Map<number, string>();
  const chars: number[] = [];

  // Printable ASCII (33-126) + whitespace (9, 10, 13)
  for (let i = 33; i <= 126; i++) chars.push(i);
  for (let i = 0; i <= 31; i++) {
    if (![9, 10, 13].includes(i)) continue;
    chars.push(i);
  }
  chars.push(127);

  // Map remaining to 256+ Unicode chars
  let offset = 0;
  for (let i = 0; i <= 255; i++) {
    if (chars.includes(i)) {
      map.set(i, String.fromCharCode(i));
    } else {
      map.set(i, String.fromCharCode(256 + offset++));
    }
  }
  return map;
}

// ── BPE Merge Cache ─────────────────────────────────────────────────

type MergeMap = Map<string, number>;

function buildMergeMap(merges: string[]): MergeMap {
  const m: MergeMap = new Map();
  for (let i = 0; i < merges.length; i++) {
    m.set(merges[i], i);
  }
  return m;
}

// ── Pre-tokenizer regex (GPT-2 / Llama style) ───────────────────────

/**
 * GPT-2's pre-tokenization regex pattern.
 * Splits text into words while preserving whitespace structure.
 */
const GPT2_PATTERN =
  /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

// ── BPETokenizer class ───────────────────────────────────────────────

export interface TokenizerConfig {
  /** Added/special tokens */
  added_tokens?: Array<{ id: number; content: string; single_word?: boolean; lstrip?: boolean; rstrip?: boolean; special?: boolean }>;
  /** The model section from tokenizer.json */
  model: {
    type: string;
    vocab: Record<string, number>;
    merges: string[];
  };
  /** Normalizer config */
  normalizer?: { type: string };
  /** Pre-tokenizer config */
  pre_tokenizer?: { type: string };
  /** Post-processor config */
  post_processor?: { type: string };
  /** Decoder config */
  decoder?: { type: string };
}

export class BPETokenizer {
  private vocab: Map<string, number>;
  private idToToken: Map<number, string>;
  private merges: MergeMap;
  private addedTokens: Map<number, string>;
  private byteEncoder: Map<number, string>;
  private byteDecoder: Map<string, number>;
  private bosTokenId: number;
  private eosTokenId: number;
  private unkTokenId: number;
  private padTokenId: number;

  constructor(config: TokenizerConfig) {
    // Initialize byte encoding table
    this.byteEncoder = bytesToUnicode();
    this.byteDecoder = new Map();
    for (const [byte, ch] of this.byteEncoder) {
      this.byteDecoder.set(ch, byte);
    }

    // Build vocab maps
    this.vocab = new Map();
    this.idToToken = new Map();
    for (const [token, id] of Object.entries(config.model.vocab)) {
      this.vocab.set(token, id);
      this.idToToken.set(id, token);
    }

    // Build merge map
    this.merges = buildMergeMap(config.model.merges);

    // Added tokens (special tokens like <|im_start|>, <|im_end|>, etc.)
    this.addedTokens = new Map();
    if (config.added_tokens) {
      for (const t of config.added_tokens) {
        this.addedTokens.set(t.id, t.content);
      }
    }

    // Default special token IDs
    this.bosTokenId = this.vocab.get("<s>") ?? this.vocab.get("<|begin_of_text|>") ?? 1;
    this.eosTokenId = this.vocab.get("</s>") ?? this.vocab.get("<|im_end|>") ?? 2;
    this.unkTokenId = this.vocab.get("<unk>") ?? 0;
    this.padTokenId = this.vocab.get("<pad>") ?? this.vocab.get("</s>") ?? 2;
  }

  get bos(): number {
    return this.bosTokenId;
  }

  get eos(): number {
    return this.eosTokenId;
  }

  get pad(): number {
    return this.padTokenId;
  }

  get vocabSize(): number {
    return this.vocab.size;
  }

  /**
   * Encode text to token IDs.
   */
  encode(text: string): number[] {
    // 1. Pre-tokenize: split into words using GPT-2 pattern
    const words: string[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(GPT2_PATTERN.source, "gu");
    while ((match = regex.exec(text)) !== null) {
      words.push(match[0]);
    }

    if (words.length === 0) return [];

    // 2. For each word, encode to bytes → BPE → IDs
    const tokens: number[] = [];
    for (const word of words) {
      const wordTokens = this.encodeWord(word);
      tokens.push(...wordTokens);
    }

    return tokens;
  }

  /**
   * Decode token IDs back to text.
   */
  decode(ids: number[]): string {
    const tokens: string[] = [];
    for (const id of ids) {
      const token = this.idToToken.get(id);
      if (token !== undefined) {
        tokens.push(token);
      }
    }

    // Byte-level decoding: map each character back to bytes
    const bytes: number[] = [];
    for (const token of tokens) {
      for (const ch of token) {
        const byte = this.byteDecoder.get(ch);
        if (byte !== undefined) {
          bytes.push(byte);
        }
      }
    }

    // Decode bytes to UTF-8 string
    try {
      // Use TextDecoder for proper UTF-8 handling
      return new TextDecoder("utf-8", { fatal: false }).decode(
        new Uint8Array(bytes),
      );
    } catch {
      // Fallback: manual decoding
      return String.fromCharCode(...bytes);
    }
  }

  /**
   * Apply chat template to create a formatted conversation string.
   * SmolLM2 uses ChatML format: <|im_start|>role\ncontent<|im_end|>
   */
  applyChatTemplate(
    messages: Array<{ role: string; content: string }>,
    addGenerationPrompt = true,
  ): string {
    const parts: string[] = [];
    for (const msg of messages) {
      parts.push(`<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`);
    }
    if (addGenerationPrompt) {
      parts.push("<|im_start|>assistant\n");
    }
    return parts.join("");
  }

  /**
   * Count tokens in text without returning the full encoding.
   */
  countTokens(text: string): number {
    return this.encode(text).length;
  }

  // ── Private: Encode a single word using BPE ────────────────────

  private encodeWord(word: string): number[] {
    // Check if the whole word is in the vocabulary (as a special/added token)
    if (this.vocab.has(word)) {
      const id = this.vocab.get(word)!;
      return [id];
    }

    // Convert word to bytes → byte-encoded chars
    const bytes = new TextEncoder().encode(word);
    let token = "";
    for (const b of bytes) {
      token += this.byteEncoder.get(b) ?? String.fromCharCode(b);
    }

    // BPE merge
    const bpeTokens = this.bpe(token);
    const ids: number[] = [];

    for (const t of bpeTokens) {
      const id = this.vocab.get(t);
      if (id !== undefined) {
        ids.push(id);
      } else {
        // Fallback to UNK
        ids.push(this.unkTokenId);
      }
    }

    return ids;
  }

  /**
   * Apply BPE merges to a token string, returning sub-tokens.
   */
  private bpe(token: string): string[] {
    // Start with each character as a separate token
    const chars: string[] = [];
    for (const ch of token) {
      chars.push(ch);
    }

    // If only 1 char, no merging needed
    if (chars.length === 1) return chars;

    // Greedy merge: repeatedly find the pair with the lowest merge priority
    while (true) {
      let bestPair: [string, string] | null = null;
      let bestRank = Infinity;

      for (let i = 0; i < chars.length - 1; i++) {
        const pair = `${chars[i]} ${chars[i + 1]}`;
        const rank = this.merges.get(pair);
        if (rank !== undefined && rank < bestRank) {
          bestRank = rank;
          bestPair = [chars[i], chars[i + 1]];
        }
      }

      if (bestPair === null) break;

      // Merge the best pair
      const [a, b] = bestPair;
      const merged: string[] = [];
      let i = 0;
      while (i < chars.length) {
        if (i < chars.length - 1 && chars[i] === a && chars[i + 1] === b) {
          merged.push(a + b);
          i += 2;
        } else {
          merged.push(chars[i]);
          i += 1;
        }
      }
      chars.length = 0;
      chars.push(...merged);
    }

    return chars;
  }
}
