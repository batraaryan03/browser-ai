"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getEnabledModels, formatBytes, type ModelInfo } from "@/lib/models";

const CATEGORY_LABELS: Record<string, string> = {
  text: "Text",
  vision: "Vision",
  training: "Training",
};

function ModelCard({ model, index }: { model: ModelInfo; index: number }) {
  const router = useRouter();
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => router.push(`/models/${model.slug}`)}
      className="flex flex-col items-start gap-2 bg-white px-4 py-4 text-left hover:bg-black/[0.015] transition-colors group w-full"
    >
      <div className="flex items-center gap-2.5 w-full">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/[0.03]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
            {model.category === "text" && <path d="M4 1h7a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4l2-3z M4 1v3H1" />}
            {model.category === "vision" && <rect x="1.5" y="2.5" width="11" height="9" rx="1" />}
            {model.category === "training" && <circle cx="7" cy="7" r="5.5" />}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:opacity-70 transition-opacity truncate">{model.name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{CATEGORY_LABELS[model.category] ?? model.category}</p>
        </div>
        {model.sizeBytes > 0 && (
          <span className="text-[10px] text-gray-300 shrink-0">{formatBytes(model.sizeBytes)}</span>
        )}
      </div>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 text-left">{model.description}</p>
    </motion.button>
  );
}

export default function Home() {
  const models = getEnabledModels().filter((m) => m.slug !== "ocr");
  const textModels = models.filter((m) => m.category === "text");
  const visionModels = models.filter((m) => m.category === "vision");
  const trainingModels = models.filter((m) => m.category === "training");

  return (
    <div className="relative min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pb-8">
        {/* Hero */}
        <div className="w-full max-w-2xl mx-auto text-center space-y-6 pt-20 pb-12">
          <div className="inline-flex items-center gap-1.5 bg-black/[0.03] px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 bg-black" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">browser ai platform</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight leading-[1.08] sm:text-5xl">
            AI that runs on<br />
            <span className="text-gray-500">your machine.</span>
          </h1>
          <p className="text-sm leading-relaxed text-gray-400 max-w-sm mx-auto">
            Pick a model below. It downloads once, caches locally, and runs entirely in your browser.
            No servers, no API keys, no limits.
          </p>
        </div>

        {/* Model Cards Grid */}
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {textModels.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-3">Text</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {textModels.map((m, i) => (
                  <ModelCard key={m.slug} model={m} index={i} />
                ))}
              </div>
            </div>
          )}

          {visionModels.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-3">Vision</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visionModels.map((m, i) => (
                  <ModelCard key={m.slug} model={m} index={i + textModels.length} />
                ))}
              </div>
            </div>
          )}

          {trainingModels.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-3">Training</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trainingModels.map((m, i) => (
                  <ModelCard key={m.slug} model={m} index={i + textModels.length + visionModels.length} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-2xl mx-auto mt-10"
        >
          <div className="grid grid-cols-3 divide-x divide-black/[0.04] border-t border-black/[0.04]">
            {[
              { label: "100% local", desc: "Your data stays on your device" },
              { label: "Zero cost", desc: "No API fees, no subscriptions" },
              { label: "Offline-ready", desc: "Works after first download" },
            ].map((f) => (
              <div key={f.label} className="px-4 py-5 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wider text-black mb-1">{f.label}</p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <Footer />
      </main>
    </div>
  );
}
