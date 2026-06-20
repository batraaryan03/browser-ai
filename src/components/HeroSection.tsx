"use client";

import { useState, useEffect } from "react";

const SAMPLES = [
  "a research paper",
  "a business report",
  "a book chapter",
  "a legal document",
  "an academic thesis",
];

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = SAMPLES[index];
    let t: NodeJS.Timeout;

    if (!deleting) {
      if (text.length < current.length) {
        t = setTimeout(() => setText(current.slice(0, text.length + 1)), 50);
      } else {
        t = setTimeout(() => setDeleting(true), 2000);
      }
    } else {
      if (text.length > 0) {
        t = setTimeout(() => setText(text.slice(0, -1)), 25);
      } else {
        setDeleting(false);
        setIndex((i) => (i + 1) % SAMPLES.length);
      }
    }

    return () => clearTimeout(t);
  }, [text, deleting, index]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background image */}
      <div className="hero-bg" />

      {/* Animated flowing gradient overlay */}
      <div className="hero-flow" aria-hidden />

      {/* Content */}
      <div className="relative z-10 text-center space-y-5 max-w-lg mx-auto pt-16 pb-20">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
          pdf summarization
        </p>

        <h1 className="text-4xl font-medium tracking-tight leading-[1.08] sm:text-5xl text-[#1d1d1f]">
          Large documents,
          <br />
          deserve a short read.
        </h1>

        <p className="text-sm leading-relaxed text-gray-500">
          Upload any PDF —{" "}
          <span className="inline-block min-w-[9em] text-gray-700">
            {text}
            <span className="animate-caret text-black">|</span>
          </span>
          <br />
          and get a clear, intelligent summary in seconds.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-black">
              <path d="M2 5l2 3 4-5" />
            </svg>
            No uploads to servers
          </span>
          <span className="w-px h-3 bg-gray-300/50" />
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-black">
              <path d="M2 5l2 3 4-5" />
            </svg>
            Runs in your browser
          </span>
          <span className="w-px h-3 bg-gray-300/50" />
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-black">
              <path d="M2 5l2 3 4-5" />
            </svg>
            Free & private
          </span>
        </div>
      </div>
    </div>
  );
}
