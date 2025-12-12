/**
 * Theme registry - centralized theme and mode configuration.
 * 
 * Two-dimensional system:
 * - Theme: Color palette (default, future: ocean, forest, etc.)
 * - Mode: Brightness (light, dark, system)
 * 
 * Contains metadata only (id, name, description, icon) - no CSS variables.
 * CSS is handled by nested selectors in globals.css.
 */

export type Theme = "default";

export type Mode = "light" | "dark" | "system";

export interface ThemeConfig {
  id: Theme;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface ModeConfig {
  id: Mode;
  label: string;
  icon: "Sun" | "Moon" | "Monitor";
}

/**
 * Available themes for the application.
 * Currently only Default theme, ready for future themes.
 */
export const themes: ThemeConfig[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean and minimal",
    icon: "Palette",
  },
];

/**
 * Available mode options (light/dark/system).
 */
export const modes: ModeConfig[] = [
  {
    id: "light",
    label: "Light",
    icon: "Sun",
  },
  {
    id: "dark",
    label: "Dark",
    icon: "Moon",
  },
  {
    id: "system",
    label: "System",
    icon: "Monitor",
  },
];

/**
 * Default theme when no preference is stored.
 */
export const DEFAULT_THEME: Theme = "default";

/**
 * Default mode when no preference is stored.
 */
export const DEFAULT_MODE: Mode = "system";

/**
 * localStorage key for storing theme preference.
 */
export const THEME_STORAGE_KEY = "app-theme";

/**
 * localStorage key for storing mode preference.
 */
export const MODE_STORAGE_KEY = "app-mode";

/**
 * Get theme configuration by ID.
 */
export function getThemeById(id: Theme): ThemeConfig | undefined {
  return themes.find((theme) => theme.id === id);
}

/**
 * Get mode configuration by ID.
 */
export function getModeById(id: Mode): ModeConfig | undefined {
  return modes.find((mode) => mode.id === id);
}

/**
 * Check if a theme ID is valid.
 */
export function isValidTheme(id: string): id is Theme {
  return themes.some((theme) => theme.id === id);
}

/**
 * Check if a mode ID is valid.
 */
export function isValidMode(id: string): id is Mode {
  return modes.some((mode) => mode.id === id);
}
