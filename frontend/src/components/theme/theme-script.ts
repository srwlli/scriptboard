/**
 * Inline script for flash prevention.
 * 
 * This script runs in the <head> before React hydrates to prevent
 * flash of wrong theme/mode. It reads localStorage and sets both
 * data-theme and data-mode attributes immediately.
 * 
 * Usage: Inline this script in layout.tsx <head> section.
 */

export const themeScript = `
(function() {
  try {
    const theme = localStorage.getItem('app-theme') || 'default';
    const mode = localStorage.getItem('app-mode') || 'system';
    const root = document.documentElement;
    
    // Resolve mode (system -> check OS preference)
    let resolvedMode = mode;
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedMode = prefersDark ? 'dark' : 'light';
    }
    
    // Set both attributes
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', resolvedMode);
  } catch (e) {
    // Fallback to default/light if anything fails
    document.documentElement.setAttribute('data-theme', 'default');
    document.documentElement.setAttribute('data-mode', 'light');
  }
})();
`.trim();
