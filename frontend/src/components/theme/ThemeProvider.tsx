"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ThemeOption, DEFAULT_THEME, STORAGE_KEY, isValidTheme, themes } from "./themes";

interface ThemeContextType {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  resolvedTheme: "light" | "dark";
  themes: typeof import("./themes").themes;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider with system preference detection.
 * 
 * Features:
 * - Supports light, dark, and system (OS preference) themes
 * - Listens for OS preference changes in real-time
 * - Persists user preference in localStorage
 * - Prevents flash of wrong theme on load
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Resolve theme (light/dark/system -> light/dark)
  const resolveTheme = (userTheme: ThemeOption): "light" | "dark" => {
    if (userTheme === "system") {
      return getSystemTheme();
    }
    return userTheme;
  };

  // Apply theme to HTML element
  const applyTheme = (resolved: "light" | "dark") => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolved);
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isValidTheme(saved)) {
        setThemeState(saved);
      } else {
        setThemeState(DEFAULT_THEME);
      }
    } catch (error) {
      console.error("Failed to load theme from localStorage:", error);
      setThemeState(DEFAULT_THEME);
    }
    setMounted(true);
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Persist user preference (not resolved theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.error("Failed to save theme to localStorage:", error);
    }
  }, [theme, mounted]);

  // Listen for OS preference changes when theme is "system"
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      applyTheme(newResolved);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } 
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeOption) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

