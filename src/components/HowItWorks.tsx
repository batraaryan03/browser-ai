"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Upload your PDF",
    desc: "Drag and drop any PDF — a research paper, book chapter, or business report.",
  },
  {
    num: "02",
    title: "AI processes it",
    desc: "T5-small reads, analyzes, and distills the content into a clear summary — entirely on your device.",
  },
  {
    num: "03",
    title: "Read & explore",
    desc: "Review your summary, copy it, download it, or save it for later. No data ever leaves your machine.",
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorks() {
  return (
    <section className="relative w-full max-w-4xl mx-auto mt-28 overflow-hidden">
      {/* Decorative background */}
      <div className="section-bg" />

      <div className="relative z-10 py-16">
        <div className="text-center space-y-3 mb-14">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
            how it works
          </p>
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl text-[#1d1d1f]">
            From PDF to insight in seconds
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Three simple steps to turn any document into actionable knowledge.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {STEPS.map((s) => (
            <motion.div key={s.num} variants={item} className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-black/[0.03] mb-4">
                <span className="text-sm font-semibold text-gray-500">{s.num}</span>
              </div>
              <h3 className="text-base font-medium mb-2 text-[#1d1d1f]">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
