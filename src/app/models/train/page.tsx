"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { ReactNode } from "react";

// ── Image/Video assets ───────────────────────────────────────────────

const TRAINING_FLOW_IMG = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80&fm=webp&fit=crop";
const COLAB_IMG = "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1200&q=80&fm=webp&fit=crop";
const LOCAL_GPU_IMG = "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80&fm=webp&fit=crop";
const BROWSER_INFERENCE_IMG = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80&fm=webp&fit=crop";

const DEMO_VIDEO_URL = "https://www.pexels.com/video/organized-workspace-with-a-modern-touch-34616260/";

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Prepare data",
    desc: "Export your text as a .txt file. 50K+ characters recommended for good results. Books, articles, or personal writing all work.",
    image: LOCAL_GPU_IMG,
  },
  {
    step: "02",
    title: "Train with LoRA",
    desc: "SmolLM2-360M is loaded in 4-bit via Unsloth. LoRA adapters (rank 16) are trained on your text. Takes 5-15 min on a T4 GPU.",
    image: TRAINING_FLOW_IMG,
  },
  {
    step: "03",
    title: "Export to ONNX",
    desc: "The adapted model is merged and exported to ONNX with full KV-cache support. Zipped for browser upload.",
    image: COLAB_IMG,
  },
  {
    step: "04",
    title: "Chat in browser",
    desc: "Upload the ZIP to the Chat page. All inference runs locally via WebGPU/WASM — no server needed.",
    image: BROWSER_INFERENCE_IMG,
  },
];

interface Option {
  slug: string;
  title: string;
  desc: string;
  status: string;
  icon: ReactNode;
}

const TRAINING_OPTIONS: Option[] = [
  {
    slug: "browser",
    title: "Browser Training",
    desc: "Train a small character-level LSTM personality model entirely in your browser. ~33K params, ~15-30 seconds. Extracts writing style from any text.",
    status: "Ready",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
        <circle cx="9" cy="9" r="7" />
        <path d="M9 5v4l3 2" />
      </svg>
    ),
  },
  {
    slug: "gpu",
    title: "Bring Your Own GPU",
    desc: "For advanced fine-tuning: use your own GPU via Docker, Google Colab, or any Linux machine. Works with any NVIDIA GPU.",
    status: "Guide",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
        <rect x="2" y="5" width="14" height="8" />
        <rect x="5" y="7" width="4" height="4" />
        <path d="M16 9h1M1 9h1" />
      </svg>
    ),
  },
];

const PERSONALITY_OPTIONS: Option[] = [
  {
    slug: "import",
    title: "Import Personality",
    desc: "Upload a personality model (.json) to give the AI a custom writing style. Train in-browser, share, and import others' personalities.",
    status: "Import",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
        <path d="M9 2v10M5 8l4 4 4-4M3 14v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V14" />
      </svg>
    ),
  },
];

export default function TrainPage() {
  const router = useRouter();

  function renderOption(opt: Option, i: number) {
    return (
      <motion.button
        key={opt.slug}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08, duration: 0.3 }}
        onClick={() => router.push(`/models/train/${opt.slug}`)}
        className="w-full flex items-start gap-4 bg-white px-5 py-4 text-left hover:bg-black/[0.015] transition-colors group"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black/[0.03]">
          {opt.icon}
        </div>
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
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="mt-3 shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors">
          <path d="M4.5 2l4 4-4 4" />
        </svg>
      </motion.button>
    );
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-5 pt-12 pb-20">
        <div className="text-center space-y-3 max-w-lg mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Model Training</h1>
          <p className="text-sm text-gray-400">
            Train small models in your browser, or use your own GPU for advanced fine-tuning.
            You own everything — the data, the weights, the model.
          </p>
        </div>

        {/* ── Pipeline visualization ──────────────────────────────── */}

        <div className="w-full max-w-2xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--green)]" />
            <span className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider">The training pipeline</span>
          </div>
          <div className="grid gap-4">
            {PIPELINE_STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--border-light)]"
              >
                <div className="aspect-[16/6] overflow-hidden">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--green)] tracking-wider">{item.step}</span>
                    <span className="text-xs text-[var(--border)]">·</span>
                    <span className="text-xs font-semibold text-[var(--fg)]">{item.title}</span>
                  </div>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── Training options ────────────────────────────────────── */}

        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-4">Training Methods</p>
            <div className="space-y-3">
              {TRAINING_OPTIONS.map((opt, i) => renderOption(opt, i))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-4">Personality</p>
            <div className="space-y-3">
              {PERSONALITY_OPTIONS.map((opt, i) => renderOption(opt, i))}
            </div>
          </div>
        </div>

        {/* ── Demo video ───────────────────────────────────────────── */}

        <div className="w-full max-w-2xl mx-auto mt-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--green)]" />
            <span className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider">Training in action</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl aspect-video bg-[var(--bg-alt)]">
            <iframe
              src="https://www.pexels.com/video/organized-workspace-with-a-modern-touch-34616260/embed"
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen"
              title="Training workspace demo"
            />
          </div>
          <p className="text-xs text-[var(--fg-subtle)] text-center">
            Set up your workspace, prepare your data, and train your custom AI personality
          </p>
        </div>

        {/* ── Zero-cost philosophy ─────────────────────────────────── */}

        <div className="w-full max-w-2xl mx-auto mt-10 bg-white px-5 py-4">
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
