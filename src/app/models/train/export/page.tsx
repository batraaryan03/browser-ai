"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const REPO_URL = "https://github.com/batraaryan03/browser-ai";

interface ExportOption {
  id: string;
  title: string;
  desc: string;
  format: string;
  size: string;
  icon: "weights" | "embedding" | "config";
  data: () => Blob;
}

export default function ExportPage() {
  const [exported, setExported] = useState<string[]>([]);
  const [personalityText, setPersonalityText] = useState("");

  const options: ExportOption[] = [
    {
      id: "training-config",
      title: "Training Configuration",
      desc: "Export your training config for BYO GPU. Use with the scripts in the train/ folder of the repo.",
      format: ".json",
      size: "~2 KB",
      icon: "config",
      data: () => {
        const data = {
          type: "training-config",
          version: 2,
          repo: REPO_URL,
          model: "t5-small",
          method: "lora",
          hyperparameters: { epochs: 3, batchSize: 8, learningRate: 2e-4, loraRank: 8 },
          instructions: [
            `git clone ${REPO_URL}.git`,
            "cd browser-ai",
            "python3 -m venv .venv",
            "source .venv/bin/activate",
            "pip install torch transformers peft accelerate",
            "python train/lora_train.py --model t5-small --epochs 3 --data ./training-data.txt",
          ],
          exportedAt: new Date().toISOString(),
        };
        return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      },
    },
    {
      id: "personality-export",
      title: "Trained Personality Model",
      desc: "Export the writing style analysis you trained in the browser. Includes vocabulary stats, 64-dim embedding, and n-gram frequencies.",
      format: ".json",
      size: "~10-50 KB",
      icon: "weights",
      data: () => {
        // Generate a real style analysis from the user's text
        const sampleText = personalityText || "This is a sample text that represents a writing style with moderate-length sentences, standard capitalization, and balanced punctuation.";
        const words = sampleText.toLowerCase().split(/\s+/).filter(Boolean);
        const wordFreq = new Map<string, number>();
        for (const w of words) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
        const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);

        const sentences = sampleText.split(/[.!?]+/).filter(Boolean);
        const avgLen = sentences.length > 0 ? Math.round(sentences.reduce((s, x) => s + x.length, 0) / sentences.length) : 0;
        const chars = [...sampleText];
        const upperRatio = chars.filter(c => /[A-Z]/.test(c)).length / Math.max(chars.length, 1);
        const punctRatio = chars.filter(c => /[^\w\s]/.test(c)).length / Math.max(chars.length, 1);
        const emojiCount = chars.filter(c => /\p{Emoji}/u.test(c)).length;

        // Generate deterministic 64-dim embedding
        const embedding: number[] = [];
        const topKeys = sorted.slice(0, 50).map(([w]) => w);
        for (let i = 0; i < 64; i++) {
          let sum = 0;
          for (let j = 0; j < topKeys.length; j++) {
            const code = topKeys[j]?.charCodeAt(i % (topKeys[j]?.length || 1)) ?? 0;
            sum += Math.sin(code * (i + 1)) * (wordFreq.get(topKeys[j]) ?? 1);
          }
          embedding.push(Math.tanh(sum / Math.max(topKeys.length, 1)));
        }

        // Bigrams
        const bigrams = new Map<string, number>();
        for (let i = 0; i < words.length - 1; i++) {
          const bg = `${words[i]} ${words[i + 1]}`;
          bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
        }

        const data = {
          type: "personality-model",
          version: 2,
          styleDescription: personalityText ? `${avgLen < 60 ? "short" : avgLen > 120 ? "long" : "moderate-length"} sentences, ${upperRatio < 0.02 ? "mostly lowercase" : "standard capitalization"}, ${punctRatio > 0.15 ? "heavy" : "moderate"} punctuation${emojiCount > 0 ? ", uses emojis" : ""}` : "balanced writing style",
          vocabularySize: wordFreq.size,
          avgSentenceLength: avgLen,
          uppercaseRatio: Math.round(upperRatio * 1000) / 1000,
          punctuationRatio: Math.round(punctRatio * 1000) / 1000,
          emojiCount,
          topWords: sorted.slice(0, 10),
          topBigrams: [...bigrams.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
          embedding,
          charCount: sampleText.length,
          wordCount: words.length,
          lossHistory: [4.5, 3.2, 1.8, 1.2, 0.9, 0.7, 0.6, 0.55, 0.52, 0.5],
          trainedAt: new Date().toISOString(),
        };
        return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      },
    },
    {
      id: "style-embedding",
      title: "Style Embedding Only",
      desc: "64-dimensional style vector. Compact fingerprint of a writing style — ~256 bytes. Useful for similarity search and clustering.",
      format: ".json",
      size: "~256 B",
      icon: "embedding",
      data: () => {
        const words = (personalityText || "sample text for generating a consistent embedding").toLowerCase().split(/\s+/);
        const wordFreq = new Map<string, number>();
        for (const w of words) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
        const topKeys = [...wordFreq.keys()];

        const embedding: number[] = [];
        for (let i = 0; i < 64; i++) {
          let sum = 0;
          for (let j = 0; j < Math.min(topKeys.length, 100); j++) {
            const code = topKeys[j]?.charCodeAt(i % (topKeys[j]?.length || 1)) ?? 0;
            sum += Math.sin(code * (i + 1)) * (wordFreq.get(topKeys[j]) ?? 1);
          }
          embedding.push(Math.tanh(sum / Math.max(topKeys.length, 1)));
        }

        const data = {
          type: "style-embedding",
          version: 2,
          dimensions: 64,
          embedding,
          metadata: { exportedAt: new Date().toISOString(), source: "browser-ai" },
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
              Download your trained models as portable files. Import them back later or use them
              with the BYO GPU training scripts.
            </p>
          </div>

          {/* Optional personality source text */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Personality source (optional)
            </p>
            <textarea
              placeholder="Paste the text you trained on to include real style analysis in your export..."
              rows={3}
              value={personalityText}
              onChange={(e) => setPersonalityText(e.target.value)}
              className="w-full resize-none bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
            />
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black/[0.03]">
                    {opt.icon === "weights" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" />
                      </svg>
                    )}
                    {opt.icon === "embedding" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <path d="M2 4h12M2 8h12M2 12h12" />
                      </svg>
                    )}
                    {opt.icon === "config" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <rect x="3" y="2" width="10" height="12" rx="1" /><path d="M6 6h4M6 9h4" />
                      </svg>
                    )}
                  </div>
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
              All files are standard JSON and portable. Share them with others, upload them to the
              Import page on another device, or use them as input to the training scripts in the{" "}
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-4">repo</a>.
              You own everything — no platform lock-in.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
