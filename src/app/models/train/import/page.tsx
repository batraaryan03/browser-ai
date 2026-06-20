"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatBytes } from "@/lib/models";

interface ImportedModel {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  importedAt: string;
  baseModel?: string;
}

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [models, setModels] = useState<ImportedModel[]>([]);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setImporting(true);
    try {
      // Validate file type
      const ext = file.name.split(".").pop()?.toLowerCase();
      const valid = ["safetensors", "onnx", "json", "bin"];
      if (!ext || !valid.includes(ext)) {
        toast.error(`Unsupported format: .${ext}. Use .safetensors, .onnx, .json, or .bin`);
        return;
      }

      // Read file into IndexedDB (simulated — just store metadata for now)
      const buffer = await file.arrayBuffer();
      const modelEntry: ImportedModel = {
        id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: `.${ext}`,
        sizeBytes: buffer.byteLength,
        importedAt: new Date().toISOString(),
        baseModel: ext === "json" ? "personality-lstm" : "t5-small",
      };

      setModels((prev) => [modelEntry, ...prev]);
      toast.success(`${file.name} imported successfully`);
    } catch {
      toast.error("Failed to import file");
    } finally {
      setImporting(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        handleFile(f);
        e.target.value = "";
      }
    },
    [handleFile],
  );

  const handleDelete = useCallback((id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
    toast.success("Model removed");
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Import Model</h1>
            <p className="text-sm text-gray-400">
              Upload a trained model file to use it in your browser. Supports .safetensors (LoRA),
              .onnx (merged), .json (personality), and .bin formats.
            </p>
          </div>

          {/* Drop zone */}
          <input ref={inputRef} type="file" accept=".safetensors,.onnx,.json,.bin" className="hidden" onChange={handleChange} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !importing && inputRef.current?.click()}
            className={`bg-white px-5 py-10 text-center cursor-pointer select-none transition-all ${
              dragging ? "bg-black/[0.03]" : "hover:bg-black/[0.015]"
            } ${importing ? "opacity-40 pointer-events-none" : ""}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mx-auto mb-3 text-gray-400">
              <path d="M12 4v10M8 10l4 4 4-4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
            </svg>
            <p className="text-sm text-gray-500">
              Drop a model file here or <span className="text-black underline underline-offset-4">browse</span>
            </p>
            <p className="text-[10px] text-gray-300 mt-2">.safetensors · .onnx · .json · .bin</p>
          </div>

          {/* Importing indicator */}
          {importing && (
            <div className="bg-white p-4 flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500 animate-spin-slow">
                <circle cx="7" cy="7" r="5.5" strokeDasharray="22" strokeDashoffset="8" />
              </svg>
              <span className="text-xs text-gray-500">Importing model...</span>
            </div>
          )}

          {/* Imported models */}
          {models.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Imported models</p>
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {models.map((m) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-between bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/[0.03]">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                            <path d="M5 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5l-3-4H5z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">{m.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatBytes(m.sizeBytes)} · {m.type} · {m.baseModel}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-gray-400 hover:text-black transition-colors shrink-0"
                        aria-label="Remove"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                          <path d="M2.5 3h7M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4.5 5v4M7.5 5v4M2 3h8" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {models.length === 0 && !importing && (
            <div className="bg-white px-5 py-6 text-center">
              <p className="text-xs text-gray-400">No imported models yet. Drop a file above to get started.</p>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
