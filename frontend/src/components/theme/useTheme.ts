"use client";

import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import type { Theme, Mode } from "./themes";

/**
 * Hook for accessing theme and mode state and controls.
 * 
 * @returns {Object} Theme context with:
 * - theme: Current theme (default, future: ocean, forest, etc.)
 * - setTheme: Function to update theme
 * - mode: User mode preference (light/dark/system)
 * - setMode: Function to update mode
 * - resolvedMode: Actual applied mode (light or dark)
 * - themes: Available themes array
 * - modes: Available modes array
 * 
 * @example
 * ```tsx
 * const { theme, setTheme, mode, setMode, resolvedMode } = useTheme();
 * 
 * // Set theme
 * setTheme('default');
 * 
 * // Set mode
 * setMode('dark');
 * 
 * // Check if currently dark (regardless of system preference)
 * if (resolvedMode === 'dark') {
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
