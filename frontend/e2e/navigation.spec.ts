import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming backend is running)
    await page.goto('http://localhost:3000')
  })

  test('should navigate between Modern and Classic pages', async ({ page }) => {
    // Check we're on the Modern page initially
    await expect(page.locator('h1:has-text("Scriptboard")')).toBeVisible()
    
    // Find and click the Classic navigation link
    const classicLink = page.locator('a:has-text("Classic")')
    await expect(classicLink).toBeVisible()
    await classicLink.click()
    
    // Should navigate to /new-page
    await expect(page).toHaveURL(/.*\/new-page/)
    
    // Verify Classic page elements are present
    await expect(page.locator('button:has-text("Add+")')).toBeVisible()
    await expect(page.locator('button:has-text("Load")')).toBeVisible()
    
    // Navigate back to Modern page
    const modernLink = page.locator('a:has-text("Modern")')
    await expect(modernLink).toBeVisible()
    await modernLink.click()
    
    // Should navigate back to home
    await expect(page).toHaveURL(/.*\/$/)
    
    // Verify Modern page elements are present
    await expect(page.locator('h2:has-text("Favorites")')).toBeVisible()
  })

  test('should highlight active navigation link', async ({ page }) => {
    // Check Modern link is active on home page
    const modernLink = page.locator('a:has-text("Modern")')
    await expect(modernLink).toHaveClass(/bg-primary/)
    
    // Navigate to Classic
    await page.locator('a:has-text("Classic")').click()
    
    // Check Classic link is now active
    const classicLink = page.locator('a:has-text("Classic")')
    await expect(classicLink).toHaveClass(/bg-primary/)
    
    // Modern link should not be active
    const modernLinkAfter = page.locator('a:has-text("Modern")')
    await expect(modernLinkAfter).not.toHaveClass(/bg-primary/)
  })

  test('should maintain navigation state on page reload', async ({ page }) => {
    // Navigate to Classic page
    await page.locator('a:has-text("Classic")').click()
    await expect(page).toHaveURL(/.*\/new-page/)
    
    // Reload page
    await page.reload()
    
    // Should still be on Classic page
    await expect(page).toHaveURL(/.*\/new-page/)
    await expect(page.locator('button:has-text("Add+")')).toBeVisible()
  })
})

