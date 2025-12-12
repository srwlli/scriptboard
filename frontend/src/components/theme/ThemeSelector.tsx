"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "./useTheme";
import { ModeSwitcher } from "./ModeSwitcher";
import type { Theme } from "./themes";

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Theme selector modal component.
 * 
 * Features:
 * - Modal overlay with backdrop click to close
 * - Escape key to close
 * - Theme cards in grid layout
 * - Color swatches preview
 * - ModeSwitcher in header for live preview
 * - Apply/Cancel buttons
 */
export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { themes, theme, setTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<Theme>(theme);

  // Initialize previewTheme to current theme when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewTheme(theme);
    }
  }, [isOpen, theme]);

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

  // Get CSS variable values for color swatches
  const getColorSwatch = (colorVar: string) => {
    if (typeof window === "undefined") return "#000000";
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(colorVar).trim();
    if (value) {
      // Convert HSL to hex or return as-is if already hex
      return value;
    }
    return "#000000";
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

        {/* Modal Body - Theme Cards */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((themeOption) => {
              const isSelected = previewTheme === themeOption.id;
              const isCurrent = theme === themeOption.id;

              return (
                <button
                  key={themeOption.id}
                  onClick={() => setPreviewTheme(themeOption.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-accent-foreground/20 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-foreground">{themeOption.name}</h3>
                    {isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{themeOption.description}</p>

                  {/* Color Swatches */}
                  <div className="flex gap-1.5">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{
                        backgroundColor: `hsl(var(--background))`,
                      }}
                      title="Background"
                    />
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{
                        backgroundColor: `hsl(var(--foreground))`,
                      }}
                      title="Foreground"
                    />
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{
                        backgroundColor: `hsl(var(--primary))`,
                      }}
                      title="Primary"
                    />
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{
                        backgroundColor: `hsl(var(--accent))`,
                      }}
                      title="Accent"
                    />
                  </div>
                </button>
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

