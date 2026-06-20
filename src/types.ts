/** Base extraction result */
export interface ExtractionResult {
  text: string;
  pages: string[];
  pageCount: number;
  filename: string;
  fileSize: number;
}

/** Result of T5 summarization */
export interface SummaryResult {
  id: string;
  filename: string;
  original: string;
  summary: string;
  pageCount: number;
  originalWordCount: number;
  summaryWordCount: number;
  chunksProcessed: number;
  genTimeMs: number;
  compressionRatio: number;
  createdAt: string;
}

/** Download/model loading progress */
export interface ModelProgress {
  status: "idle" | "downloading" | "compiling" | "ready" | "error";
  loaded: number;
  total: number;
  currentFile?: string;
  speedBps?: number;
  error?: string;
}

/** Chunk inference progress */
export interface ChunkProgress {
  index: number;
  total: number;
  timeMs: number;
  text: string;
}

/** Generic model inference stage */
export type InferenceStage =
  | "idle"
  | "loading-model"
  | "compiling"
  | "processing"
  | "done"
  | "error";

/** A trained model adapter stored in IndexedDB */
export interface TrainedAdapter {
  id: string;
  name: string;
  /** The base model this adapter works with */
  baseModel: string;
  /** Size of the adapter in bytes */
  sizeBytes: number;
  /** The adapter weight data (serialized float32 array) */
  weights: Record<string, Float32Array>;
  /** Training metadata */
  metadata: {
    sourceFile: string;
    trainingTimeMs: number;
    epochs: number;
    lossHistory: number[];
    charCount: number;
  };
  createdAt: string;
}

/** A personality model (character-level LSTM) */
export interface PersonalityModel {
  id: string;
  name: string;
  styleStats: StyleAnalysis;
  embedding: Float32Array | null;
  weights: Record<string, number[]> | null;
  examples: string[];
  createdAt: string;
}

export interface StyleAnalysis {
  vocabularySize: number;
  avgSentenceLength: number;
  uppercaseRatio: number;
  punctuationRatio: number;
  emojiCount: number;
  topWords: [string, number][];
  topBigrams: [string, number][];
  description: string;
}
