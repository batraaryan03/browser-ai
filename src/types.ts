/** Extracted text from a PDF */
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
