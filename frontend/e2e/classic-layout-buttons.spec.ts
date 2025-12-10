import { test, expect } from '@playwright/test'

test.describe('Classic Layout Button Functions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Classic page (now the default home page)
    await page.goto('http://localhost:3000')
    
    // Wait for page to load
    await expect(page.locator('button:has-text("Add+")')).toBeVisible()
  })

  test.describe('Prompt Section', () => {
    test('should display prompt section buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Load")')).toBeVisible()
      await expect(page.locator('button:has-text("Paste")')).toBeVisible()
      await expect(page.locator('button:has-text("View")')).toBeVisible()
      await expect(page.locator('button:has-text("Clear")')).toBeVisible()
    })

    test('should show status label', async ({ page }) => {
      // Status label should be visible (may show "No prompt" initially)
      const statusLabel = page.locator('text=/No prompt|Responses:|Prompts:/')
      await expect(statusLabel.first()).toBeVisible()
    })

    test('should handle Paste button click', async ({ page, context }) => {
      // Mock clipboard API
      await context.grantPermissions(['clipboard-read'])
      
      // Set clipboard content
      await page.evaluate(() => {
        navigator.clipboard.writeText('Test prompt from clipboard')
      })
      
      // Click Paste button
      const pasteButton = page.locator('button:has-text("Paste")').first()
      await pasteButton.click()
      
      // Wait a bit for API call (if backend is running)
      await page.waitForTimeout(500)
      
      // Button should still be visible (no error)
      await expect(pasteButton).toBeVisible()
    })
  })

  test.describe('Attachments Section', () => {
    test('should display attachments section buttons', async ({ page }) => {
      // Find second set of buttons (Attachments section)
      const buttons = page.locator('button:has-text("Load")')
      await expect(buttons).toHaveCount(2) // Prompt and Attachments both have Load
      
      // Verify Paste, View, Clear buttons exist
      await expect(page.locator('button:has-text("Paste")')).toHaveCount(2)
      await expect(page.locator('button:has-text("View")')).toHaveCount(2)
      await expect(page.locator('button:has-text("Clear")')).toHaveCount(2)
    })
  })

  test.describe('Responses Section', () => {
    test('should display responses section buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("LLMs")')).toBeVisible()
      await expect(page.locator('button:has-text("Paste")')).toHaveCount(2) // Prompt and Responses
    })

    test('should handle LLMs button click', async ({ page, context }) => {
      // Track new page opens
      const pagePromise = context.waitForEvent('page')
      
      // Click LLMs button
      const llmsButton = page.locator('button:has-text("LLMs")')
      await llmsButton.click()
      
      // If LLM URLs are configured, a new page might open
      // This test verifies the button is clickable
      await expect(llmsButton).toBeVisible()
    })
  })

  test.describe('Management Section', () => {
    test('should display management section buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Copy All")')).toBeVisible()
      await expect(page.locator('button:has-text("Save As")')).toBeVisible()
      await expect(page.locator('button:has-text("View")')).toHaveCount(3) // Prompt, Attachments, Management
      await expect(page.locator('button:has-text("Clear All")')).toBeVisible()
    })

    test('should handle Copy All button click', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-write'])
      
      // Click Copy All button
      const copyAllButton = page.locator('button:has-text("Copy All")')
      await copyAllButton.click()
      
      // Wait a bit for API call
      await page.waitForTimeout(500)
      
      // Button should still be visible
      await expect(copyAllButton).toBeVisible()
    })
  })

  test.describe('Favorites Section', () => {
    test('should display Add+ button', async ({ page }) => {
      await expect(page.locator('button:has-text("Add+")')).toBeVisible()
    })

    test('should handle Add+ button click', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add+")')
      await addButton.click()
      
      // In browser, should show alert about Electron requirement
      // In Electron, would open folder dialog
      // Just verify button is clickable
      await expect(addButton).toBeVisible()
    })
  })

  test.describe('Footer Bar', () => {
    test('should display footer bar', async ({ page }) => {
      // Footer should be at bottom
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
      
      // Should have character count
      await expect(page.locator('text=/Chars:/')).toBeVisible()
    })

    test('should have Lock Size checkbox', async ({ page }) => {
      const lockSizeCheckbox = page.locator('label:has-text("Lock Size") input[type="checkbox"]')
      await expect(lockSizeCheckbox).toBeVisible()
    })

    test('should have On Top checkbox', async ({ page }) => {
      const onTopCheckbox = page.locator('label:has-text("On Top") input[type="checkbox"]')
      await expect(onTopCheckbox).toBeVisible()
    })

    test('should toggle Lock Size checkbox', async ({ page }) => {
      const lockSizeCheckbox = page.locator('label:has-text("Lock Size") input[type="checkbox"]')
      const initialChecked = await lockSizeCheckbox.isChecked()
      
      await lockSizeCheckbox.click()
      
      const afterChecked = await lockSizeCheckbox.isChecked()
      expect(afterChecked).toBe(!initialChecked)
    })
  })

  test('should display all sections in vertical stack', async ({ page }) => {
    // Verify all main sections are present
    await expect(page.locator('button:has-text("Add+")')).toBeVisible() // Favorites
    await expect(page.locator('button:has-text("Load")').first()).toBeVisible() // Prompt
    await expect(page.locator('button:has-text("LLMs")')).toBeVisible() // Responses
    await expect(page.locator('button:has-text("Copy All")')).toBeVisible() // Management
    await expect(page.locator('footer')).toBeVisible() // Footer
  })
})

