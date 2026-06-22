"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getEnabledModels, formatBytes, type ModelInfo } from "@/lib/models";

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
        {/* Hero - full bleed, massive text */}
        <section className="px-6 sm:px-10 pt-28 pb-20 sm:pt-36 sm:pb-24">
          <div className="max-w-5xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] text-[var(--fg)]"
            >
              AI that runs
              <br />
              <span className="text-[var(--fg-subtle)]">on your machine</span>
              <span className="green-dot ml-3 sm:ml-4 align-middle inline-block" />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="mt-6 text-base sm:text-lg text-[var(--fg-muted)] max-w-xl leading-relaxed"
            >
              Pick a model below. It downloads once, caches locally, and runs entirely
              in your browser. No servers, no API keys, no limits.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="mt-8 flex items-center gap-4"
            >
              <a
                href="#models"
                className="inline-flex items-center gap-2 bg-[var(--green)] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[var(--green-hover)] transition-all duration-150 ease-out active:scale-[0.97]"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("models")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Browse models
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                  <path d="M3 5l4 4 4-4" />
                </svg>
              </a>
              <a
                href="/docs"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--fg-muted)] px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)] transition-all duration-150 ease-out active:scale-[0.97]"
              >
                Docs
              </a>
            </motion.div>
          </div>
        </section>

        {/* Models - full-width grid */}
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

        {/* Features */}
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
