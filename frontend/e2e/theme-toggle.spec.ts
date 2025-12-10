import { test, expect } from '@playwright/test';

/**
 * E2E test for theme toggle:
 * Toggle theme → verify UI updates → reload → verify persistence
 */
test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Scriptboard');
  });

  test('toggles theme and persists after reload', async ({ page }) => {
    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
    
    // Check initial theme (should be light by default)
    const htmlElement = page.locator('html');
    let initialTheme = await htmlElement.getAttribute('data-theme');
    expect(initialTheme).toBe('light');
    
    // Toggle to dark
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    // Verify theme changed to dark
    let currentTheme = await htmlElement.getAttribute('data-theme');
    expect(currentTheme).toBe('dark');
    
    // Reload page
    await page.reload();
    await page.waitForSelector('text=Scriptboard');
    
    // Verify theme persisted (should still be dark)
    currentTheme = await htmlElement.getAttribute('data-theme');
    expect(currentTheme).toBe('dark');
    
    // Toggle back to light
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    // Verify theme changed to light
    currentTheme = await htmlElement.getAttribute('data-theme');
    expect(currentTheme).toBe('light');
    
    // Reload again
    await page.reload();
    await page.waitForSelector('text=Scriptboard');
    
    // Verify theme persisted as light
    currentTheme = await htmlElement.getAttribute('data-theme');
    expect(currentTheme).toBe('light');
  });
});

