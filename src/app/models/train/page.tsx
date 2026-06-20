"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const OPTIONS = [
  {
    slug: "browser",
    title: "Browser Training",
    desc: "Train a small character-level LSTM personality model entirely in your browser. ~33K params, ~15-30 seconds. Extracts writing style from any text.",
    icon: "browser",
    status: "Ready" as const,
  },
  {
    slug: "gpu",
    title: "Bring Your Own GPU",
    desc: "For advanced fine-tuning: use your own GPU via Docker, Google Colab, or any Linux machine. Follow our step-by-step instructions — works with any NVIDIA GPU.",
    icon: "gpu",
    status: "Guide" as const,
  },
  {
    slug: "import",
    title: "Import Model",
    desc: "Upload a trained model file (.onnx, .safetensors, .bin) to use it in your browser. Share models from the community or bring your own fine-tuned adapters.",
    icon: "import",
    status: "Import" as const,
  },
  {
    slug: "export",
    title: "Export Model",
    desc: "Export your trained model as a portable file. Download LoRA adapters, merged ONNX models, or style embeddings to share or use elsewhere.",
    icon: "export",
    status: "Export" as const,
  },
];

export default function TrainPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-5 pt-12 pb-20">
        {/* Header */}
        <div className="text-center space-y-3 max-w-lg mb-12">
          <h1 className="text-2xl font-medium tracking-tight">Model Training</h1>
          <p className="text-sm text-gray-400">
            Train small models in your browser, or use your own GPU for advanced fine-tuning.
            You own everything — the data, the weights, the model.
          </p>
        </div>

        {/* Options grid */}
        <div className="w-full max-w-2xl mx-auto space-y-3">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              onClick={() => router.push(`/models/train/${opt.slug}`)}
              className="w-full flex items-start gap-4 bg-white px-5 py-4 text-left hover:bg-black/[0.015] transition-colors group"
            >
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black/[0.03]">
                {opt.icon === "browser" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                    <circle cx="9" cy="9" r="7" />
                    <path d="M9 5v4l3 2" />
                  </svg>
                )}
                {opt.icon === "gpu" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                    <rect x="2" y="5" width="14" height="8" />
                    <rect x="5" y="7" width="4" height="4" />
                    <path d="M16 9h1M1 9h1" />
                  </svg>
                )}
                {opt.icon === "import" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                    <path d="M9 2v10M5 8l4 4 4-4M3 14v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V14" />
                  </svg>
                )}
                {opt.icon === "export" && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                    <path d="M9 12V2M5 6l4-4 4 4M3 14v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V14" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium group-hover:opacity-70 transition-opacity">{opt.title}</p>
                  <span className={`shrink-0 text-[10px] font-medium uppercase tracking-wider ${
                    opt.status === "Ready" ? "text-black" : "text-gray-400"
                  }`}>
                    {opt.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{opt.desc}</p>
              </div>

              {/* Arrow */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mt-3 shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors">
                <path d="M4.5 2l4 4-4 4" />
              </svg>
            </motion.button>
          ))}
        </div>

        {/* Philosophy note */}
        <div className="w-full max-w-2xl mx-auto mt-12 bg-white px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">Zero-cost philosophy</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Training runs on your hardware. Browser training uses your CPU. Advanced fine-tuning
            uses your GPU, Google Colab, or any machine you choose. We provide the platform —
            your computer does the work. No API fees, no cloud costs, no limits.
          </p>
        </div>

        <Footer />
      </main>
    </div>
  );
}
