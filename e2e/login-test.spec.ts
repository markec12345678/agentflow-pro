import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3002/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find and fill email input - try multiple selectors
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]')
      .first();
    await emailInput.fill('test@example.com');
    
    // Find and fill password input
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]')
      .first();
    await passwordInput.fill('password123');
    
    // Click login button
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]')
      .first();
    await loginButton.click();
    
    // Wait for navigation and verify
    await page.waitForURL(/\/dashboard|^\//);
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling inputs
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    
    // Check for error messages - use text matcher separately
    const errorMessages = page.locator('.error, [role="alert"]');
    const hasErrors = await errorMessages.count() > 0;
    
    if (hasErrors) {
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Fallback: check for any text containing error keywords
      await expect(page.locator('text=/Invalid|Required|Error/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
