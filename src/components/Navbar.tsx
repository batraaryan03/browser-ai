"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getEnabledModels, type ModelInfo } from "@/lib/models";

const MODEL_NAMES: Record<string, string> = {
  summarize: "Summarize",
  "remove-bg": "Background Removal",
  classify: "Image Classifier",
  detect: "Object Detection",
  segment: "Image Segmentation",
  train: "Model Training",
  chat: "Personality Chat",
  "train/personality": "Import Personality",
};

function getPageName(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "models" && parts[1]) {
    if (parts[2] === "browser") return "Browser Training";
    if (parts[2] === "gpu") return "BYO GPU Training";
    if (parts[2] === "import") return "Import Personality";
    return MODEL_NAMES[parts[1]] ?? parts[1];
  }
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  text: "Text",
  vision: "Vision",
  training: "Training",
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pageName = getPageName(pathname);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const models = getEnabledModels().filter((m) => m.slug !== "ocr");
  const textModels = models.filter((m) => m.category === "text");
  const visionModels = models.filter((m) => m.category === "vision");
  const trainingModels = models.filter((m) => m.category === "training");

  function handleSelect(m: ModelInfo) {
    setOpen(false);
    router.push(`/models/${m.slug}`);
  }

  return (
    <nav className="sticky top-0 z-50 bg-white">
      <div className="mx-auto max-w-5xl px-5 h-12 flex items-center justify-between">
        {/* Left: brand + breadcrumb */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => router.push("/")}
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
              aria-label="Back to home"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                <path d="M8.5 2l-4 4.5 4 4.5" />
              </svg>
            </button>
          )}
          {pageName ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="text-sm font-medium tracking-tight hover:opacity-60 transition-opacity"
              >
                browser ai
              </button>
              <span className="text-gray-300 text-[10px]">/</span>
              <span className="text-sm font-medium text-gray-500">{pageName}</span>
            </div>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium tracking-tight hover:opacity-60 transition-opacity"
            >
              browser ai
            </button>
          )}
        </div>

        {/* Right: model selector */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
          >
            <span>Models</span>
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square"
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            >
              <path d="M2.5 3.5l2.5 3 2.5-3" />
            </svg>
          </button>

          {open && (
            <div className="absolute top-full right-0 z-50 mt-1 bg-white border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.06)] w-56 max-h-80 overflow-y-auto">
              <div className="p-1.5 space-y-0.5">
                {textModels.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">Text</p>
                    {textModels.map((m) => (
                      <button
                        key={m.slug}
                        onClick={() => handleSelect(m)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black/[0.02] transition-colors"
                      >
                        <span className="text-sm text-gray-700">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {visionModels.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">Vision</p>
                    {visionModels.map((m) => (
                      <button
                        key={m.slug}
                        onClick={() => handleSelect(m)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black/[0.02] transition-colors"
                      >
                        <span className="text-sm text-gray-700">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {trainingModels.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">Training</p>
                    {trainingModels.map((m) => (
                      <button
                        key={m.slug}
                        onClick={() => handleSelect(m)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black/[0.02] transition-colors"
                      >
                        <span className="text-sm text-gray-700">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
