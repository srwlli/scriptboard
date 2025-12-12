"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./useTheme";
import { modes } from "./themes";
import type { Mode } from "./themes";

/**
 * Mode switcher component with icon buttons.
 * 
 * Displays three icon buttons: Sun (Light), Moon (Dark), Monitor (System).
 * Shows active state with aria-pressed for accessibility.
 */
export function ModeSwitcher() {
  const { mode, setMode } = useTheme();

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Sun":
        return <Sun size={18} />;
      case "Moon":
        return <Moon size={18} />;
      case "Monitor":
        return <Monitor size={18} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-1">
      {modes.map((modeOption) => {
        const isActive = mode === modeOption.id;
        return (
          <button
            key={modeOption.id}
            onClick={() => handleModeChange(modeOption.id)}
            className={`px-3 py-2 rounded-md border transition-colors ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-accent text-foreground"
            }`}
            aria-label={`Switch to ${modeOption.label} mode`}
            aria-pressed={isActive}
            title={modeOption.label}
          >
            {getIcon(modeOption.icon)}
          </button>
        );
      })}
    </div>
  );
}

