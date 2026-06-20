/**
 * Client-side PDF text extraction using pdfjs-dist.
 * Uses dynamic import to avoid SSR issues (DOMMatrix).
 */
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ExtractionResult } from "@/types";

export async function extractText(file: File): Promise<ExtractionResult> {
  if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please upload a valid PDF file");
  }

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  let pdf: PDFDocumentProxy;

  try {
    pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  } catch (err: any) {
    if (err?.name === "PasswordException" || err?.message?.toLowerCase().includes("password")) {
      throw new Error("This PDF is password-protected.");
    }
    throw new Error("Could not read this PDF. It may be corrupted.");
  }

  if (pdf.numPages === 0) throw new Error("This PDF appears to be empty.");

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ").replace(/\s+/g, " ").trim();
    pages.push(text);
  }

  const fullText = pages.filter(Boolean).join("\n\n");
  if (!fullText.trim()) throw new Error("Could not extract text. The PDF may contain scanned images.");

  return {
    text: fullText,
    pages,
    pageCount: pdf.numPages,
    filename: file.name,
    fileSize: file.size,
  };
}
