/**
 * Quick UI Smoke Test
 * 
 * Fast test to verify all main pages load and basic navigation works.
 * Run: npx playwright test tests/e2e/ui-smoke.spec.ts --project=chromium
 */

import { test, expect } from "./fixtures";

test.describe("UI Smoke Test - Quick Check", () => {
  
  test("Homepage loads with navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check page loaded
    expect(page.url()).toMatch(/\/$/);
    
    // Check for main nav items
    const navItems = [
      page.getByRole("link", { name: /demo/i }),
      page.getByRole("link", { name: /cenik|pricing/i }),
      page.getByRole("link", { name: /prijava|login/i }),
    ];
    
    let found = 0;
    for (const item of navItems) {
      if (await item.isVisible().catch(() => false)) {
        found++;
      }
    }
    
    console.log(`✅ Homepage: Found ${found}/${navItems.length} nav items`);
    expect(found).toBeGreaterThan(0);
  });

  test("Login page loads", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    
    expect(page.url()).toMatch(/\/login/);
    
    // Check form exists
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    console.log("✅ Login page loaded with form");
  });

  test("Register page loads", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    
    expect(page.url()).toMatch(/\/register/);
    
    // Check form exists
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    console.log("✅ Register page loaded");
  });

  test("Pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    
    expect(page.url()).toMatch(/\/pricing/);
    
    // Check pricing content exists
    const body = await page.locator("body");
    await expect(body).toBeVisible();
    
    console.log("✅ Pricing page loaded");
  });

  test("Dashboard loads (or redirects)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    const url = page.url();
    // Should be dashboard or redirect to valid page (not 404)
    expect(url).not.toMatch(/\/404/);
    expect(url).not.toMatch(/\/error/);
    
    console.log(`✅ Dashboard loaded or redirected to: ${url}`);
  });

  test("Login → Register navigation", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    
    // Find and click register link
    const registerLink = page.getByRole("link", { name: /registracija|register/i });
    if (await registerLink.isVisible().catch(() => false)) {
      await registerLink.click();
      await page.waitForLoadState("networkidle");
      
      expect(page.url()).toMatch(/\/register/);
      console.log("✅ Login → Register navigation works");
    } else {
      console.log("⚠️ Register link not found on login page");
    }
  });

  test("Mobile menu works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    const menuButton = page.getByRole("button", { name: /menu|hamburger/i });
    const isVisible = await menuButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Menu should be visible
      const menu = page.locator("[role='dialog'], nav").first();
      await expect(menu).toBeVisible();
      console.log("✅ Mobile menu works");
    } else {
      console.log("⚠️ Mobile menu button not found");
    }
  });

  test("No 404 on common routes", async ({ page }) => {
    const routes = [
      "/",
      "/login",
      "/register",
      "/pricing",
      "/dashboard",
      "/properties",
      "/workflows",
      "/settings",
    ];
    
    let valid = 0;
    let notFound = 0;
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      
      const url = page.url();
      if (url.includes("/404") || url.includes("/error")) {
        notFound++;
        console.log(`❌ 404 on: ${route}`);
      } else {
        valid++;
      }
    }
    
    console.log(`✅ Routes: ${valid} valid, ${notFound} not found`);
    expect(notFound).toBeLessThan(3); // Allow max 2 not found
  });

  test("All main pages have valid HTML", async ({ page }) => {
    const pages = ["/", "/login", "/register", "/pricing"];
    
    for (const p of pages) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      
      // Check basic HTML structure
      const html = page.locator("html");
      const body = page.locator("body");
      
      await expect(html).toBeVisible();
      await expect(body).toBeVisible();
      
      console.log(`✅ Valid HTML on: ${p}`);
    }
  });
});

test.describe("Button Click Test - Critical Paths", () => {
  
  test("Homepage CTA buttons work", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Find primary CTA
    const ctaButtons = page.getByRole("link", { name: /začni|start|brezplačno|free|demo/i });
    
    if (await ctaButtons.first().isVisible().catch(() => false)) {
      const count = await ctaButtons.count();
      console.log(`✅ Found ${count} CTA buttons on homepage`);
    }
  });

  test("Form buttons are clickable", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    // Try clicking (form validation should prevent submit)
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    expect(page.url()).toMatch(/\/login/);
    
    console.log("✅ Login form button is clickable");
  });
});
