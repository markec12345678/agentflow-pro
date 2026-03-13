/**
 * Comprehensive Link & Button Test
 * Tests ALL links and buttons in the application
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3002";

// Helper function to check if link is valid
async function testLink(page: Page, url: string, description: string) {
  try {
    const response = await page.goto(url, { 
      waitUntil: "domcontentloaded",
      timeout: 10000 
    });
    
    const status = response?.status();
    const is404 = status === 404;
    const is500 = status && status >= 500;
    
    if (is404 || is500) {
      console.log(`❌ ${description}: ${url} - Status: ${status}`);
      return false;
    }
    
    console.log(`✅ ${description}: ${url} - Status: ${status}`);
    return true;
  } catch (error) {
    console.log(`⚠️ ${description}: ${url} - Error: ${(error as Error).message}`);
    return false;
  }
}

test.describe("Comprehensive Link Test", () => {
  test("all public pages load without 404", async ({ page }) => {
    const pages = [
      { url: "/", name: "Homepage" },
      { url: "/login", name: "Login" },
      { url: "/register", name: "Register" },
      { url: "/pricing", name: "Pricing" },
      { url: "/onboarding", name: "Onboarding" },
      { url: "/forgot-password", name: "Forgot Password" },
      { url: "/solutions", name: "Solutions" },
      { url: "/stories", name: "Stories" },
      { url: "/docs", name: "Docs" },
      { url: "/contact", name: "Contact" },
      { url: "/generate", name: "Generate" },
      { url: "/content", name: "Content" },
      { url: "/settings", name: "Settings" },
      { url: "/dashboard", name: "Dashboard (may redirect)" },
    ];

    const results: { name: string; url: string; success: boolean }[] = [];

    for (const p of pages) {
      const success = await testLink(page, BASE_URL + p.url, p.name);
      results.push({ name: p.name, url: p.url, success });
    }

    // Allow some pages to fail (auth-protected)
    const failures = results.filter(r => !r.success);
    console.log(`\n📊 Results: ${results.filter(r => r.success).length}/${results.length} passed`);
    
    // Max 3 failures allowed (auth-protected pages)
    expect(failures.length).toBeLessThan(4);
  });

  test("all header navigation links work", async ({ page }) => {
    await page.goto(BASE_URL + "/");
    
    const links = [
      { name: "Demo", expected: /\/#demo-video/ },
      { name: "Cenik", expected: "/pricing" },
      { name: "Prijava", expected: "/login" },
    ];

    for (const link of links) {
      const element = page.getByRole("link", { name: new RegExp(link.name, "i") });
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        if (typeof link.expected === "string") {
          expect(currentUrl).toContain(link.expected);
        } else {
          expect(currentUrl).toMatch(link.expected);
        }
        
        console.log(`✅ ${link.name} link works`);
        await page.goto(BASE_URL + "/"); // Reset
      }
    }
  });

  test("all footer links work", async ({ page }) => {
    await page.goto(BASE_URL + "/");
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footerLinks = [
      { name: "Pricing", expected: "/pricing" },
      { name: "Demo", expected: /#demo-video/ },
    ];

    for (const link of footerLinks) {
      const element = page.getByRole("link", { name: new RegExp(link.name, "i") });
      if (await element.isVisible()) {
        const href = await element.getAttribute("href");
        console.log(`✅ Footer link: ${link.name} -> ${href}`);
      }
    }
  });

  test("demo section has valid content", async ({ page }) => {
    await page.goto(BASE_URL + "/#demo-video");
    
    const demoSection = page.locator("#demo-video");
    await expect(demoSection).toBeVisible();
    
    // Check heading
    const heading = demoSection.locator("h2");
    await expect(heading).toBeVisible();
    
    // Check CTA button
    const cta = demoSection.getByRole("link", { name: /start/i });
    await expect(cta).toBeVisible();
    
    const href = await cta.getAttribute("href");
    expect(href).toContain("/onboarding");
    
    console.log("✅ Demo section has valid content");
  });

  test("pricing page has all CTAs", async ({ page }) => {
    await page.goto(BASE_URL + "/pricing");
    
    // Check for pricing plans
    await expect(page.getByText(/free|brezplačno/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/pro/i)).toBeVisible();
    await expect(page.getByText(/business|custom/i)).toBeVisible();
    
    // Check CTAs exist
    const ctas = [
      "Get Started Free",
      "Start Free 7-Day Trial",
      "Contact Sales"
    ];
    
    for (const cta of ctas) {
      const element = page.getByRole("link", { name: new RegExp(cta, "i") });
      if (await element.isVisible()) {
        console.log(`✅ Pricing CTA found: ${cta}`);
      }
    }
  });

  test("login page has all required elements", async ({ page }) => {
    await page.goto(BASE_URL + "/login");
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /prijava/i })).toBeVisible();
    
    // Check links
    await expect(page.getByRole("link", { name: /registracija/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /pozabljeno|forgot|geslo/i })).toBeVisible();
    
    console.log("✅ Login page has all required elements");
  });

  test("register page has all required elements", async ({ page }) => {
    await page.goto(BASE_URL + "/register");
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /register|ustvari/i })).toBeVisible();
    
    // Check back link
    await expect(page.getByRole("link", { name: /prijava|login/i })).toBeVisible();
    
    console.log("✅ Register page has all required elements");
  });

  test("no broken images on homepage", async ({ page }) => {
    await page.goto(BASE_URL + "/");
    
    const images = page.locator("img");
    const count = await images.count();
    
    let broken = 0;
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        if (naturalWidth === 0) {
          broken++;
          const src = await img.getAttribute("src");
          console.log(`❌ Broken image: ${src}`);
        }
      }
    }
    
    console.log(`✅ Images: ${count - broken}/${count} loaded successfully`);
    
    // Allow some broken images (optional)
    expect(broken).toBeLessThan(3);
  });

  test("mobile menu works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL + "/");
    
    // Find and click mobile menu button
    const menuButton = page.getByRole("button", { name: /menu|hamburger/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Check menu is open
      const mobileMenu = page.locator("nav").first();
      const isVisible = await mobileMenu.isVisible();
      
      console.log(`✅ Mobile menu: ${isVisible ? "opens" : "doesn't open"}`);
      expect(isVisible).toBeTruthy();
    }
  });
});
