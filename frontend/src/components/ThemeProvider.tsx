"use client";

import { useEffect } from "react";

/**
 * Theme provider that syncs theme from localStorage to HTML attribute on mount.
 * This ensures the theme is applied before React hydrates.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  return <>{children}</>;
}

