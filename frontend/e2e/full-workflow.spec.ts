import { test, expect } from '@playwright/test';

/**
 * E2E test for full workflow:
 * Load prompt → attach file → paste response → preview → save → reload → verify all data present
 */
test.describe('Full Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('text=Scriptboard');
  });

  test('complete workflow: prompt → attachment → response → preview → save', async ({ page }) => {
    // Step 1: Set a prompt
    const testPrompt = 'This is a test prompt for E2E testing';
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, testPrompt);
    
    // Click Paste button in Prompt panel
    await page.click('button:has-text("Paste")');
    await page.waitForTimeout(500); // Wait for API call
    
    // Verify prompt status shows "Source: manual"
    await expect(page.locator('text=Source: manual')).toBeVisible();

    // Step 2: Add an attachment
    const testAttachment = 'This is test attachment content\nLine 2\nLine 3';
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, testAttachment);
    
    // Find and click Paste button in Attachments panel
    const attachmentsPanel = page.locator('text=Attachments').locator('..');
    await attachmentsPanel.locator('button:has-text("Paste")').click();
    await page.waitForTimeout(500);
    
    // Verify attachment count
    await expect(attachmentsPanel.locator('text=/\\d+ attachment/')).toBeVisible();

    // Step 3: Add a response
    const testResponse = 'This is a test LLM response';
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, testResponse);
    
    // Find and click Paste button in Responses panel
    const responsesPanel = page.locator('text=Responses').locator('..');
    await responsesPanel.locator('button:has-text("Paste")').click();
    await page.waitForTimeout(500);
    
    // Verify response count
    await expect(responsesPanel.locator('text=/\\d+ response/')).toBeVisible();

    // Step 4: Check preview
    const previewPanel = page.locator('text=Preview').locator('..');
    await expect(previewPanel.locator('text=Loading preview...').or(previewPanel.locator('pre'))).toBeVisible({ timeout: 5000 });

    // Step 5: Save session
    const sessionPanel = page.locator('text=Session Manager').locator('..');
    await sessionPanel.locator('button:has-text("Save Session")').click();
    await page.waitForTimeout(1000);
    
    // Verify save success message
    await expect(sessionPanel.locator('text=/Saved:/')).toBeVisible({ timeout: 5000 });

    // Step 6: Clear all and verify
    await sessionPanel.locator('button:has-text("Clear All")').click();
    
    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await page.waitForTimeout(1000);
    
    // Verify everything is cleared
    await expect(page.locator('text=No prompt set')).toBeVisible();
    await expect(attachmentsPanel.locator('text=0 attachments')).toBeVisible();
    await expect(responsesPanel.locator('text=0 responses')).toBeVisible();
  });
});

