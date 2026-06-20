"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ModelSelector } from "@/components/ModelSelector";
import { Footer } from "@/components/Footer";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-16">
        {/* Hero area — centered, minimal */}
        <div className="relative w-full max-w-lg mx-auto text-center space-y-8 pt-24 pb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-black/[0.03] px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 bg-black" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">
              browser ai platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-medium tracking-tight leading-[1.08] sm:text-5xl">
            AI that runs on
            <br />
            <span className="text-gray-500">your machine.</span>
          </h1>

          <p className="text-sm leading-relaxed text-gray-400 max-w-sm mx-auto">
            Pick a model below. It downloads once, caches locally, and runs entirely in your browser.
            No servers, no API keys, no limits.
          </p>

          {/* Model selector */}
          <div className="pt-4">
            <ModelSelector />
          </div>

          {/* Quick links */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => router.push("/models/summarize")}
              className="text-xs text-gray-400 hover:text-black underline underline-offset-4 transition-colors"
            >
              Skip to summarization
            </button>
            <span className="w-px h-3 bg-gray-300/30" />
            <button
              onClick={() => router.push("/models/train")}
              className="text-xs text-gray-400 hover:text-black underline underline-offset-4 transition-colors"
            >
              Train a model
            </button>
          </div>
        </div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-2xl mx-auto mt-8"
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
