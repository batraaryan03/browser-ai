"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  onInfoClick?: () => void;
  showBack?: boolean;
}

export function Navbar({ onInfoClick, showBack }: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="mx-auto max-w-5xl px-5 h-12 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium tracking-tight hover:opacity-60 transition-opacity"
        >
          pdf to summary
        </button>

        <div className="flex items-center gap-1">
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all"
              title="About"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="5" />
                <path d="M6.5 5v3M6.5 9.5v.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
