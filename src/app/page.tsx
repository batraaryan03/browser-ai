"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getEnabledModels, formatBytes, type ModelInfo } from "@/lib/models";

const CATEGORIES = [
  { key: "text", label: "Text" },
  { key: "vision", label: "Vision" },
  { key: "training", label: "Training" },
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => router.push(`/models/${model.slug}`)}
      className="group relative flex flex-col gap-3 bg-white rounded-xl border border-[var(--border-light)] p-4 text-left hover:border-[var(--border)] hover:shadow-sm transition-all duration-200 ease-out"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-alt)] text-[var(--fg-subtle)] group-hover:bg-[var(--fg)] group-hover:text-white transition-all duration-200 ease-out">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square">
            {icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--fg)]">{model.name}</p>
          <p className="text-[10px] text-[var(--fg-subtle)] mt-0.5 font-medium uppercase tracking-wider">
            {model.category}
          </p>
        </div>
        {model.sizeBytes > 0 && (
          <span className="text-[10px] text-[var(--fg-subtle)] font-mono shrink-0 tabular-nums">
            {formatBytes(model.sizeBytes)}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--fg-muted)] leading-relaxed line-clamp-2">
        {model.description}
      </p>
    </motion.button>
  );
}

export default function Home() {
  const models = getEnabledModels().filter((m) => m.slug !== "ocr");

  return (
    <div className="relative min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="hero-bg" />
          <div className="noise-overlay" />
          <div className="content-container relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-20">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="inline-flex items-center gap-1.5 bg-[var(--fg)]/5 px-3 py-1.5 rounded-full mb-6"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--fg)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-muted)]">
                  browser ai platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-[var(--fg)]"
              >
                AI that runs on
                <br />
                <span className="text-[var(--fg-muted)]">your machine.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="mt-5 text-sm sm:text-base text-[var(--fg-muted)] max-w-lg mx-auto leading-relaxed"
              >
                Pick a model below. It downloads once, caches locally, and runs entirely
                in your browser. No servers, no API keys, no limits.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="mt-8 flex items-center justify-center gap-3"
              >
                <a
                  href="#models"
                  className="inline-flex items-center gap-2 bg-[var(--fg)] text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-[var(--accent-hover)] transition-all duration-150 ease-out active:scale-[0.97]"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("models")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                    <path d="M3 5l4 4 4-4" />
                  </svg>
                  Browse models
                </a>
                <a
                  href="/docs"
                  className="inline-flex items-center gap-2 text-xs font-medium text-[var(--fg-muted)] px-5 py-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)] transition-all duration-150 ease-out active:scale-[0.97]"
                >
                  Documentation
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Model Grid */}
        <section id="models" className="content-container pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {CATEGORIES.map(({ key: catKey, label }) => {
              const catModels = models.filter((m) => m.category === catKey);
              if (catModels.length === 0) return null;

              // Compute global index offset
              let globalOffset = 0;
              for (const c of CATEGORIES) {
                if (c.key === catKey) break;
                globalOffset += models.filter((m) => m.category === c.key).length;
              }

              return (
                <div key={catKey} className="mb-10 last:mb-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-[var(--border-light)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                      {label}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border-light)]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catModels.map((m, i) => (
                      <ModelCard key={m.slug} model={m} index={globalOffset + i} />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* Features */}
        <section className="section-bg-light">
          <div className="content-container py-14 sm:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:divide-x sm:divide-[var(--border-light)]">
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
                    className="px-6 py-6 text-center"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg)] mb-2">{f.label}</p>
                    <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
