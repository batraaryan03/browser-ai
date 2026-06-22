import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "browser ai — AI that runs on your machine",
  description:
    "Run AI models entirely in your browser. No servers, no API keys, no data leaving your device. Fine-tune personalities, classify images, detect objects, and more — all locally.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-[var(--bg)] text-[var(--fg)] antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "13px",
                fontFamily: "Bricolage Grotesque, sans-serif",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
