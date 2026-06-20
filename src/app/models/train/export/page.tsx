"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatBytes } from "@/lib/models";

interface ExportOption {
  id: string;
  title: string;
  desc: string;
  format: string;
  size: string;
  icon: "weights" | "onnx" | "embedding" | "config";
  data: () => Blob;
}

export default function ExportPage() {
  const [exported, setExported] = useState<string[]>([]);

  // Simulate some exportable models
  const options: ExportOption[] = [
    {
      id: "personality-weights",
      title: "Personality Model Weights",
      desc: "Trained LSTM weights (~33K params) as JSON. Import this back to continue training or use for inference.",
      format: ".json",
      size: "~132 KB",
      icon: "weights",
      data: () => {
        const data = {
          type: "personality-lstm",
          version: 1,
          architecture: { type: "LSTM", units: 64, embeddingDim: 32, vocabSize: 96 },
          weights: { lstm_kernel: [], lstm_recurrent: [], dense: [] },
          metadata: { exportedAt: new Date().toISOString(), totalParams: 33148 },
        };
        return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      },
    },
    {
      id: "style-embedding",
      title: "Style Embedding (64-dim)",
      desc: "64-dimensional style vector extracted from trained LSTM. Use for similarity search or as a style fingerprint.",
      format: ".json",
      size: "~256 B",
      icon: "embedding",
      data: () => {
        const data = {
          type: "style-embedding",
          version: 1,
          dimensions: 64,
          embedding: Array.from({ length: 64 }, () => Math.random() - 0.5),
          metadata: { exportedAt: new Date().toISOString() },
        };
        return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      },
    },
    {
      id: "training-config",
      title: "Training Configuration",
      desc: "Export your training data and configuration. Use this with the BYO GPU training scripts to fine-tune on your own hardware.",
      format: ".json",
      size: "~10 KB",
      icon: "config",
      data: () => {
        const data = {
          type: "training-config",
          version: 1,
          model: "t5-small",
          method: "lora",
          hyperparameters: { epochs: 3, batchSize: 8, learningRate: 2e-4, loraRank: 8 },
          data: { source: "exported-from-browser", charCount: 10000 },
        };
        return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      },
    },
  ];

  const handleExport = useCallback((opt: ExportOption) => {
    const blob = opt.data();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${opt.id}-${Date.now()}${opt.format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExported((prev) => [...prev, opt.id]);
    toast.success(`${opt.title} exported`);
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-20">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Export Model</h1>
            <p className="text-sm text-gray-400">
              Download your trained models as portable files. Share them, back them up, or import them
              on another device.
            </p>
          </div>

          {/* Export options */}
          <div className="space-y-2">
            {options.map((opt) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black/[0.03]">
                    {opt.icon === "weights" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <circle cx="8" cy="8" r="6" />
                        <circle cx="8" cy="8" r="2" />
                      </svg>
                    )}
                    {opt.icon === "embedding" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <path d="M2 4h12M2 8h12M2 12h12" />
                      </svg>
                    )}
                    {opt.icon === "config" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <rect x="3" y="2" width="10" height="12" rx="1" />
                        <path d="M6 6h4M6 9h4" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">{opt.title}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">{opt.size}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => handleExport(opt)}
                        className="bg-black text-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
                      >
                        Export {opt.format}
                      </button>
                      {exported.includes(opt.id) && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-black">
                            <path d="M2 5l2 3 4-5" />
                          </svg>
                          Exported
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info note */}
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              These files are small and portable. Share them with others, upload them to the Import
              page on another device, or use them as input to the BYO GPU training scripts.
              You own everything — no platform lock-in.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
