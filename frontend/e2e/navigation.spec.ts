import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming backend is running)
    await page.goto('http://localhost:3000')
  })

  test('should navigate between Classic and Modern pages', async ({ page }) => {
    // Check we're on the Classic page initially (default)
    await expect(page.locator('h1:has-text("Scriptboard")')).toBeVisible()
    await expect(page.locator('button:has-text("Add+")')).toBeVisible()
    await expect(page.locator('button:has-text("Load")')).toBeVisible()
    
    // Find and click the Modern navigation link
    const modernLink = page.locator('a:has-text("Modern")')
    await expect(modernLink).toBeVisible()
    await modernLink.click()
    
    // Should navigate to /new-page
    await expect(page).toHaveURL(/.*\/new-page/)
    
    // Verify Modern page elements are present
    await expect(page.locator('h2:has-text("Favorites")')).toBeVisible()
    
    // Navigate back to Classic page
    const classicLink = page.locator('a:has-text("Classic")')
    await expect(classicLink).toBeVisible()
    await classicLink.click()
    
    // Should navigate back to home
    await expect(page).toHaveURL(/.*\/$/)
    
    // Verify Classic page elements are present
    await expect(page.locator('button:has-text("Add+")')).toBeVisible()
  })

  test('should highlight active navigation link', async ({ page }) => {
    // Check Classic link is active on home page (default)
    const classicLink = page.locator('a:has-text("Classic")')
    await expect(classicLink).toHaveClass(/bg-primary/)
    
    // Navigate to Modern
    await page.locator('a:has-text("Modern")').click()
    
    // Check Modern link is now active
    const modernLink = page.locator('a:has-text("Modern")')
    await expect(modernLink).toHaveClass(/bg-primary/)
    
    // Classic link should not be active
    const classicLinkAfter = page.locator('a:has-text("Classic")')
    await expect(classicLinkAfter).not.toHaveClass(/bg-primary/)
  })

  test('should maintain navigation state on page reload', async ({ page }) => {
    // Navigate to Modern page
    await page.locator('a:has-text("Modern")').click()
    await expect(page).toHaveURL(/.*\/new-page/)
    
    // Reload page
    await page.reload()
    
    // Should still be on Modern page
    await expect(page).toHaveURL(/.*\/new-page/)
    await expect(page.locator('h2:has-text("Favorites")')).toBeVisible()
  })
})

