"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  Theme,
  Mode,
  DEFAULT_THEME,
  DEFAULT_MODE,
  THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  isValidTheme,
  isValidMode,
  themes,
  modes,
} from "./themes";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  resolvedMode: "light" | "dark";
  themes: typeof themes;
  modes: typeof modes;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider with two-dimensional theme system.
 * 
 * Features:
 * - Theme: Color palette (default, future: ocean, forest, etc.)
 * - Mode: Brightness (light, dark, system)
 * - System mode follows OS preference in real-time
 * - Persists both theme and mode in localStorage
 * - Applies data-theme and data-mode attributes to <html>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mode, setModeState] = useState<Mode>(DEFAULT_MODE);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemMode = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Resolve mode (light/dark/system -> light/dark)
  const resolveMode = (userMode: Mode): "light" | "dark" => {
    if (userMode === "system") {
      return getSystemMode();
    }
    return userMode;
  };

  // Apply theme and mode to HTML element
  const applyThemeAndMode = (themeValue: Theme, resolvedModeValue: "light" | "dark") => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", themeValue);
      document.documentElement.setAttribute("data-mode", resolvedModeValue);
    }
  };

  // Load theme and mode from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY);

      if (savedTheme && isValidTheme(savedTheme)) {
        setThemeState(savedTheme);
      } else {
        setThemeState(DEFAULT_THEME);
      }

      if (savedMode && isValidMode(savedMode)) {
        setModeState(savedMode);
      } else {
        setModeState(DEFAULT_MODE);
      }
    } catch (error) {
      console.error("Failed to load theme/mode from localStorage:", error);
      setThemeState(DEFAULT_THEME);
      setModeState(DEFAULT_MODE);
    }
    setMounted(true);
  }, []);

  // Update resolved mode and apply attributes when mode or theme changes
  useEffect(() => {
    if (!mounted) return;

    const resolved = resolveMode(mode);
    setResolvedMode(resolved);
    applyThemeAndMode(theme, resolved);

    // Persist user preferences (not resolved values)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme/mode to localStorage:", error);
    }
  }, [theme, mode, mounted]);

  // Listen for OS preference changes when mode is "system"
  useEffect(() => {
    if (!mounted || mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? "dark" : "light";
      setResolvedMode(newResolved);
      applyThemeAndMode(theme, newResolved);
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
  }, [theme, mode, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        mode,
        setMode,
        resolvedMode,
        themes,
        modes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
