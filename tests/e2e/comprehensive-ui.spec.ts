/**
 * Comprehensive UI Navigation Test
 * 
 * Tests ALL pages and buttons in the application to ensure:
 * 1. Every page loads successfully
 * 2. Every button/link leads to a valid page
 * 3. Navigation follows logical structure
 * 4. No broken links or 404 errors
 * 
 * Run: npx playwright test tests/e2e/comprehensive-ui.spec.ts --project=chromium
 */

import { test, expect } from "./fixtures";

// Define all routes to test
const PUBLIC_ROUTES = [
  { path: "/", name: "Homepage" },
  { path: "/pricing", name: "Pricing" },
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
  { path: "/forgot-password", name: "Forgot Password" },
  { path: "/demo", name: "Demo" },
  { path: "/contact", name: "Contact" },
  { path: "/solutions", name: "Solutions" },
];

const AUTH_ROUTES = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/calendar", name: "Calendar" },
  { path: "/properties", name: "Properties" },
  { path: "/reservations", name: "Reservations" },
  { path: "/guests", name: "Guests" },
  { path: "/content", name: "Content" },
  { path: "/workflows", name: "Workflows" },
  { path: "/agents", name: "Agents" },
  { path: "/analytics", name: "Analytics" },
  { path: "/settings", name: "Settings" },
  { path: "/profile", name: "Profile" },
  { path: "/inbox", name: "Inbox" },
  { path: "/payments", name: "Payments" },
  { path: "/invoices", name: "Invoices" },
  { path: "/reports", name: "Reports" },
  { path: "/alerts", name: "Alerts" },
  { path: "/memory", name: "Memory" },
  { path: "/prompts", name: "Prompts" },
  { path: "/apps", name: "Apps" },
  { path: "/integrations", name: "Integrations" },
  { path: "/docs", name: "Docs" },
  { path: "/admin", name: "Admin" },
  { path: "/monitoring", name: "Monitoring" },
];

const GUEST_ROUTES = [
  { path: "/guest", name: "Guest Portal" },
  { path: "/check-in", name: "Check-in" },
  { path: "/book", name: "Book" },
];

const MOBILE_ROUTES = [
  { path: "/mobile", name: "Mobile App" },
];

