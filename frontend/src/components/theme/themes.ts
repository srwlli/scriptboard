/**
 * Theme registry - centralized theme configuration.
 * 
 * Contains metadata only (id, label, icon) - no CSS variables.
 * CSS is handled by Tailwind dark: variants in globals.css.
 */

export type ThemeOption = "light" | "dark" | "system";

export interface ThemeConfig {
  id: ThemeOption;
  label: string;
  icon: "Sun" | "Moon" | "Monitor";
}

/**
 * Available theme options for the application.
 */
export const themes: ThemeConfig[] = [
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
export const DEFAULT_THEME: ThemeOption = "light";

/**
 * localStorage key for storing theme preference.
 */
export const STORAGE_KEY = "theme";

/**
 * Get theme configuration by ID.
 */
export function getThemeById(id: ThemeOption): ThemeConfig | undefined {
  return themes.find((theme) => theme.id === id);
}

/**
 * Check if a theme ID is valid.
 */
export function isValidTheme(id: string): id is ThemeOption {
  return themes.some((theme) => theme.id === id);
}

