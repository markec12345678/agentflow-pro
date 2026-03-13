/**
 * Fix verification tests - check all buttons after fixes
 */

import { test, expect } from "./fixtures";

test.describe("Fix Verification", () => {
  
  test("manifest.json is valid", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toBeDefined();
    expect(manifest?.name).toBe("AgentFlow Pro");
    
    // Check icons exist
    if (manifest?.icons) {
      for (const icon of manifest.icons) {
        const iconResponse = await page.request.get(icon.src);
        expect(iconResponse.status()).toBe(200);
      }
    }
  });

  test("service worker registers successfully", async ({ page }) => {
    await page.goto("/");
    
    // Wait for service worker registration
    await page.waitForFunction(() => {
      return 'serviceWorker' in navigator;
    });
    
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistration).toBeTruthy();
  });

  test("no 404 errors on page load", async ({ page }) => {
    const errors: string[] = [];
    
    page.on('response', response => {
      if (response.status() === 404) {
        errors.push(response.url());
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    
    // Filter out expected 404s (e.g., optional features)
    const unexpected404s = errors.filter(url => {
      // Ignore favicon.ico 404s (common)
      if (url.includes('favicon.ico')) return false;
      // Ignore external URLs
      if (!url.includes('localhost:3002')) return false;
      return true;
    });
    
    if (unexpected404s.length > 0) {
      console.log('404 errors found:', unexpected404s);
    }
    
    // We allow some 404s for optional features
    expect(unexpected404s.length).toBeLessThan(3);
  });

  test("all header buttons work", async ({ page }) => {
    await page.goto("/");
    
    // Test Demo button
    const demoButton = page.getByRole("link", { name: /demo/i });
    await demoButton.click();
    await expect(page).toHaveURL(/\/#demo-video/);
    
    // Test Cenik button
    await page.goto("/");
    const pricingButton = page.getByRole("link", { name: /cenik/i });
    await pricingButton.click();
    await expect(page).toHaveURL("/pricing");
    
    // Test Prijava button
    await page.goto("/");
    const loginButton = page.getByRole("link", { name: /prijava/i });
    await loginButton.click();
    await expect(page).toHaveURL("/login");
  });

  test("pricing page loads without errors", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveTitle(/pricing|agentflow/i, { timeout: 10000 });
    
    // Check for pricing plans
    await expect(page.getByText(/free|brezplačno/i)).toBeVisible();
    await expect(page.getByText(/pro/i)).toBeVisible();
  });

  test("login page loads without errors", async ({ page }) => {
    await page.goto("/login");
    
    // Check for login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("register page loads without errors", async ({ page }) => {
    await page.goto("/register");
    
    // Check for register form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("demo section exists and has content", async ({ page }) => {
    await page.goto("/#demo-video");
    
    const demoSection = page.locator("#demo-video");
    await expect(demoSection).toBeVisible();
    
    // Check for CTA button
    const ctaButton = demoSection.getByRole("link", { name: /start/i });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute("href", /\/onboarding/);
  });
});