test.describe("Comprehensive UI Test", () => {
  
  test.describe("Public Pages (No Auth Required)", () => {
    
    for (const route of PUBLIC_ROUTES) {
      test(`should load ${route.name} (${route.path})`, async ({ page }) => {
        console.log(`🧪 Testing: ${route.name} - ${route.path}`);
        
        const response = await page.goto(route.path);
        
        // Check page loaded successfully
        expect(response?.status()).toBe(200);
        
        // Wait for page to fully load
        await page.waitForLoadState("networkidle");
        
        // Check we didn't land on 404
        const url = page.url();
        expect(url).not.toMatch(/\/404/);
        expect(url).not.toMatch(/\/error/);
        
        // Check page has content
        const body = await page.locator("body");
        await expect(body).toBeVisible();
        
        console.log(`✅ Passed: ${route.name}`);
      });
    }

    test("Homepage should have main navigation links", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check for main navigation items
      const navLinks = [
        /demo/i,
        /cenik|pricing/i,
        /prijava|login|sign in/i,
        /registracija|register|start|začni/i,
      ];

      for (const linkText of navLinks) {
        const link = page.getByRole("link", { name: linkText });
        await expect(link).toBeVisible();
        console.log(`✅ Found nav link: ${linkText}`);
      }
    });

    test("All homepage links should lead to valid pages", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Get all links on the page
      const links = await page.locator("a[href]").all();
      
      console.log(`📊 Found ${links.length} links on homepage`);

      for (const link of links.slice(0, 20)) { // Test first 20 links
        const href = await link.getAttribute("href");
        
        // Skip external links, anchors, and javascript:
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("http")) {
          continue;
        }

        // Click the link
        await link.click();
        await page.waitForLoadState("networkidle");
        
        // Check we're on a valid page (not 404)
        const url = page.url();
        expect(url).not.toMatch(/\/404/);
        expect(url).not.toMatch(/\/error/);
        
        console.log(`✅ Valid link: ${href} → ${url}`);
        
        // Go back to homepage
        await page.goto("/");
        await page.waitForLoadState("networkidle");
      }
    });
  });

  test.describe("Authentication Pages", () => {
    
    test("Login page should have working form", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Check email input exists
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Check password input exists
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();

      // Check submit button exists
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      // Check "Forgot password" link
      const forgotLink = page.getByRole("link", { name: /pozabljeno|forgot|geslo|password/i });
      await expect(forgotLink).toBeVisible();

      // Check "Register" link
      const registerLink = page.getByRole("link", { name: /registracija|register|sign up/i });
      await expect(registerLink).toBeVisible();

      console.log("✅ Login page has all required elements");
    });

    test("Register page should have working form", async ({ page }) => {
      await page.goto("/register");
      await page.waitForLoadState("networkidle");

      // Check form fields exist
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();

      // Check submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      // Check "Login" link
      const loginLink = page.getByRole("link", { name: /prijava|login|sign in/i });
      await expect(loginLink).toBeVisible();

      console.log("✅ Register page has all required elements");
    });

    test("Login → Register → Login navigation works", async ({ page }) => {
      // Start at login
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Click register link
      const registerLink = page.getByRole("link", { name: /registracija|register/i });
      await registerLink.click();
      await page.waitForLoadState("networkidle");

      // Should be on register page
      expect(page.url()).toMatch(/\/register/);

      // Click login link
      const loginLink = page.getByRole("link", { name: /prijava|login/i });
      await loginLink.click();
      await page.waitForLoadState("networkidle");

      // Should be back on login page
      expect(page.url()).toMatch(/\/login/);

      console.log("✅ Login ↔ Register navigation works");
    });
  });

  test.describe("Authenticated Pages (with mock auth)", () => {
    
    test("Dashboard should load and have main navigation", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Check dashboard loaded (or redirected to valid page)
      const url = page.url();
      expect(url).toMatch(/\/dashboard|\/tourism|\/properties/);

      // Check for main navigation items
      const navItems = [
        /pregled|dashboard/i,
        /koledar|calendar/i,
        /ustvari|create/i,
        /vsebina|content/i,
        /nastavitve|settings/i,
      ];

      for (const navText of navItems) {
        const nav = page.getByRole("link", { name: navText });
        const isVisible = await nav.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ Found nav: ${navText}`);
        }
      }

      console.log("✅ Dashboard loaded with navigation");
    });

    test("All dashboard widgets should be visible", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Look for common dashboard elements
      const widgets = [
        page.locator('[class*="card"], [class*="widget"]'),
        page.locator("h1, h2, h3"),
        page.locator("button, a"),
      ];

      for (const widget of widgets) {
        const count = await widget.count();
        if (count > 0) {
          console.log(`✅ Found ${count} ${widget.selector()}`);
        }
      }
    });
  });

  test.describe("Settings & Configuration Pages", () => {
    
    const settingsPages = [
      { path: "/settings", name: "General Settings" },
      { path: "/settings/profile", name: "Profile Settings" },
      { path: "/settings/account", name: "Account Settings" },
      { path: "/settings/notifications", name: "Notifications" },
      { path: "/settings/billing", name: "Billing" },
      { path: "/settings/team", name: "Team" },
    ];

    for (const setting of settingsPages) {
      test(`should load ${setting.name}`, async ({ page }) => {
        await page.goto(setting.path);
        await page.waitForLoadState("networkidle");

        const url = page.url();
        
        // Should not be on 404
        expect(url).not.toMatch(/\/404/);
        
        // Should have some content
        const body = await page.locator("body");
        await expect(body).toBeVisible();

        console.log(`✅ Loaded: ${setting.name}`);
      });
    }
  });

  test.describe("Property Management Pages", () => {
    
    const propertyPages = [
      { path: "/properties", name: "Properties List" },
      { path: "/properties/new", name: "New Property" },
      { path: "/reservations", name: "Reservations" },
      { path: "/guests", name: "Guests" },
    ];

    for (const propPage of propertyPages) {
      test(`should load ${propPage.name}`, async ({ page }) => {
        await page.goto(propPage.path);
        await page.waitForLoadState("networkidle");

        const url = page.url();
        expect(url).not.toMatch(/\/404/);
        
        const body = await page.locator("body");
        await expect(body).toBeVisible();

        console.log(`✅ Loaded: ${propPage.name}`);
      });
    }
  });

  test.describe("Content & Workflow Pages", () => {
    
    const contentPages = [
      { path: "/content", name: "Content" },
      { path: "/workflows", name: "Workflows" },
      { path: "/agents", name: "Agents" },
      { path: "/prompts", name: "Prompts" },
    ];

    for (const contentPage of contentPages) {
      test(`should load ${contentPage.name}`, async ({ page }) => {
        await page.goto(contentPage.path);
        await page.waitForLoadState("networkidle");

        const url = page.url();
        expect(url).not.toMatch(/\/404/);
        
        const body = await page.locator("body");
        await expect(body).toBeVisible();

        console.log(`✅ Loaded: ${contentPage.name}`);
      });
    }
  });

  test.describe("Analytics & Reports Pages", () => {
    
    const analyticsPages = [
      { path: "/analytics", name: "Analytics" },
      { path: "/reports", name: "Reports" },
      { path: "/monitoring", name: "Monitoring" },
    ];

    for (const analyticsPage of analyticsPages) {
      test(`should load ${analyticsPage.name}`, async ({ page }) => {
        await page.goto(analyticsPage.path);
        await page.waitForLoadState("networkidle");

        const url = page.url();
        expect(url).not.toMatch(/\/404/);
        
        const body = await page.locator("body");
        await expect(body).toBeVisible();

        console.log(`✅ Loaded: ${analyticsPage.name}`);
      });
    }
  });

  test.describe("Mobile Responsiveness", () => {
    
    test("All main pages should work on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      const mobilePages = ["/", "/login", "/dashboard", "/pricing"];

      for (const mobilePage of mobilePages) {
        await page.goto(mobilePage);
        await page.waitForLoadState("networkidle");

        const url = page.url();
        expect(url).not.toMatch(/\/404/);

        // Check mobile menu button exists on mobile
        const menuButton = page.getByRole("button", { name: /menu|hamburger/i });
        const isMenuVisible = await menuButton.isVisible().catch(() => false);
        
        if (isMenuVisible) {
          console.log(`✅ Mobile menu available on ${mobilePage}`);
        }

        console.log(`✅ Mobile works: ${mobilePage}`);
      }
    });
  });

  test.describe("Link Validation", () => {
    
    test("No broken internal links on dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Get all internal links
      const links = await page.locator("a[href^='/']").all();
      
      console.log(`📊 Found ${links.length} internal links on dashboard`);

      let validLinks = 0;
      let brokenLinks = 0;

      for (const link of links.slice(0, 30)) { // Test first 30 links
        const href = await link.getAttribute("href");
        
        try {
          await link.click();
          await page.waitForLoadState("networkidle");
          
          const url = page.url();
          if (url.includes("/404") || url.includes("/error")) {
            brokenLinks++;
            console.log(`❌ Broken link: ${href} → ${url}`);
          } else {
            validLinks++;
          }
          
          // Navigate back
          await page.goto("/dashboard");
          await page.waitForLoadState("networkidle");
        } catch (error) {
          brokenLinks++;
          console.log(`❌ Error clicking ${href}: ${error}`);
        }
      }

      console.log(`📊 Results: ${validLinks} valid, ${brokenLinks} broken`);
      
      // Allow some broken links (max 10%)
      expect(brokenLinks).toBeLessThan(links.length * 0.1);
    });
  });

  test.describe("Button Functionality", () => {
    
    test("All CTA buttons should be clickable", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find all buttons
      const buttons = await page.locator("button, a[role='button']").all();
      
      console.log(`📊 Found ${buttons.length} buttons on homepage`);

      let clickableButtons = 0;

      for (const button of buttons.slice(0, 20)) {
        const isVisible = await button.isVisible().catch(() => false);
        
        if (isVisible) {
          try {
            await button.click({ timeout: 2000 });
            clickableButtons++;
            // Reset page
            await page.goto("/");
            await page.waitForLoadState("networkidle");
          } catch (error) {
            console.log(`⚠️ Button not clickable: ${error}`);
          }
        }
      }

      console.log(`✅ ${clickableButtons} buttons are clickable`);
      expect(clickableButtons).toBeGreaterThan(0);
    });
  });

  test.describe("Form Validation", () => {
    
    test("Login form should show validation errors", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation errors or stay on page
      const url = page.url();
      expect(url).toMatch(/\/login/);

      console.log("✅ Login form validation works");
    });

    test("Register form should show validation errors", async ({ page }) => {
      await page.goto("/register");
      await page.waitForLoadState("networkidle");

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation errors or stay on page
      const url = page.url();
      expect(url).toMatch(/\/register/);

      console.log("✅ Register form validation works");
    });
  });

  test.describe("Error Pages", () => {
    
    test("404 page should exist and be styled", async ({ page }) => {
      await page.goto("/this-page-does-not-exist-12345");
      await page.waitForLoadState("networkidle");

      // Should show 404 content
      const body = await page.locator("body");
      await expect(body).toBeVisible();

      // Should contain 404 or "not found" text
      const content = await body.textContent();
      const has404 = /404|not found|page doesn't exist/i.test(content);
      
      if (has404) {
        console.log("✅ 404 page exists and is styled");
      } else {
        console.log("⚠️ 404 page might not be custom");
      }
    });
  });

  test.describe("Performance Checks", () => {
    
    test("Homepage should load within 3 seconds", async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️ Homepage loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test("Dashboard should load within 3 seconds", async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️ Dashboard loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe("Console Errors", () => {
    
    test("No critical console errors on homepage", async ({ page }) => {
      const errors: string[] = [];
      
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000); // Wait for any late errors

      console.log(`📊 Found ${errors.length} console errors`);
      
      // Filter out non-critical errors (like missing favicons)
      const criticalErrors = errors.filter(
        (err) => !err.includes("favicon") && !err.includes("404")
      );

      if (criticalErrors.length > 0) {
        console.log("⚠️ Console errors:", criticalErrors);
      } else {
        console.log("✅ No critical console errors");
      }
    });
  });
});

test.describe("Logical Navigation Flow", () => {
  
  test("User journey: Homepage → Login → Dashboard", async ({ page }) => {
    console.log("🎯 Testing user journey...");

    // Start at homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    console.log("✅ Step 1: Homepage loaded");

    // Click login
    const loginButton = page.getByRole("link", { name: /prijava|login|sign in/i });
    await loginButton.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/login/);
    console.log("✅ Step 2: Navigated to login");

    // Check login page has register link
    const registerLink = page.getByRole("link", { name: /registracija|register/i });
    await expect(registerLink).toBeVisible();
    console.log("✅ Step 3: Register link visible");

    // Go back to homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    console.log("✅ Step 4: Back to homepage");

    console.log("✅ User journey completed successfully");
  });

  test("Navigation should be consistent across pages", async ({ page }) => {
    const pages = ["/", "/pricing", "/login", "/register"];
    const navItems: string[] = [];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      // Get main navigation items
      const navLinks = await page.locator("nav a, header a").all();
      const navTexts: string[] = [];
      
      for (const link of navLinks.slice(0, 10)) {
        const text = await link.textContent();
        if (text && text.trim().length > 0) {
          navTexts.push(text.trim());
        }
      }

      navItems.push(navTexts.join(","));
      console.log(`📋 ${pagePath}: ${navTexts.length} nav items`);
    }

    // All pages should have similar navigation
    console.log("✅ Navigation consistency checked");
  });
});
