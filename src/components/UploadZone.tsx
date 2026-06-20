"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onFile: (file: File) => void;
  onText: (text: string) => void;
  disabled: boolean;
  showDialog: boolean;
  pendingFileName: string | null;
  onDialogConfirm: () => void;
  onDialogCancel: () => void;
}

export function UploadZone({
  onFile,
  onText,
  disabled,
  showDialog,
  pendingFileName,
  onDialogConfirm,
  onDialogCancel,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && f.name.toLowerCase().endsWith(".pdf")) onFile(f);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        onFile(f);
        e.target.value = "";
      }
    },
    [onFile],
  );

  return (
    <>
      {/* ─── Drop zone ──────────────────────────────────────────────── */}
      <div className="w-full max-w-sm mx-auto">
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            relative py-14 text-center cursor-pointer select-none
            transition-all duration-300
            ${disabled ? "opacity-30 pointer-events-none" : ""}
            ${dragging ? "bg-black/[0.03]" : "hover:bg-black/[0.015]"}
          `}
        >
          {/* Upload icon — thin, minimal */}
          <div className="flex justify-center mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              stroke="black"
              strokeWidth="0.5"
              strokeLinecap="square"
              className={`transition-all duration-300 ${dragging ? "translate-y-1" : ""}`}
            >
              <path d="M16 4v16M8 12l8-8 8 8" />
              <path d="M4 20v6a2 2 0 002 2h20a2 2 0 002-2v-6" />
            </svg>
          </div>

          {/* Title */}
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black mb-3">
            Upload PDF
          </p>

          {/* Subtitle */}
          <p className="text-sm text-gray-400">
            drag a file or{" "}
            <span className="text-black underline underline-offset-4 decoration-from-font">
              browse
            </span>
          </p>

          {/* Tags */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-300 uppercase tracking-wider">
            <span>PDF only</span>
            <span className="w-px h-2.5 bg-gray-200" />
            <span>any size</span>
            <span className="w-px h-2.5 bg-gray-200" />
            <span>local AI</span>
            <span className="w-px h-2.5 bg-gray-200" />
            <span>private</span>
          </div>
        </div>

        {/* ─── Divider ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-black/[0.08]" />
          <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-400">or</span>
          <div className="flex-1 h-px bg-black/[0.08]" />
        </div>

        {/* ─── Paste area ──────────────────────────────────────────────── */}
        <div className="py-4">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-gray-300 mb-3">
            Paste text directly
          </p>
          <textarea
            placeholder="Paste any text — articles, book excerpts, notes..."
            rows={3}
            className="w-full resize-none bg-black/[0.02] px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:bg-black/[0.04] focus:outline-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                const target = e.currentTarget;
                const val = target.value.trim();
                if (val.length >= 50) {
                  onText(val);
                  target.value = "";
                }
              }
            }}
          />
          <p className="mt-2 text-[10px] text-gray-300">
            Press <span className="text-black underline underline-offset-2 decoration-from-font">Cmd+Enter</span> to summarize
          </p>
        </div>
      </div>

      {/* ─── Download confirmation dialog ─────────────────────────────── */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-sm bg-white p-8"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider">Download AI model?</h3>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                    This app uses a local AI model (T5-small, ~308 MB) that runs entirely in your browser. No data ever leaves your machine.
                  </p>
                </div>

                <div className="bg-black/[0.02] p-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-black uppercase tracking-wider">Why local?</p>
                    <ul className="space-y-1.5">
                      {[
                        "Unlimited usage — no API costs",
                        "100% private — nothing leaves your browser",
                        "Works offline after first download",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[11px] text-gray-400">
                          <span className="text-black shrink-0">—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {pendingFileName && (
                  <div className="flex items-center gap-2 bg-black/[0.02] px-3 py-2">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="square" className="shrink-0 text-gray-400">
                      <path d="M3 1h4l3 3v6a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" /><path d="M7 1v3h3" />
                    </svg>
                    <span className="text-xs text-gray-500 truncate">{pendingFileName}</span>
                  </div>
                )}

                <p className="text-[10px] text-gray-300 leading-relaxed">
                  Downloaded once, cached in your browser. Subsequent usage needs no download.
                </p>

                <div className="flex items-center justify-end gap-4 pt-2">
                  <button
                    onClick={onDialogCancel}
                    className="text-xs text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDialogConfirm}
                    className="bg-black text-white px-5 py-2 text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
                  >
                    Download ~308 MB
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
