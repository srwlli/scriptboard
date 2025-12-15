/**
 * Theme registry - centralized theme and mode configuration.
 *
 * Two-dimensional system:
 * - Theme: Color palette (default + 35 LLM-branded themes)
 * - Mode: Brightness (light, dark, system)
 *
 * Contains metadata only (id, name, description, icon, brand) - no CSS variables.
 * CSS is handled by nested selectors in globals.css.
 */

export type Theme =
  | "default"
  // Claude themes
  | "claude-modern-minimal"
  | "claude-modern-tech"
  | "claude-warm-organic"
  | "claude-cool-professional"
  | "claude-gridiron"
  // GPT-5.1 Thinking themes
  | "gpt-5-1-thinking-modern-minimal"
  | "gpt-5-1-thinking-modern-tech"
  | "gpt-5-1-thinking-warm-organic"
  | "gpt-5-1-thinking-cool-professional"
  | "gpt-5-1-thinking-noir-focus"
  // Gemini themes
  | "gemini-modern-minimal"
  | "gemini-modern-tech"
  | "gemini-warm-organic"
  | "gemini-cool-professional"
  | "gemini-nebula-dream"
  // DeepSeek themes
  | "deepseek-modern-minimal"
  | "deepseek-modern-tech"
  | "deepseek-warm-organic"
  | "deepseek-cool-professional"
  | "deepseek-neon-noir"
  // Le Chat themes
  | "lechat-modern-minimal"
  | "lechat-modern-tech"
  | "lechat-warm-organic"
  | "lechat-cool-professional"
  | "lechat-midnight-aurora"
  // GPT-4.1 Mini themes
  | "gpt4.1-mini-modern-minimal"
  | "gpt4.1-mini-modern-tech"
  | "gpt4.1-mini-warm-organic"
  | "gpt4.1-mini-cool-professional"
  | "gpt4.1-mini-neon-lab"
  // Grok themes
  | "grok-modern-minimal"
  | "grok-modern-tech"
  | "grok-warm-organic"
  | "grok-cool-professional"
  | "grok-cosmic-gradient";

export type Mode = "light" | "dark" | "system";

export type Brand = "default" | "claude" | "gpt-5.1" | "gemini" | "deepseek" | "lechat" | "gpt-4.1-mini" | "grok";

export interface ThemeConfig {
  id: Theme;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  brand: Brand;
}

export interface ModeConfig {
  id: Mode;
  label: string;
  icon: "Sun" | "Moon" | "Monitor";
}

/**
 * Available themes for the application.
 * Organized by brand: Default + 7 LLM brands × 5 variations each = 36 themes.
 */
