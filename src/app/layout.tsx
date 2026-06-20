import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF to Summary",
  description: "AI-powered PDF summarization — entirely in your browser. No uploads, no servers, no API keys.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
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
                border: "0",
                borderRadius: "0",
                fontSize: "13px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
