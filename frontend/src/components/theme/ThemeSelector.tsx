"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useTheme } from "./useTheme";
import { ModeSwitcher } from "./ModeSwitcher";
import type { Theme, Brand, ThemeConfig } from "./themes";

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Brand display names for section headers */
const brandDisplayNames: Record<Brand, string> = {
  default: "Default",
  claude: "Claude",
  "gpt-5.1": "GPT-5.1 Thinking",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  lechat: "Le Chat",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  grok: "Grok",
};

/** Brand order for consistent display */
const brandOrder: Brand[] = [
  "default",
  "claude",
  "gpt-5.1",
  "gemini",
  "deepseek",
  "lechat",
  "gpt-4.1-mini",
  "grok",
];

/**
 * ThemeSwatch - Renders color swatches scoped to a specific theme.
 *
 * By wrapping swatches in a container with data-theme and data-mode attributes,
 * CSS variables resolve to that theme's colors (not the currently previewed theme).
 * This allows each theme card to show its own actual colors.
 */
function ThemeSwatch({ themeId, mode }: { themeId: Theme; mode: "light" | "dark" }) {
  return (
    <div data-theme={themeId} data-mode={mode} className="flex gap-1">
      <div
        className="w-6 h-6 rounded border border-black/10"
        style={{ backgroundColor: `hsl(var(--background))` }}
        title="Background"
      />
      <div
        className="w-6 h-6 rounded border border-black/10"
        style={{ backgroundColor: `hsl(var(--foreground))` }}
        title="Foreground"
      />
      <div
        className="w-6 h-6 rounded border border-black/10"
        style={{ backgroundColor: `hsl(var(--primary))` }}
        title="Primary"
      />
      <div
        className="w-6 h-6 rounded border border-black/10"
        style={{ backgroundColor: `hsl(var(--accent))` }}
        title="Accent"
      />
    </div>
  );
}

/**
 * Theme selector modal component.
 *
 * Features:
 * - Live preview: Clicking a theme immediately applies it to the full UI
 * - Modal overlay with backdrop click to close
 * - Escape key to close
 * - Theme cards grouped by brand (8 brands: Default + 7 LLMs)
 * - Brand section headers with theme count
 * - Color swatches preview for each theme
 * - ModeSwitcher in header for mode preview
 * - Apply: Persists selection to localStorage
 * - Cancel: Reverts to original theme
 */
export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { themes, theme, setTheme, mode, resolvedMode } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<Theme>(theme);

  // Use resolvedMode for swatches (resolves "system" to actual light/dark)
  const swatchMode = resolvedMode === "dark" ? "dark" : "light";

  // Group themes by brand for organized display
  const groupedThemes = useMemo(() => {
    const groups: Record<Brand, ThemeConfig[]> = {
      default: [],
      claude: [],
      "gpt-5.1": [],
      gemini: [],
      deepseek: [],
      lechat: [],
      "gpt-4.1-mini": [],
      grok: [],
    };

    themes.forEach((themeConfig) => {
      if (groups[themeConfig.brand]) {
        groups[themeConfig.brand].push(themeConfig);
      }
    });

    return groups;
  }, [themes]);

  // Initialize previewTheme to current theme when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewTheme(theme);
    }
  }, [isOpen, theme]);

  // Live preview: Temporarily apply previewTheme to document while modal is open.
  // This lets the user see the actual theme applied to the full UI in real-time.
  // On Apply: setTheme() persists the selection.
  // On Cancel: we revert by setting previewTheme back to original theme.
  useEffect(() => {
    if (!isOpen) return;

    // Apply preview theme to document for live preview
    document.documentElement.setAttribute("data-theme", previewTheme);

    // Cleanup: revert to persisted theme if modal closes without applying
    return () => {
      document.documentElement.setAttribute("data-theme", theme);
    };
  }, [isOpen, previewTheme, theme]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleApply = () => {
    setTheme(previewTheme);
    onClose();
  };

  const handleCancel = () => {
    setPreviewTheme(theme); // Reset preview to current theme
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Select theme"
    >
      <div
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Select Theme</h2>
          <div className="flex items-center gap-3">
            <ModeSwitcher />
            <button
              onClick={handleCancel}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              aria-label="Close theme selector"
            >
              <X size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Modal Body - Theme Cards Grouped by Brand */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {brandOrder.map((brand) => {
              const brandThemes = groupedThemes[brand];
              if (brandThemes.length === 0) return null;

              return (
                <div key={brand}>
                  {/* Brand Section Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {brandDisplayNames[brand]}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {brandThemes.length} {brandThemes.length === 1 ? "theme" : "themes"}
                    </span>
                  </div>

                  {/* Theme Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {brandThemes.map((themeOption) => {
                      const isSelected = previewTheme === themeOption.id;
                      const isCurrent = theme === themeOption.id;

                      return (
                        <button
                          key={themeOption.id}
                          onClick={() => setPreviewTheme(themeOption.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background hover:border-accent-foreground/20 hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground text-sm">{themeOption.name}</h4>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{themeOption.description}</p>

                          {/* Color Swatches - scoped to this theme's actual colors */}
                          <ThemeSwatch themeId={themeOption.id} mode={swatchMode} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer - Apply/Cancel Buttons */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

