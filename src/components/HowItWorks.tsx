"use client";

import { motion } from "framer-motion";

const UPLOAD_IMG = "https://images.unsplash.com/photo-1686884879000-dc12d6a36c1c?w=800&q=80&fm=webp&fit=crop";
const PROCESS_IMG = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80&fm=webp&fit=crop";
const RESULT_IMG = "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80&fm=webp&fit=crop";

const STEPS = [
  {
    num: "01",
    title: "Upload your PDF",
    desc: "Drag and drop any PDF — a research paper, book chapter, or business report.",
    image: UPLOAD_IMG,
  },
  {
    num: "02",
    title: "AI processes it",
    desc: "T5-small reads, analyzes, and distills the content into a clear summary — entirely on your device.",
    image: PROCESS_IMG,
  },
  {
    num: "03",
    title: "Read & explore",
    desc: "Review your summary, copy it, download it, or save it for later. No data ever leaves your machine.",
    image: RESULT_IMG,
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
    <section className="relative w-full max-w-4xl mx-auto mt-16 overflow-hidden">
      <div className="py-12">
        <div className="text-center space-y-3 mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
            how it works
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[var(--fg)]">
            From PDF to insight in seconds
          </h2>
          <p className="text-sm text-[var(--fg-muted)] max-w-sm mx-auto leading-relaxed">
            Three simple steps to turn any document into actionable knowledge — all on your device.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {STEPS.map((s) => (
            <motion.div
              key={s.num}
              variants={item}
              className="group relative overflow-hidden rounded-2xl bg-white border border-[var(--border-light)]"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${s.image})` }}
                />
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-bold text-[var(--green)] tracking-wider">{s.num}</span>
                <h3 className="text-sm font-bold text-[var(--fg)] mt-1">{s.title}</h3>
                <p className="text-sm text-[var(--fg-muted)] mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
