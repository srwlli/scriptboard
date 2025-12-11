"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./useTheme";
import { themes } from "./themes";
import type { ThemeOption } from "./themes";

/**
 * Theme switcher component with icon buttons.
 * 
 * Displays three icon buttons: Sun (Light), Moon (Dark), Monitor (System).
 * Shows active state with aria-pressed for accessibility.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
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
      {themes.map((themeOption) => {
        const isActive = theme === themeOption.id;
        return (
          <button
            key={themeOption.id}
            onClick={() => handleThemeChange(themeOption.id)}
            className={`px-3 py-2 rounded-md border transition-colors ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-accent text-foreground"
            }`}
            aria-label={`Switch to ${themeOption.label} theme`}
            aria-pressed={isActive}
            title={themeOption.label}
          >
            {getIcon(themeOption.icon)}
          </button>
        );
      })}
    </div>
  );
}

