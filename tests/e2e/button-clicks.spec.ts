/**
 * Button Click E2E Tests
 * 
 * Test all buttons and links to ensure they work and lead to valid pages.
 * Covers: Header nav, login flow, dashboard navigation
 */

import { test, expect } from "./fixtures";

test.describe("Button Click Tests", () => {
  
  test.describe("Header Navigation", () => {
    
    test("Demo button scrolls to demo section", async ({ page }) => {
      await page.goto("/");
      
      // Find Demo button in header
      const demoButton = page.getByRole("link", { name: /demo/i });
      await demoButton.click();
      
      // Should navigate to #demo-video section
      await expect(page).toHaveURL(/\/#demo-video/);
      
      // Check demo section exists
      const demoSection = page.locator("#demo-video");
      await expect(demoSection).toBeVisible();
    });

    test("Cenik button goes to pricing page", async ({ page }) => {
      await page.goto("/");
      
      const pricingButton = page.getByRole("link", { name: /cenik|pricing/i });
      await pricingButton.click();
      
      await expect(page).toHaveURL("/pricing");
      await expect(page).toHaveTitle(/pricing|agentflow/i, { timeout: 10000 });
    });

    test("Prijava button goes to login page", async ({ page }) => {
      await page.goto("/");
      
      const loginButton = page.getByRole("link", { name: /prijava|login|sign in/i });
      await loginButton.click();
      
      await expect(page).toHaveURL("/login");
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    });

    test("Začni brezplačno button goes to onboarding", async ({ page }) => {
      await page.goto("/");
      
      const ctaButton = page.getByRole("link", { name: /začni|start|brezplačno|free/i });
      await ctaButton.click();
      
      await expect(page).toHaveURL(/\/onboarding|\/register/);
    });
  });

  test.describe("Login Page", () => {
    
    test("Registracija link goes to register page", async ({ page }) => {
      await page.goto("/login");
      
      const registerLink = page.getByRole("link", { name: /registracija|register|sign up/i });
      await registerLink.click();
      
      await expect(page).toHaveURL("/register");
    });

    test("Pozabljeno geslo link exists", async ({ page }) => {
      await page.goto("/login");
      
      const forgotLink = page.getByRole("link", { name: /pozabljeno|forgot|geslo|password/i });
      await expect(forgotLink).toBeVisible();
      
      // Click and check navigation (might be JS-based)
      await forgotLink.click();
      await page.waitForTimeout(1000);
      
      // Should either navigate or show modal
      const hasNavigated = page.url().includes("forgot-password");
      const modalVisible = await page.locator("[role='dialog']").isVisible().catch(() => false);
      expect(hasNavigated || modalVisible).toBeTruthy();
    });

    test("Test prijave (dev) button exists", async ({ page }) => {
      await page.goto("/login");
      
      const testButton = page.getByRole("button", { name: /test prijave|test login/i });
      await expect(testButton).toBeVisible();
    });
  });

  test.describe("Register Page", () => {
    
    test("Prijava link goes back to login", async ({ page }) => {
      await page.goto("/register");
      
      const loginLink = page.getByRole("link", { name: /prijava|login|sign in/i });
      await loginLink.click();
      
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Pricing Page", () => {
    
    test("Free plan CTA goes to register", async ({ page }) => {
      await page.goto("/pricing");
      
      const freeCta = page.getByRole("link", { name: /free|brezplačno/i }).first();
      await freeCta.click();
      
      await expect(page).toHaveURL(/\/register/);
    });

    test("Pro plan CTA goes to register", async ({ page }) => {
      await page.goto("/pricing");
      
      const proCta = page.getByRole("link", { name: /pro|start trial/i });
      await proCta.click();
      
      await expect(page).toHaveURL(/\/register.*plan=pro/);
    });
  });

  test.describe("Dashboard Navigation (Authenticated)", () => {
    
    test("Dashboard loads for authenticated user", async ({ page, auth: _auth }) => {
      await page.goto("/dashboard");
      
      // Should either show dashboard or redirect to tourism
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("Koledar link exists in dashboard", async ({ page, auth: _auth }) => {
      await page.goto("/dashboard");
      
      const calendarLink = page.getByRole("link", { name: /koledar|calendar/i });
      await expect(calendarLink).toBeVisible();
    });

    test("Ustvari button exists in dashboard", async ({ page, auth: _auth }) => {
      await page.goto("/dashboard");
      
      const createButton = page.getByRole("link", { name: /ustvari|create|new/i });
      await expect(createButton).toBeVisible();
    });

    test("Vsebina link exists in dashboard", async ({ page, auth: _auth }) => {
      await page.goto("/dashboard");
      
      const contentLink = page.getByRole("link", { name: /vsebina|content/i });
      await expect(contentLink).toBeVisible();
    });

    test("Nastavitve link exists in dashboard", async ({ page, auth: _auth }) => {
      await page.goto("/dashboard");
      
      const settingsLink = page.getByRole("link", { name: /nastavitve|settings/i });
      await expect(settingsLink).toBeVisible();
    });
  });

  test.describe("Mobile Navigation", () => {
    
    test("Mobile menu opens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
      await page.goto("/");
      
      const menuButton = page.getByRole("button", { name: /menu|hamburger/i });
      await menuButton.click();
      
      // Mobile menu should be visible
      const mobileMenu = page.locator("[role='dialog'], nav").first();
      await expect(mobileMenu).toBeVisible();
    });

    test("Mobile menu has all main links", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      
      const menuButton = page.getByRole("button", { name: /menu/i });
      await menuButton.click();
      
      // Check for key links in mobile menu
      await expect(page.getByText(/cenik|pricing/i)).toBeVisible();
      await expect(page.getByText(/demo/i)).toBeVisible();
      await expect(page.getByText(/prijava|login/i)).toBeVisible();
    });
  });
});
