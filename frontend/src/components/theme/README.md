# Portable Theme System

A portable, extensible theme system for React applications with system preference detection.

## Features

- **Three theme options**: Light, Dark, and System (follows OS preference)
- **Real-time OS detection**: Automatically updates when OS theme changes
- **Flash prevention**: Inline script prevents flash of wrong theme on load
- **Portable**: Easy to copy to other projects
- **Type-safe**: Full TypeScript support
- **Accessible**: ARIA labels and keyboard navigation

## Installation

### In Current Project

The theme system is already set up. Import from:

```tsx
import { ThemeProvider, ThemeSwitcher, useTheme } from '@/components/theme';
```

### In Other Projects

1. **Copy the theme folder**:
   ```bash
   cp -r frontend/src/components/theme /path/to/other/project/src/components/
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install lucide-react
   ```

3. **Configure Tailwind** (`tailwind.config.ts`):
   ```ts
   export default {
     darkMode: ['class', '[data-theme="dark"]'],
     // ... rest of config
   };
   ```

4. **Add CSS variables** to your `globals.css`:
   ```css
   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 222.2 84% 4.9%;
       /* ... other variables */
     }
     
     [data-theme="dark"] {
       --background: 222.2 84% 4.9%;
       --foreground: 210 40% 98%;
       /* ... other variables */
     }
   }
   ```

5. **Wrap your app** with `ThemeProvider` in your root layout:
   ```tsx
   import { ThemeProvider, themeScript } from '@/components/theme';
   import Script from 'next/script';
   
   export default function RootLayout({ children }) {
     return (
       <html lang="en" suppressHydrationWarning>
         <head>
           <Script
             id="theme-script"
             strategy="beforeInteractive"
             dangerouslySetInnerHTML={{ __html: themeScript }}
           />
         </head>
         <body>
           <ThemeProvider>
             {children}
           </ThemeProvider>
         </body>
       </html>
     );
   }
   ```

## Usage

### Using the ThemeSwitcher Component

The simplest way to add theme switching to your app:

```tsx
import { ThemeSwitcher } from '@/components/theme';

export function SettingsPage() {
  return (
    <div>
      <h2>Appearance</h2>
      <ThemeSwitcher />
    </div>
  );
}
```

This renders three icon buttons: Sun (Light), Moon (Dark), and Monitor (System).

### Using the useTheme Hook

For custom theme controls:

```tsx
import { useTheme } from '@/components/theme';

export function CustomThemeControl() {
  const { theme, setTheme, resolvedTheme, themes } = useTheme();
  
  return (
    <div>
      <p>Current preference: {theme}</p>
      <p>Applied theme: {resolvedTheme}</p>
      
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Hook API

The `useTheme` hook returns:

- **`theme`**: Current user preference (`"light" | "dark" | "system"`)
- **`setTheme(theme)`**: Function to update user preference
- **`resolvedTheme`**: Actual applied theme (`"light" | "dark"`) - useful for conditional styling
- **`themes`**: Array of available theme configurations

### Example: Conditional Styling

```tsx
import { useTheme } from '@/components/theme';

export function MyComponent() {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className={resolvedTheme === 'dark' ? 'dark-mode-styles' : 'light-mode-styles'}>
      Content
    </div>
  );
}
```

## Adding New Themes

To add a new theme (e.g., "Blue"):

1. **Update `themes.ts`**:
   ```ts
   export type ThemeOption = "light" | "dark" | "system" | "blue";
   
   export const themes: ThemeConfig[] = [
     // ... existing themes
     {
       id: "blue",
       label: "Blue",
       icon: "Palette", // or any lucide icon name
     },
   ];
   ```

2. **Add CSS variables** in `globals.css`:
   ```css
   [data-theme="blue"] {
     --background: 217 91% 60%;
     --foreground: 210 40% 98%;
     /* ... other variables */
   }
   ```

3. **Update ThemeSwitcher** if using custom icons:
   ```tsx
   // In ThemeSwitcher.tsx, add to getIcon function:
   case "Palette":
     return <Palette size={18} />;
   ```

## Architecture

### File Structure

```
frontend/src/components/theme/
├── index.ts              # Barrel export
├── ThemeProvider.tsx      # Context provider with system detection
├── ThemeSwitcher.tsx      # UI component (icon buttons)
├── useTheme.ts           # Hook for accessing theme context
├── themes.ts             # Theme registry (metadata only)
├── theme-script.ts       # Inline script for flash prevention
└── README.md             # This file
```

### How It Works

1. **Flash Prevention**: Inline script in `<head>` reads localStorage and sets `data-theme` attribute before React hydrates
2. **System Detection**: `ThemeProvider` listens to `prefers-color-scheme` media query changes
3. **Persistence**: User preference (not resolved theme) is stored in localStorage
4. **Resolution**: When theme is "system", the provider resolves it to "light" or "dark" based on OS preference

### Theme Registry

The `themes.ts` file contains only metadata:
- Theme IDs
- Display labels
- Icon names (for UI)

CSS is handled separately in `globals.css` using `[data-theme="..."]` selectors.

## Tailwind Configuration

The theme system works with Tailwind's `dark:` variant. Ensure your `tailwind.config.ts` has:

```ts
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  // ...
};
```

Then use Tailwind classes:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

## Browser Support

- Modern browsers with `prefers-color-scheme` support
- Falls back to light theme if system detection fails
- localStorage required for persistence (gracefully degrades if unavailable)

## Troubleshooting

### Theme doesn't persist after reload

- Check browser console for localStorage errors
- Verify `STORAGE_KEY` constant matches what's in localStorage
- Check that `ThemeProvider` is wrapping your app

### Flash of wrong theme on load

- Ensure `themeScript` is in `<head>` with `strategy="beforeInteractive"`
- Verify script runs before React hydration
- Check that script handles "system" theme correctly

### System theme doesn't update when OS changes

- Verify `prefers-color-scheme` listener is set up in `ThemeProvider`
- Check browser DevTools > Application > Local Storage for stored theme
- Ensure theme is set to "system" (not "light" or "dark")

## License

Part of the Scriptboard project.

