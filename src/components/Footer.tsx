export function Footer() {
  return (
    <footer className="relative w-full max-w-5xl mx-auto mt-28 overflow-hidden">
      <div className="footer-art" />
      <div className="relative z-10 px-5 py-8">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} browser ai.</span>
          <p>
            All models run entirely in-browser. No servers, no API keys, no tracking.
          </p>
        </div>
      </div>
    </footer>
  );
}
