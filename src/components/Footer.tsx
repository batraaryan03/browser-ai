import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative w-full max-w-5xl mx-auto mt-auto overflow-hidden">
      <div className="footer-art" />
      <div className="relative z-10 px-5 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Models</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/models/summarize" className="text-[11px] text-gray-400 hover:text-black transition-colors">Summarize</Link>
              <Link href="/models/classify" className="text-[11px] text-gray-400 hover:text-black transition-colors">Image Classifier</Link>
              <Link href="/models/detect" className="text-[11px] text-gray-400 hover:text-black transition-colors">Object Detection</Link>
              <Link href="/models/remove-bg" className="text-[11px] text-gray-400 hover:text-black transition-colors">Background Removal</Link>
              <Link href="/models/segment" className="text-[11px] text-gray-400 hover:text-black transition-colors">Segmentation</Link>
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Training</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/models/train" className="text-[11px] text-gray-400 hover:text-black transition-colors">Model Training</Link>
              <Link href="/models/train/browser" className="text-[11px] text-gray-400 hover:text-black transition-colors">Browser Training</Link>
              <Link href="/models/train/gpu" className="text-[11px] text-gray-400 hover:text-black transition-colors">BYO GPU</Link>
              <Link href="/models/train/import" className="text-[11px] text-gray-400 hover:text-black transition-colors">Import Personality</Link>
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">About</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/docs" className="text-[11px] text-gray-400 hover:text-black transition-colors">Docs</Link>
              <a href="https://github.com/batraaryan03/browser-ai" target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-400 hover:text-black transition-colors">Source Code</a>
              <Link href="/" className="text-[11px] text-gray-400 hover:text-black transition-colors">Home</Link>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-4 border-t border-black/[0.04]">
          <span>&copy; {new Date().getFullYear()} browser ai.</span>
          <p>All models run entirely in-browser.</p>
        </div>
      </div>
    </footer>
  );
}