export const themes: ThemeConfig[] = [
  // Default
  { id: "default", name: "Default", description: "Clean and minimal", icon: "Palette", brand: "default" },

  // Claude (Anthropic)
  { id: "claude-modern-minimal", name: "Modern Minimal", description: "Clean, understated elegance", icon: "Sparkles", brand: "claude" },
  { id: "claude-modern-tech", name: "Modern Tech", description: "Bold cyan accents, futuristic", icon: "Sparkles", brand: "claude" },
  { id: "claude-warm-organic", name: "Warm Organic", description: "Natural earthy tones, sage green", icon: "Sparkles", brand: "claude" },
  { id: "claude-cool-professional", name: "Cool Professional", description: "Calming slate blue, business", icon: "Sparkles", brand: "claude" },
  { id: "claude-gridiron", name: "Gridiron", description: "Football field inspired, turf green", icon: "Sparkles", brand: "claude" },

  // GPT-5.1 Thinking (OpenAI)
  { id: "gpt-5-1-thinking-modern-minimal", name: "Modern Minimal", description: "Clean with blue accents", icon: "Brain", brand: "gpt-5.1" },
  { id: "gpt-5-1-thinking-modern-tech", name: "Modern Tech", description: "Cyan and violet accents", icon: "Brain", brand: "gpt-5.1" },
  { id: "gpt-5-1-thinking-warm-organic", name: "Warm Organic", description: "Orange and green organic tones", icon: "Brain", brand: "gpt-5.1" },
  { id: "gpt-5-1-thinking-cool-professional", name: "Cool Professional", description: "Teal and blue professional", icon: "Brain", brand: "gpt-5.1" },
  { id: "gpt-5-1-thinking-noir-focus", name: "Noir Focus", description: "Purple and pink dramatic", icon: "Brain", brand: "gpt-5.1" },

  // Gemini (Google)
  { id: "gemini-modern-minimal", name: "Modern Minimal", description: "Stark contrast, understated", icon: "Bot", brand: "gemini" },
  { id: "gemini-modern-tech", name: "Modern Tech", description: "Electric blue/violet accents", icon: "Bot", brand: "gemini" },
  { id: "gemini-warm-organic", name: "Warm Organic", description: "Sage, terracotta, sand", icon: "Bot", brand: "gemini" },
  { id: "gemini-cool-professional", name: "Cool Professional", description: "Trustworthy blues, teals", icon: "Bot", brand: "gemini" },
  { id: "gemini-nebula-dream", name: "Nebula Dream", description: "Deep indigo, soft pinks", icon: "Bot", brand: "gemini" },

  // DeepSeek
  { id: "deepseek-modern-minimal", name: "Modern Minimal", description: "Pure grayscale minimal", icon: "Zap", brand: "deepseek" },
  { id: "deepseek-modern-tech", name: "Modern Tech", description: "High contrast tech", icon: "Zap", brand: "deepseek" },
  { id: "deepseek-warm-organic", name: "Warm Organic", description: "Warm earth tones", icon: "Zap", brand: "deepseek" },
  { id: "deepseek-cool-professional", name: "Cool Professional", description: "Cool blue professional", icon: "Zap", brand: "deepseek" },
  { id: "deepseek-neon-noir", name: "Neon Noir", description: "Neon pink, cyan, purple", icon: "Zap", brand: "deepseek" },

  // Le Chat (Mistral)
  { id: "lechat-modern-minimal", name: "Modern Minimal", description: "Pure grayscale elegance", icon: "MessageSquare", brand: "lechat" },
  { id: "lechat-modern-tech", name: "Modern Tech", description: "Bold blue tech accents", icon: "MessageSquare", brand: "lechat" },
  { id: "lechat-warm-organic", name: "Warm Organic", description: "Golden warm tones", icon: "MessageSquare", brand: "lechat" },
  { id: "lechat-cool-professional", name: "Cool Professional", description: "Calming teal professional", icon: "MessageSquare", brand: "lechat" },
  { id: "lechat-midnight-aurora", name: "Midnight Aurora", description: "Purple aurora glow", icon: "MessageSquare", brand: "lechat" },

  // GPT-4.1 Mini (OpenAI)
  { id: "gpt4.1-mini-modern-minimal", name: "Modern Minimal", description: "Clean blue minimal", icon: "Cpu", brand: "gpt-4.1-mini" },
  { id: "gpt4.1-mini-modern-tech", name: "Modern Tech", description: "Green and purple neon", icon: "Cpu", brand: "gpt-4.1-mini" },
  { id: "gpt4.1-mini-warm-organic", name: "Warm Organic", description: "Orange and sage organic", icon: "Cpu", brand: "gpt-4.1-mini" },
  { id: "gpt4.1-mini-cool-professional", name: "Cool Professional", description: "Blue and teal business", icon: "Cpu", brand: "gpt-4.1-mini" },
  { id: "gpt4.1-mini-neon-lab", name: "Neon Lab", description: "Purple and cyan neon", icon: "Cpu", brand: "gpt-4.1-mini" },

  // Grok (xAI)
  { id: "grok-modern-minimal", name: "Modern Minimal", description: "Subtle gray minimal", icon: "Rocket", brand: "grok" },
  { id: "grok-modern-tech", name: "Modern Tech", description: "Purple tech accents", icon: "Rocket", brand: "grok" },
  { id: "grok-warm-organic", name: "Warm Organic", description: "Orange earth tones", icon: "Rocket", brand: "grok" },
  { id: "grok-cool-professional", name: "Cool Professional", description: "Teal professional", icon: "Rocket", brand: "grok" },
  { id: "grok-cosmic-gradient", name: "Cosmic Gradient", description: "Purple and pink cosmic", icon: "Rocket", brand: "grok" },
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
