/**
 * Barrel export for theme system.
 * 
 * Single entry point for importing theme components and hooks.
 * 
 * @example
 * ```tsx
 * import { ThemeProvider, ThemeSelector, ModeSwitcher, useTheme } from '@/components/theme';
 * ```
 */

export { ThemeProvider } from "./ThemeProvider";
export { ThemeSelector } from "./ThemeSelector";
export { ModeSwitcher } from "./ModeSwitcher";
export { useTheme } from "./useTheme";
export {
  themes,
  modes,
  DEFAULT_THEME,
  DEFAULT_MODE,
  THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  getThemeById,
  getModeById,
  isValidTheme,
  isValidMode,
} from "./themes";
export type { Theme, Mode, ThemeConfig, ModeConfig } from "./themes";
export { themeScript } from "./theme-script";
