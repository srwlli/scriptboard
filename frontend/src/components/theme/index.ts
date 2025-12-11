/**
 * Barrel export for theme system.
 * 
 * Single entry point for importing theme components and hooks.
 * 
 * @example
 * ```tsx
 * import { ThemeProvider, ThemeSwitcher, useTheme } from '@/components/theme';
 * ```
 */

export { ThemeProvider } from "./ThemeProvider";
export { ThemeSwitcher } from "./ThemeSwitcher";
export { useTheme } from "./useTheme";
export { themes, DEFAULT_THEME, STORAGE_KEY, getThemeById, isValidTheme } from "./themes";
export type { ThemeOption, ThemeConfig } from "./themes";
export { themeScript } from "./theme-script";

