"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getEnabledModels, formatBytes, type ModelInfo } from "@/lib/models";

const HERO_IMAGE = "https://images.unsplash.com/photo-1679900898687-3200929283f5?w=1920&q=80&fm=webp&fit=crop";
const CODE_IMAGE = "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1920&q=80&fm=webp&fit=crop";
const NEURAL_IMAGE = "https://images.unsplash.com/photo-1665249673961-0b84f33b1e36?w=1920&q=80&fm=webp&fit=crop";
const WORKSPACE_IMAGE = "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1920&q=80&fm=webp&fit=crop";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick a model",
    desc: "Choose from text, vision, or training models. They download once and cache locally in your browser.",
    image: HERO_IMAGE,
  },
  {
    step: "02",
    title: "Run locally",
    desc: "Inference runs entirely on your device via WebGPU or WASM. No data ever leaves your machine.",
    image: CODE_IMAGE,
  },
  {
    step: "03",
    title: "Own your data",
    desc: "No servers, no API keys, no limits. You control everything — the model, the data, the privacy.",
    image: NEURAL_IMAGE,
  },
];

function ModelCard({ model, index }: { model: ModelInfo; index: number }) {
  const router = useRouter();
  const icon =
    model.category === "text" ? (
      <path d="M3.5 1h7a1 1 0 011 1v9a1 1 0 01-1 1h-8a1 1 0 01-1-1V3.5l2-2.5zM3.5 1v2.5H1" />
    ) : model.category === "vision" ? (
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" />
    ) : (
      <circle cx="7" cy="7" r="5" />
    );

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => router.push(`/models/${model.slug}`)}
      className="group flex flex-col gap-4 bg-white rounded-2xl border border-[var(--border-light)] p-6 text-left hover:border-[var(--border)] hover:shadow-sm transition-all duration-200 ease-out"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-alt)] text-[var(--fg-subtle)] group-hover:bg-[var(--fg)] group-hover:text-white transition-all duration-200 ease-out">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square">
            {icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[var(--fg)]">{model.name}</p>
          <p className="text-xs text-[var(--fg-subtle)] mt-0.5 font-medium uppercase tracking-wider">
            {model.category}
          </p>
        </div>
        {model.sizeBytes > 0 && (
          <span className="text-xs text-[var(--fg-subtle)] font-mono tabular-nums">
            {formatBytes(model.sizeBytes)}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
        {model.description}
      </p>
    </motion.button>
  );
}

export default function Home() {
  const router = useRouter();
  const models = getEnabledModels().filter((m) => m.slug !== "ocr");
  const textModels = models.filter((m) => m.category === "text");
  const visionModels = models.filter((m) => m.category === "vision");
  const trainingModels = models.filter((m) => m.category === "training");

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* ─── Hero — full-bleed with background image ─────────────── */}

        <section className="relative overflow-hidden bg-[var(--fg)]">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${HERO_IMAGE})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--fg)]/95 via-[var(--fg)]/90 to-[var(--fg)]/80" />
          </div>

          <div className="relative z-10 px-6 sm:px-10 pt-28 pb-20 sm:pt-36 sm:pb-24">
            <div className="max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full mb-6">
                  <span className="green-dot" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    browser ai platform
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] text-white"
              >
                AI that runs
                <br />
                <span className="text-white/40">on your machine.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="mt-6 text-base sm:text-lg text-white/50 max-w-xl leading-relaxed"
              >
                Pick a model below. It downloads once, caches locally, and runs entirely
                in your browser. No servers, no API keys, no limits.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="mt-8 flex items-center gap-4"
              >
                <a
                  href="#models"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("models")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 bg-[var(--green)] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[var(--green-hover)] transition-all duration-150 ease-out active:scale-[0.97]"
                >
                  Browse models
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                    <path d="M3 5l4 4 4-4" />
                  </svg>
                </a>
                <a
                  href="/docs"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/60 px-6 py-3 rounded-xl border border-white/10 hover:border-white/30 hover:text-white transition-all duration-150 ease-out active:scale-[0.97]"
                >
                  Docs
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── How it works — with images ──────────────────────────── */}

        <section className="px-6 sm:px-10 py-20 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--fg)]">
                How it works
              </h2>
              <p className="mt-3 text-base text-[var(--fg-muted)] max-w-lg">
                Three simple steps to run AI locally. No cloud, no setup, no cost.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--border-light)]"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <div
                      className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold text-[var(--green)] tracking-wider">{item.step}</span>
                    <h3 className="text-base font-bold text-[var(--fg)] mt-1">{item.title}</h3>
                    <p className="text-sm text-[var(--fg-muted)] mt-1.5 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Models grid ─────────────────────────────────────────── */}

        <section id="models" className="px-6 sm:px-10 pb-20 sm:pb-24">
          <div className="space-y-12">
            {textModels.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-subtle)] mb-5">Text</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {textModels.map((m, i) => (
                    <ModelCard key={m.slug} model={m} index={i} />
                  ))}
                </div>
              </div>
            )}
            {visionModels.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-subtle)] mb-5">Vision</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visionModels.map((m, i) => (
                    <ModelCard key={m.slug} model={m} index={textModels.length + i} />
                  ))}
                </div>
              </div>
            )}
            {trainingModels.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-subtle)] mb-5">Training</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainingModels.map((m, i) => (
                    <ModelCard key={m.slug} model={m} index={textModels.length + visionModels.length + i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── How to train video section ──────────────────────────── */}

        <section className="bg-[var(--bg-alt)]">
          <div className="px-6 sm:px-10 py-20 sm:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                >
                  <span className="text-xs font-bold text-[var(--green)] uppercase tracking-wider">Training</span>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--fg)] mt-2">
                    Create your own personality
                  </h2>
                  <p className="mt-3 text-base text-[var(--fg-muted)] leading-relaxed">
                    Fine-tune SmolLM2-360M on any text using LoRA + Unsloth. Export to ONNX,
                    upload to the Chat page, and start talking to your custom AI — all in your browser.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      { label: "1. Train", desc: "Use your GPU or Google Colab. ~5-15 minutes." },
                      { label: "2. Export", desc: "Automatic ONNX export with --export-onnx flag." },
                      { label: "3. Upload", desc: "Drag the ZIP into the Chat page." },
                      { label: "4. Chat", desc: "All inference runs locally via WebGPU." },
                    ].map(({ label, desc }) => (
                      <div key={label} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--green)] text-white text-[10px] font-bold">
                          {label[0]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--fg)]">{label}</p>
                          <p className="text-sm text-[var(--fg-muted)]">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex gap-3">
                    <a
                      href="/models/train"
                      className="inline-flex items-center gap-2 bg-[var(--fg)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-85 transition-all duration-150 ease-out active:scale-[0.97]"
                    >
                      Start training
                    </a>
                    <a
                      href="/models/chat"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[var(--fg-muted)] px-5 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)] transition-all duration-150 ease-out active:scale-[0.97]"
                    >
                      Chat with a model
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="relative overflow-hidden rounded-2xl aspect-[4/3]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${WORKSPACE_IMAGE})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                      <span>All inference runs locally — zero server cost</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ────────────────────────────────────────────── */}

        <section className="border-t border-[var(--border-light)]">
          <div className="px-6 sm:px-10 py-16 sm:py-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-0 sm:divide-x sm:divide-[var(--border-light)]">
              {[
                { label: "100% local", desc: "Your data stays on your device. No uploads, no servers, no third parties." },
                { label: "Zero cost", desc: "No API fees, no GPU rentals, no subscriptions. Your hardware does the work." },
                { label: "Offline-ready", desc: "Works after the first download. No internet required for inference." },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="sm:px-10"
                >
                  <p className="text-sm font-bold uppercase tracking-wider text-[var(--fg)] mb-3">{f.label}</p>
                  <p className="text-base text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
