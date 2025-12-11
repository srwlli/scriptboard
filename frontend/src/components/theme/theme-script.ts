/**
 * Inline script for flash prevention.
 * 
 * This script runs in the <head> before React hydrates to prevent
 * flash of wrong theme. It reads localStorage and sets data-theme
 * attribute immediately.
 * 
 * Usage: Inline this script in layout.tsx <head> section.
 */

export const themeScript = `
(function() {
  try {
    const theme = localStorage.getItem('theme') || 'light';
    const root = document.documentElement;
    
    if (theme === 'system') {
      // Check OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  } catch (e) {
    // Fallback to light if anything fails
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`.trim();

