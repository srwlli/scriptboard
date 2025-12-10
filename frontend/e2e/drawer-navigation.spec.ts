import { test, expect } from '@playwright/test'

test.describe('Drawer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should open drawer from header button', async ({ page }) => {
    // Find and click the drawer trigger button (Menu icon)
    const menuButton = page.locator('button[aria-label="Open navigation menu"]')
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    // Drawer should be visible
    const drawer = page.locator('[role="dialog"][aria-label="Navigation drawer"]')
    await expect(drawer).toBeVisible()
    
    // Navigation items should be visible
    await expect(page.locator('text=Home')).toBeVisible()
    await expect(page.locator('text=New Page')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should navigate to Home from drawer', async ({ page }) => {
    // Open drawer
    await page.locator('button[aria-label="Open navigation menu"]').click()
    
    // Click Home link
    await page.locator('a:has-text("Home")').click()
    
    // Should navigate to home
    await expect(page).toHaveURL(/.*\/$/)
    
    // Drawer should be closed
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).not.toBeVisible()
  })

  test('should navigate to New Page from drawer', async ({ page }) => {
    // Open drawer
    await page.locator('button[aria-label="Open navigation menu"]').click()
    
    // Click New Page link
    await page.locator('a:has-text("New Page")').click()
    
    // Should navigate to new-page
    await expect(page).toHaveURL(/.*\/new-page/)
    
    // Drawer should be closed
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).not.toBeVisible()
  })

  test('should navigate to Settings from drawer', async ({ page }) => {
    // Open drawer
    await page.locator('button[aria-label="Open navigation menu"]').click()
    
    // Click Settings link
    await page.locator('a:has-text("Settings")').click()
    
    // Should navigate to settings
    await expect(page).toHaveURL(/.*\/settings/)
    
    // Settings page should be visible
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible()
    
    // Drawer should be closed
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).not.toBeVisible()
  })

  test('should toggle theme on Settings page', async ({ page }) => {
    // Navigate to Settings
    await page.goto('http://localhost:3000/settings')
    
    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    await expect(themeToggle).toBeVisible()
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    )
    
    // Click toggle
    await themeToggle.click()
    
    // Theme should change
    const newTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    )
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should close drawer on backdrop click', async ({ page }) => {
    // Open drawer
    await page.locator('button[aria-label="Open navigation menu"]').click()
    
    // Drawer should be visible
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toBeVisible()
    
    // Click backdrop (outside drawer)
    await page.click('body', { position: { x: 100, y: 100 } })
    
    // Drawer should be closed
    await expect(drawer).not.toBeVisible()
  })

  test('should close drawer on ESC key', async ({ page }) => {
    // Open drawer
    await page.locator('button[aria-label="Open navigation menu"]').click()
    
    // Drawer should be visible
    const drawer = page.locator('[role="dialog"]')
    await expect(drawer).toBeVisible()
    
    // Press ESC key
    await page.keyboard.press('Escape')
    
    // Drawer should be closed
    await expect(drawer).not.toBeVisible()
  })
})

