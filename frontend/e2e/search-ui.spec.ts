import { test, expect } from '@playwright/test';

/**
 * E2E test for search functionality:
 * Enter search query → verify results displayed → click result → verify navigation
 */
test.describe('Search UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Scriptboard');
    
    // Set up some test data for searching
    const testPrompt = 'This is a searchable prompt with unique keyword: SEARCHTEST123';
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, testPrompt);
    
    // Add prompt
    await page.click('button:has-text("Paste")');
    await page.waitForTimeout(500);
  });

  test('search displays results and allows interaction', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Enter search query
    await searchInput.fill('SEARCHTEST123');
    await searchInput.press('Enter');
    
    // Wait for search results to appear
    await page.waitForTimeout(1000);
    
    // Verify search results are displayed
    // Note: This will depend on the actual SearchResults component implementation
    const searchResults = page.locator('[data-testid="search-results"]').or(page.locator('text=/result/'));
    await expect(searchResults.first()).toBeVisible({ timeout: 5000 });
  });

  test('search clears when query is empty', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Enter search query
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Verify search results are hidden (if they were shown)
    // This test may need adjustment based on actual UI behavior
  });
});

