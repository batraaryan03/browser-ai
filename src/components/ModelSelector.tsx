"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ModelInfo } from "@/lib/models";
import { getEnabledModels, formatBytes } from "@/lib/models";

export function ModelSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selected, setSelected] = useState<ModelInfo | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setModels(getEnabledModels());
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleSelect(model: ModelInfo) {
    setSelected(model);
    setOpen(false);
    router.push(`/models/${model.slug}`);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  // Categorize
  const textModels = models.filter((m) => m.category === "text");
  const visionModels = models.filter((m) => m.category === "vision");
  const trainingModels = models.filter((m) => m.category === "training");

  return (
    <div ref={ref} className="relative w-full max-w-sm mx-auto">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between bg-white px-4 py-3 text-left focus:outline-none group"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "text-sm text-black font-medium" : "text-sm text-gray-400"}>
          {selected ? selected.name : "Select a model..."}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.06)] max-h-80 overflow-y-auto">
          <div className="p-1.5 space-y-0.5" role="listbox">
            {textModels.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">
                  Text
                </p>
                {textModels.map((m) => (
                  <button
                    key={m.slug}
                    onClick={() => handleSelect(m)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.02] transition-colors ${
                      selected?.slug === m.slug ? "bg-black/[0.03]" : ""
                    }`}
                    role="option"
                    aria-selected={selected?.slug === m.slug}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/[0.03]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <path d="M4 1h7a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4l2-3z" />
                        <path d="M4 1v3H1" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {formatBytes(m.sizeBytes)} · {m.dtype}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {visionModels.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">
                  Vision
                </p>
                {visionModels.map((m) => (
                  <button
                    key={m.slug}
                    onClick={() => handleSelect(m)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.02] transition-colors ${
                      selected?.slug === m.slug ? "bg-black/[0.03]" : ""
                    }`}
                    role="option"
                    aria-selected={selected?.slug === m.slug}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/[0.03]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <rect x="1.5" y="2.5" width="11" height="9" />
                        <circle cx="5" cy="6" r="1.5" />
                        <path d="M13 9l-2.5-3.5L8 9.5 6 7.5 3 11.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {formatBytes(m.sizeBytes)} · {m.dtype}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {trainingModels.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">
                  Training
                </p>
                {trainingModels.map((m) => (
                  <button
                    key={m.slug}
                    onClick={() => handleSelect(m)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.02] transition-colors ${
                      selected?.slug === m.slug ? "bg-black/[0.03]" : ""
                    }`}
                    role="option"
                    aria-selected={selected?.slug === m.slug}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/[0.03]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" className="text-gray-500">
                        <circle cx="7" cy="7" r="5.5" />
                        <path d="M7 4v4M7 10v.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {models.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">No models available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
