# Portable Theme System Refactor

## Overview
Refactor the current binary theme toggle into a portable, extensible theme system with system preference detection.

## Decisions

### 1. System Preference Detection
- **Decision**: Yes - Add "System" as third option
- **Options**: Light / Dark / System
- **Behavior**:
  - "System" follows OS preference via `prefers-color-scheme` media query
  - Listens for OS changes in real-time (e.g., macOS auto dark mode at sunset)
  - Falls back to "light" if detection fails

### 2. CSS Approach (Class-based)
- **Decision**: Keep class-based using `data-theme` attribute
- **Why**: Native Tailwind support with `dark:` prefix
- **How it works**:
  - `<html data-theme="light">` or `<html data-theme="dark">`
  - Tailwind config: `darkMode: ['class', '[data-theme="dark"]']`
  - Use in components: `className="bg-white dark:bg-gray-900"`
- **Benefits**:
  - Works with existing Tailwind classes
  - No CSS variable setup needed
  - Easy to understand and maintain

### 3. Export Structure (Barrel Export)
- **Decision**: Single barrel export from `theme/` folder
- **Import pattern**: `import { ThemeProvider, ThemeSwitcher, useTheme } from "@/components/theme"`
- **Why**:
  - One import for everything theme-related
  - Easy to copy entire folder to other projects
  - Clean dependency management
- **File structure**:
  ```
  theme/
  ├── index.ts          # Single entry point - exports all
  ├── ThemeProvider.tsx
  ├── ThemeSwitcher.tsx
  ├── useTheme.ts
  ├── themes.ts
  └── README.md
  ```

## Architecture

```
frontend/src/components/theme/
├── index.ts              # Barrel export
├── ThemeProvider.tsx     # Context provider (enhanced)
├── ThemeSwitcher.tsx     # UI component (replaces ThemeToggle)
├── useTheme.ts           # Hook for theme management
├── themes.ts             # Theme registry and types
└── README.md             # Usage documentation
```

## Implementation

### 1. Create Theme Registry (`themes.ts`)

```typescript
export type ThemeOption = "light" | "dark" | "system";

export interface ThemeConfig {
  id: ThemeOption;
  label: string;
  icon?: string; // lucide icon name
}

export const themes: ThemeConfig[] = [
  { id: "light", label: "Light", icon: "Sun" },
  { id: "dark", label: "Dark", icon: "Moon" },
  { id: "system", label: "System", icon: "Monitor" },
];

export const DEFAULT_THEME: ThemeOption = "system";
export const STORAGE_KEY = "theme-preference";
```

**Note on registry scope:**
- Registry contains **metadata only** (id, label, icon)
- No CSS variable mappings - we use Tailwind's class-based approach
- CSS is handled by Tailwind's `dark:` variants, not in registry

### 2. Create useTheme Hook (`useTheme.ts`)

**Hook API (clarified):**
```typescript
interface UseThemeReturn {
  theme: ThemeOption;              // Current user preference (light/dark/system)
  setTheme: (theme: ThemeOption) => void;  // Update preference
  resolvedTheme: "light" | "dark"; // Actual applied theme
  themes: ThemeConfig[];           // Available theme options
}
```

- `theme` = current preference (no separate `getTheme` or `currentTheme`)
- `resolvedTheme` = what's actually applied (useful when theme="system")
- `themes` = available options for building UI

```typescript
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

### 3. Update ThemeProvider (`ThemeProvider.tsx`)

- Store user preference (light/dark/system) in localStorage
- Listen to `prefers-color-scheme` media query when "system" selected
- Apply resolved theme (light or dark) to `data-theme` attribute
- Expose: `{ theme, setTheme, resolvedTheme }`
  - `theme`: User's preference (light/dark/system)
  - `setTheme`: Function to update preference
  - `resolvedTheme`: Actual applied theme (light or dark)

```typescript
interface ThemeContextValue {
  theme: ThemeOption;           // User preference
  setTheme: (theme: ThemeOption) => void;
  resolvedTheme: "light" | "dark";  // Actual applied theme
}
```

**System preference detection logic:**
```typescript
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

// Listen for system preference changes
useEffect(() => {
  if (theme !== "system") return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => setResolvedTheme(getSystemTheme());

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}, [theme]);
```

### 4. Create ThemeSwitcher Component (`ThemeSwitcher.tsx`)

- Display three options: Light, Dark, System
- Use icons (Sun, Moon, Monitor from lucide-react)
- Highlight current selection
- Call `setTheme()` on selection

**UI choice: Icon buttons vs dropdown**
- **Decision**: Use icon buttons (not `<select>` dropdown)
- **Why**:
  - Matches existing app UI pattern (icon buttons throughout)
  - Better visual feedback (see all options at once)
  - More accessible than custom dropdowns
  - Native `<select>` looks inconsistent across browsers/OS

```typescript
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./useTheme";
import { themes } from "./themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const icons = { Sun, Moon, Monitor };

  return (
    <div className="flex gap-1">
      {themes.map((t) => {
        const Icon = icons[t.icon as keyof typeof icons];
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`p-1.5 rounded transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-accent"
            }`}
            title={t.label}
            aria-pressed={isActive}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
```

### 5. Create Barrel Export (`index.ts`)

```typescript
export { ThemeProvider } from "./ThemeProvider";
export { ThemeSwitcher } from "./ThemeSwitcher";
export { useTheme } from "./useTheme";
export { themes, type ThemeOption, type ThemeConfig } from "./themes";
```

### 6. Update Settings Page

Replace ThemeToggle import with ThemeSwitcher:
```typescript
// Before
import { ThemeToggle } from "@/components/ThemeToggle";

// After
import { ThemeSwitcher } from "@/components/theme";
```

### 7. Update Root Layout

Move ThemeProvider import:
```typescript
// Before
import { ThemeProvider } from "@/components/ThemeProvider";

// After
import { ThemeProvider } from "@/components/theme";
```

### 8. Delete Old Files

- `frontend/src/components/ThemeToggle.tsx`
- `frontend/src/components/ThemeProvider.tsx` (moved to theme/)

## Testing Checklist

- [ ] Light theme applies correctly
- [ ] Dark theme applies correctly
- [ ] System option follows OS preference
- [ ] Changing OS preference updates theme in real-time (when System selected)
- [ ] Preference persists after page reload
- [ ] No flash of wrong theme on load
- [ ] ThemeSwitcher shows correct active state

## Portability

To use in another project:

### 1. Copy Files
Copy `frontend/src/components/theme/` folder to your project

### 2. Configure Tailwind
In `tailwind.config.js`:
```javascript
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  // ... rest of config
}
```

### 3. Setup Provider
In your root layout/app:
```tsx
import { ThemeProvider } from "@/components/theme";

export default function App({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
```

### 4. Use Components
```tsx
import { ThemeSwitcher, useTheme } from "@/components/theme";

// Option A: Use the component
<ThemeSwitcher />

// Option B: Use the hook for custom UI
const { theme, setTheme, resolvedTheme } = useTheme();
```

### 5. Adding a New Theme (Future)
To add a new theme (e.g., "sepia"):
1. Add to `themes.ts`:
   ```typescript
   { id: "sepia", label: "Sepia", icon: "Coffee" }
   ```
2. Update `ThemeOption` type
3. Add CSS in Tailwind or globals.css:
   ```css
   [data-theme="sepia"] {
     /* custom styles or override variables */
   }
   ```

### Dependencies
- `lucide-react` for icons (Sun, Moon, Monitor)
- Tailwind CSS with dark mode configured
