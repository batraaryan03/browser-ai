"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  onInfoClick?: () => void;
  showBack?: boolean;
}

export function Navbar({ onInfoClick, showBack }: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 bg-white">
      <div className="mx-auto max-w-5xl px-5 h-12 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium tracking-tight hover:opacity-60 transition-opacity"
        >
          pdf to summary
        </button>

        <div className="flex items-center gap-1">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
              title="Back"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                <path d="M8.5 2l-4 4.5 4 4.5" />
              </svg>
            </button>
          )}
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-black transition-colors"
              title="About"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square">
                <circle cx="6.5" cy="6.5" r="5" />
                <path d="M6.5 5v3M6.5 10v.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
