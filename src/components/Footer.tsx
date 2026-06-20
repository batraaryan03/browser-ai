export function Footer() {
  return (
    <footer className="relative w-full max-w-5xl mx-auto mt-28 overflow-hidden rounded-3xl">
      {/* Decorative bottom art */}
      <div className="footer-art" />

      <div className="relative z-10 border-t border-black/[0.04] px-5 py-8">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} pdf to summary.</span>
          <p>
            Operates entirely in-browser via ONNX Runtime Web.
          </p>
        </div>
      </div>
    </footer>
  );
}
