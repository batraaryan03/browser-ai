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
    <nav className="sticky top-0 z-50 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--border-light)]">
      <div className="px-6 sm:px-10 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => router.push("/")}
          className="text-base font-bold tracking-tight text-[var(--fg)] hover:opacity-70 transition-opacity duration-150"
        >
          <span className="text-[var(--green)]">browser</span>{" "}
          <span>ai</span>
          {pageName && !isHome && (
            <span className="text-[var(--fg-subtle)] font-normal ml-2">
              / <span className="text-[var(--fg-muted)]">{pageName}</span>
            </span>
          )}
        </button>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/docs")}
            className="px-4 py-2 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-alt)] rounded-lg transition-all duration-150 ease-out"
          >
            Docs
          </button>
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-alt)] rounded-lg transition-all duration-150 ease-out"
            >
              <span>Models</span>
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"
                className={`transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
              >
                <path d="M2.5 3.5l2.5 3 2.5-3" />
              </svg>
            </button>
            {open && (
              <div className="absolute top-full right-0 z-50 mt-1.5 w-72 bg-white rounded-xl border border-[var(--border)] shadow-lg overflow-hidden">
                <div className="p-2 space-y-1">
                  {["text", "vision", "training"].map((cat) => {
                    const catModels = models.filter((m) => m.category === cat);
                    if (catModels.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        {catModels.map((m) => (
                          <button
                            key={m.slug}
                            onClick={() => {
                              setOpen(false);
                              router.push(`/models/${m.slug}`);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--fg-muted)] hover:bg-[var(--bg-alt)] hover:text-[var(--fg)] transition-all duration-150 ease-out"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-alt)] text-[var(--fg-subtle)]">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square">
                                {m.category === "text" && <path d="M3.5 1h7a1 1 0 011 1v9a1 1 0 01-1 1h-8a1 1 0 01-1-1V3.5l2-2.5zM3.5 1v2.5H1" />}
                                {m.category === "vision" && <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" />}
                                {m.category === "training" && <circle cx="7" cy="7" r="5" />}
                              </svg>
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{m.name}</p>
                              <p className="text-xs text-[var(--fg-subtle)] truncate">{m.description?.slice(0, 60)}</p>
                            </div>
                          </button>
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
