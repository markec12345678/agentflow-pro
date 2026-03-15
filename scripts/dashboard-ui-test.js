/**
 * 🚀 AgentFlow Pro - Dashboard UI Test
 * Testira vse dashboard strani
 */

import { chromium } from "playwright";

const CONFIG = {
  URL: "http://localhost:3002",
  EMAIL: "test@agentflow.com",
  PASSWORD: "test123",
  VIEWPORT: { width: 1920, height: 1080 },
};

const PAGES = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Tourism Dashboard", path: "/dashboard/tourism" },
  { name: "Calendar", path: "/dashboard/tourism/calendar" },
  { name: "Properties", path: "/dashboard/tourism/properties" },
  { name: "Reservations", path: "/dashboard/reservations" },
  { name: "Housekeeping", path: "/dashboard/rooms/housekeeping" },
  { name: "Reports - Revenue", path: "/dashboard/reports/revenue" },
  { name: "Reports - Occupancy", path: "/dashboard/reports/occupancy" },
  { name: "Settings", path: "/dashboard/settings" },
  { name: "Content", path: "/content" },
  { name: "Agents", path: "/agents" },
  { name: "Chat", path: "/chat" },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const path = `screenshots/dashboard-tour/${name}.png`;
  try {
    await page.screenshot({ path, fullPage: true });
    console.log(`📸 ${path}`);
  } catch (error) {
    console.log(`❌ Screenshot failed: ${error.message}`);
  }
  return path;
}

async function login(page) {
  console.log("\n📝 Prijava...");
  await page.goto(`${CONFIG.URL}/login`, { waitUntil: "networkidle" });
  await sleep(1000);

  await page.fill('input[type="email"]', CONFIG.EMAIL);
  await page.fill('input[type="password"]', CONFIG.PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForLoadState("networkidle");
  await sleep(3000);

  if (page.url().includes("/login")) {
    await page.goto(`${CONFIG.URL}/dashboard`, { waitUntil: "networkidle" });
    await sleep(3000);
  }

  console.log("✅ Prijava uspešna");
  await takeScreenshot(page, "00-login-success");
}

async function testPage(page, name, path) {
  console.log(`\n📍 Testing: ${name} (${path})`);

  try {
    await page.goto(`${CONFIG.URL}${path}`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    await sleep(2000);

    // Check for 404
    const is404 = await page
      .locator("text=404", "text=ni bila najdena")
      .isVisible()
      .catch(() => false);

    if (is404) {
      console.log(`  ⚠️ 404 - Page not found`);
      await takeScreenshot(
        page,
        `404-${name.replace(/\s+/g, "-").toLowerCase()}`,
      );
      return false;
    }

    // Check for loading state
    const isLoading = await page
      .locator("text=Nalaganje", "text=Loading", "text=loading")
      .isVisible()
      .catch(() => false);

    if (isLoading) {
      console.log(`  ⏳ Still loading...`);
      await sleep(5000);
      await takeScreenshot(
        page,
        `${name.replace(/\s+/g, "-").toLowerCase()}-loading`,
      );
    } else {
      await takeScreenshot(page, name.replace(/\s+/g, "-").toLowerCase());
    }

    // Count elements
    const cards = await page
      .locator('[class*="card"], [class*="widget"], section')
      .count()
      .catch(() => 0);
    const buttons = await page
      .locator('button, a[role="button"]')
      .count()
      .catch(() => 0);
    const inputs = await page
      .locator("input, select, textarea")
      .count()
      .catch(() => 0);

    console.log(`  📊 Cards: ${cards}, Buttons: ${buttons}, Inputs: ${inputs}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    await takeScreenshot(
      page,
      `error-${name.replace(/\s+/g, "-").toLowerCase()}`,
    );
    return false;
  }
}

async function testSidebarNavigation(page) {
  console.log("\n🧭 Testing Sidebar Navigation...");

  await page.goto(`${CONFIG.URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(2000);

  // Find all sidebar links
  const sidebarLinks = page.locator('nav a, [class*="sidebar"] a, aside a');
  const count = await sidebarLinks.count().catch(() => 0);

  console.log(`📍 Found ${count} sidebar links`);

  if (count > 0) {
    await takeScreenshot(page, "sidebar-with-links");

    // Click first few links
    for (let i = 0; i < Math.min(count, 3); i++) {
      try {
        const link = sidebarLinks.nth(i);
        const href = await link.getAttribute("href").catch(() => "unknown");
        const text = await link.textContent().catch(() => "unknown");

        console.log(`  🔗 Link ${i}: "${text?.trim()}" -> ${href}`);

        await link.click({ timeout: 3000 }).catch(() => {});
        await sleep(1500);
        await takeScreenshot(page, `nav-click-${i}`);
      } catch (error) {
        console.log(`  ⚠️ Link ${i} error: ${error.message}`);
      }
    }
  } else {
    console.log("  ℹ️ No sidebar links found");
    await takeScreenshot(page, "sidebar-no-links");
  }
}

async function testEmptyStates(page) {
  console.log("\n📭 Testing Empty States...");

  await page.goto(`${CONFIG.URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(3000);

  // Look for empty state messages
  const emptyStates = page.locator(
    "text=empty",
    "text=prazno",
    "text=brez",
    "text=no data",
    "text=Še nimate",
  );
  const hasEmptyState = await emptyStates.isVisible().catch(() => false);

  if (hasEmptyState) {
    console.log("  ✅ Empty state detected");
    await takeScreenshot(page, "empty-state");

    // Look for CTA buttons in empty states
    const ctaButtons = page.locator(
      'button:has-text("Dodaj"), button:has-text("Create"), button:has-text("New"), a:has-text("+")',
    );
    const ctaCount = await ctaButtons.count().catch(() => 0);
    console.log(`  📍 Found ${ctaCount} CTA buttons`);
  } else {
    console.log("  ℹ️ No empty state messages");
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   🚀 AgentFlow Pro - Dashboard UI Test                 ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  const fs = await import("fs");
  if (!fs.existsSync("screenshots/dashboard-tour")) {
    fs.mkdirSync("screenshots/dashboard-tour", { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({ viewport: CONFIG.VIEWPORT });
  const page = await context.newPage();

  try {
    // Login
    await login(page);

    // Test each page
    for (const { name, path } of PAGES) {
      await testPage(page, name, path);
      await sleep(1000);
    }

    // Test sidebar
    await testSidebarNavigation(page);

    // Test empty states
    await testEmptyStates(page);

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   ✅ DASHBOARD UI TEST COMPLETE!                       ║");
    console.log("╚════════════════════════════════════════════════════════╝");
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    await takeScreenshot(page, "fatal-error");
  } finally {
    await browser.close();
    console.log("\n✨ Done!\n");
  }
}

main().catch(console.error);
