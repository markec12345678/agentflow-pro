/**
 * 🚀 AgentFlow Pro - Full UI Test Tour
 *
 * Obišče vse strani in naredi screenshot-e
 */

import { chromium } from "playwright";

const CONFIG = {
  URL: "http://localhost:3002",
  EMAIL: "test@agentflow.com",
  PASSWORD: "test123",
  VIEWPORT: { width: 1920, height: 1080 },
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const path = `screenshots/tour/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 ${path}`);
  return path;
}

async function login(page) {
  console.log("\n📝 Prijava...");
  await page.goto(`${CONFIG.URL}/login`, { waitUntil: "networkidle" });

  await page.fill('input[type="email"]', CONFIG.EMAIL);
  await page.fill('input[type="password"]', CONFIG.PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForLoadState("networkidle");
  await sleep(2000);

  // Manual redirect if needed
  if (page.url().includes("/login")) {
    await page.goto(`${CONFIG.URL}/dashboard`, { waitUntil: "networkidle" });
    await sleep(3000);
  }

  console.log("✅ Prijava uspešna");
  await takeScreenshot(page, "00-dashboard");
}

async function testDashboard(page) {
  console.log("\n📊 Testiram Dashboard...");
  await page.goto(`${CONFIG.URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(3000);
  await takeScreenshot(page, "01-dashboard");

  // Check what widgets are visible
  const widgets = await page
    .locator('div[class*="widget"], div[class*="card"], section')
    .all();
  console.log(`📍 Najdenih widgetov: ${widgets.length}`);
}

async function testKoledar(page) {
  console.log("\n📅 Testiram Koledar...");
  await page.goto(`${CONFIG.URL}/koledar`, { waitUntil: "networkidle" });
  await sleep(2000);
  await takeScreenshot(page, "02-koledar");

  // Look for calendar grid
  const calendarGrid = page.locator('[class*="calendar"], [class*="grid"]');
  const isVisible = await calendarGrid.isVisible().catch(() => false);
  console.log(`📍 Koledar prikazan: ${isVisible}`);
}

async function testGosti(page) {
  console.log("\n👥 Testiram Gosti...");
  await page.goto(`${CONFIG.URL}/gosti`, { waitUntil: "networkidle" });
  await sleep(2000);
  await takeScreenshot(page, "03-gosti");

  // Look for guest list or table
  const table = page.locator('table, [class*="list"]');
  const isVisible = await table.isVisible().catch(() => false);
  console.log(`📍 Seznam gostov prikazan: ${isVisible}`);
}

async function testHousekeeping(page) {
  console.log("\n🧹 Testiram Housekeeping...");
  await page.goto(`${CONFIG.URL}/housekeeping`, { waitUntil: "networkidle" });
  await sleep(2000);
  await takeScreenshot(page, "04-housekeeping");

  // Look for room status
  const rooms = page.locator('[class*="room"], [class*="task"]');
  const count = await rooms.count().catch(() => 0);
  console.log(`📍 Najdenih sob/nalog: ${count}`);
}

async function testPorocila(page) {
  console.log("\n📈 Testiram Poročila...");
  await page.goto(`${CONFIG.URL}/porocila`, { waitUntil: "networkidle" });
  await sleep(2000);
  await takeScreenshot(page, "05-porocila");

  // Look for charts or reports
  const charts = page.locator('[class*="chart"], [class*="graph"], svg');
  const count = await charts.count().catch(() => 0);
  console.log(`📍 Najdenih grafikonov: ${count}`);
}

async function testNastavitve(page) {
  console.log("\n⚙️ Testiram Nastavitve...");
  await page.goto(`${CONFIG.URL}/nastavitve`, { waitUntil: "networkidle" });
  await sleep(2000);
  await takeScreenshot(page, "06-nastavitve");

  // Look for settings sections
  const sections = page.locator(
    'section, [class*="settings"], [class*="card"]',
  );
  const count = await sections.count().catch(() => 0);
  console.log(`📍 Najdenih sekcij: ${count}`);
}

async function testInteractiveElements(page) {
  console.log("\n🖱️ Testiram interaktivne elemente...");

  // Go to dashboard
  await page.goto(`${CONFIG.URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(2000);

  // Find all buttons
  const buttons = await page.locator('button, a[role="button"]').all();
  console.log(`📍 Najdenih gumbov: ${buttons.length}`);

  // Try clicking first few buttons (safe ones)
  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    try {
      const btn = buttons[i];
      const text = await btn.textContent().catch(() => "unknown");
      console.log(`  🔘 Gumb ${i}: "${text?.trim()}"`);

      // Scroll into view and click
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 3000 }).catch(() => {});
      await sleep(500);

      // Screenshot after click
      await takeScreenshot(
        page,
        `click-${i}-${text?.trim().substring(0, 10) || "btn"}`,
      );
    } catch (error) {
      console.log(`  ⚠️ Gumb ${i} napaka: ${error.message}`);
    }
  }
}

async function testForms(page) {
  console.log("\n📝 Testiram forme...");

  // Try to find any "Add" or "New" buttons
  const addButtons = page.locator(
    'button:has-text("Dodaj"), button:has-text("New"), button:has-text("Add"), a:has-text("+")',
  );
  const count = await addButtons.count().catch(() => 0);
  console.log(`📍 Najdenih "Add" gumbov: ${count}`);

  if (count > 0) {
    try {
      await addButtons.first().click({ timeout: 3000 });
      await sleep(2000);
      await takeScreenshot(page, "form-modal");
      console.log("✅ Form modal odprt");
    } catch (error) {
      console.log("ℹ️ Ni form modalov ali napaka");
    }
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   🚀 AgentFlow Pro - Full UI Test Tour                 ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  // Create screenshots directory
  const fs = await import("fs");
  if (!fs.existsSync("screenshots/tour")) {
    fs.mkdirSync("screenshots/tour");
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
    await testDashboard(page);
    await testKoledar(page);
    await testGosti(page);
    await testHousekeeping(page);
    await testPorocila(page);
    await testNastavitve(page);

    // Test interactive elements
    await testInteractiveElements(page);
    await testForms(page);

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   ✅ UI TOUR COMPLETE!                                 ║");
    console.log("╚════════════════════════════════════════════════════════╝");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    await takeScreenshot(page, "error");
  } finally {
    await browser.close();
    console.log("\n✨ Done!\n");
  }
}

main().catch(console.error);
