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
  if (pathname === "/docs") return "Docs";
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

function ModelDropdownItem({ model, onSelect }: { model: ModelInfo; onSelect: (m: ModelInfo) => void }) {
  return (
    <button
      onClick={() => onSelect(model)}
      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm text-[var(--fg-muted)] hover:bg-[var(--bg-alt)] hover:text-[var(--fg)] transition-all duration-150 ease-out"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--bg-alt)] text-[var(--fg-subtle)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square">
          {model.category === "text" && <path d="M3 1h6a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3l2-2z M3 1v2H1" />}
          {model.category === "vision" && <rect x="1" y="2" width="10" height="8" rx="1" />}
          {model.category === "training" && <circle cx="6" cy="6" r="4.5" />}
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{model.name}</p>
        <p className="text-[10px] text-[var(--fg-subtle)] mt-0.5">{model.description?.slice(0, 50)}</p>
      </div>
    </button>
  );
}

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

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
      <div className="content-container h-14 flex items-center justify-between">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => router.push("/")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--bg-alt)] transition-all duration-150 ease-out"
              aria-label="Back to home"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square">
                <path d="M9 2l-5 5 5 5" />
              </svg>
            </button>
          )}
          {pageName ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="text-sm font-semibold tracking-tight text-[var(--fg)] hover:opacity-70 transition-opacity duration-150"
              >
                browser ai
              </button>
              <span className="text-[var(--border)] text-xs">/</span>
              <span className="text-sm font-medium text-[var(--fg-muted)]">{pageName}</span>
            </div>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="text-sm font-semibold tracking-tight text-[var(--fg)] hover:opacity-70 transition-opacity duration-150"
            >
              browser ai
            </button>
          )}
        </div>

        {/* Right: navigation links */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/docs")}
            className="px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-alt)] rounded-md transition-all duration-150 ease-out"
          >
            Docs
          </button>
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-alt)] rounded-md transition-all duration-150 ease-out"
            >
              <span>Models</span>
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square"
                className={`transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
              >
                <path d="M2.5 3.5l2.5 3 2.5-3" />
              </svg>
            </button>

            {open && (
              <div className="absolute top-full right-0 z-50 mt-1.5 w-64 bg-white rounded-xl border border-[var(--border)] shadow-lg shadow-black/[0.04] overflow-hidden">
                <div className="p-1.5 max-h-80 overflow-y-auto space-y-0.5">
                  {["text", "vision", "training"].map((cat) => {
                    const catModels = models.filter((m) => m.category === cat);
                    if (catModels.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        {catModels.map((m) => (
                          <ModelDropdownItem
                            key={m.slug}
                            model={m}
                            onSelect={(model) => {
                              setOpen(false);
                              router.push(`/models/${model.slug}`);
                            }}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
