"use client";

import { useRouter, usePathname } from "next/navigation";

const MODEL_NAMES: Record<string, string> = {
  summarize: "Summarize",
  "remove-bg": "Background Removal",
  classify: "Image Classifier",
  train: "Model Training",
};

function getPageName(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  // /models/summarize → parts = ["models", "summarize"]
  if (parts[0] === "models" && parts[1]) {
    if (parts[2] === "browser") return "Browser Training";
    if (parts[2] === "gpu") return "BYO GPU Training";
    if (parts[2] === "import") return "Import Model";
    if (parts[2] === "export") return "Export Model";
    return MODEL_NAMES[parts[1]] ?? parts[1];
  }
  return null;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const pageName = getPageName(pathname);
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 bg-white">
      <div className="mx-auto max-w-5xl px-5 h-12 flex items-center justify-between">
        {/* Left: brand or back */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => router.push("/")}
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
              aria-label="Home"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                <path d="M8.5 2l-4 4.5 4 4.5" />
              </svg>
            </button>
          )}
          {pageName ? (
            <div className="flex items-center gap-2.5">
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

        {/* Right: model selector link */}
        {!isHome && (
          <button
            onClick={() => router.push("/")}
            className="text-[11px] text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
          >
            All models
          </button>
        )}
      </div>
    </nav>
  );
}
