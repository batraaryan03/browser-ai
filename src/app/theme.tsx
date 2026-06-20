"use client";

import { createContext, useContext } from "react";

const ThemeCtx = createContext<{ resolved: "light" }>({ resolved: "light" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeCtx value={{ resolved: "light" }}>
      {children}
    </ThemeCtx>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
