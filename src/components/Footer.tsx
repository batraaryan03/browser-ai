import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-light)] mt-auto">
      <div className="px-6 sm:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Platform</p>
            <div className="flex flex-col gap-2">
              <Link href="/models/summarize" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Summarize</Link>
              <Link href="/models/classify" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Image Classifier</Link>
              <Link href="/models/detect" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Object Detection</Link>
              <Link href="/models/remove-bg" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Background Removal</Link>
              <Link href="/models/segment" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Segmentation</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Training</p>
            <div className="flex flex-col gap-2">
              <Link href="/models/train" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Model Training</Link>
              <Link href="/models/train/browser" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Browser Training</Link>
              <Link href="/models/train/gpu" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">BYO GPU</Link>
              <Link href="/models/train/import" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Import Personality</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">Resources</p>
            <div className="flex flex-col gap-2">
              <Link href="/docs" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Documentation</Link>
              <Link href="/models/chat" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Personality Chat</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">About</p>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/batraaryan03/browser-ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-40">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Source Code
              </a>
              <Link href="/" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Home</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-10 pt-8 border-t border-[var(--border-light)]">
          <p className="text-sm text-[var(--fg-subtle)]">&copy; {new Date().getFullYear()} browser ai.</p>
          <p className="text-sm text-[var(--fg-subtle)]">All models run entirely in-browser. No servers, no limits.</p>
        </div>
      </div>
    </footer>
  );
}
