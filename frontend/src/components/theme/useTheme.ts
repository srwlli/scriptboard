"use client";

import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import type { ThemeOption } from "./themes";

/**
 * Hook for accessing theme state and controls.
 * 
 * @returns {Object} Theme context with:
 * - theme: Current user preference (light/dark/system)
 * - setTheme: Function to update preference
 * - resolvedTheme: Actual applied theme (light or dark)
 * - themes: Available theme options array
 * 
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useTheme();
 * 
 * // Set theme
 * setTheme('dark');
 * 
 * // Check if currently dark (regardless of system preference)
 * if (resolvedTheme === 'dark') {
 *   // Apply dark-specific styles
 * }
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}

