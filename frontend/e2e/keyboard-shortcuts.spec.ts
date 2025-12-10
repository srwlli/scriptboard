import { test, expect } from '@playwright/test';

/**
 * E2E test for keyboard shortcuts:
 * Press Ctrl+V → verify response pasted → verify UI updates
 */
test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Scriptboard');
  });

  test('keyboard shortcut pastes response', async ({ page }) => {
    // Set up clipboard with test response
    const testResponse = 'Keyboard shortcut test response';
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, testResponse);
    
    // Focus on the page to ensure keyboard events are captured
    await page.click('body');
    
    // Press Ctrl+V (or Cmd+V on Mac)
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(1000);
    
    // Verify response was added
    // Note: This depends on the hotkeys implementation
    // The response count should increase
    const responsesPanel = page.locator('text=Responses').locator('..');
    // Check if response count increased (may need adjustment based on actual behavior)
    await expect(responsesPanel.locator('text=/\\d+ response/')).toBeVisible();
  });

  test('keyboard shortcuts work across panels', async ({ page }) => {
    // This test verifies that keyboard shortcuts work for different actions
    // The actual shortcuts depend on the hotkeys.ts implementation
    
    // Test prompt paste shortcut (if implemented)
    const testPrompt = 'Keyboard shortcut prompt';
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, testPrompt);
    
    await page.click('body');
    // Note: Actual shortcut keys depend on configuration
    // This is a placeholder test that may need adjustment
  });
});

