/**
 * Basic E2E Tests for AgentFlow Pro
 * 
 * Quick smoke tests to verify the application is working.
 */
import { test, expect } from "./fixtures";

test.describe("Basic Functionality", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AgentFlow/i, { timeout: 10000 });
  });

  test("should load signin page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    
    // Check for email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test("should load dashboard after login", async ({ page, auth: _auth }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should navigate to properties", async ({ page, auth: _auth }) => {
    await page.goto("/dashboard");
    
    // Find and click properties link
    const propertiesLink = page.getByRole("link", { name: /properties/i });
    await propertiesLink.click();
    
    await expect(page).toHaveURL(/\/properties/, { timeout: 10000 });
  });
});
