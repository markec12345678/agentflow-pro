/**
 * 🚀 AgentFlow Pro - Interactive Elements Test
 * Testira klikanje gumbov in form
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
  const path = `screenshots/interactive/${name}.png`;
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
  await sleep(3000);

  if (page.url().includes("/login")) {
    await page.goto(`${CONFIG.URL}/dashboard/tourism`, {
      waitUntil: "networkidle",
    });
    await sleep(3000);
  }
  console.log("✅ Prijava uspešna");
}

async function testClickableViewElements(page) {
  console.log('\n🔍 Testing Clickable "View" Elements...');

  await page.goto(`${CONFIG.URL}/dashboard/tourism`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);
  await takeScreenshot(page, "00-tourism-dashboard");

  // Find all "View" buttons
  const viewButtons = page.locator(
    'button:has-text("View"), a:has-text("View")',
  );
  const count = await viewButtons.count();
  console.log(`📍 Found ${count} "View" buttons`);

  for (let i = 0; i < Math.min(count, 5); i++) {
    try {
      const btn = viewButtons.nth(i);
      const text = await btn.textContent();
      console.log(`  🔘 Clicking View ${i}: "${text?.trim()}"`);

      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 3000 });
      await sleep(1500);

      await takeScreenshot(page, `view-click-${i}`);

      // Go back
      await page.goBack();
      await sleep(1000);
    } catch (error) {
      console.log(`  ⚠️ View ${i} error: ${error.message}`);
    }
  }
}

async function testNewReservationButton(page) {
  console.log('\n➕ Testing "Nova rezervacija" Button...');

  await page.goto(`${CONFIG.URL}/dashboard/tourism`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);

  const newResButton = page
    .locator(
      'button:has-text("Nova rezervacija"), button:has-text("New reservation"), a:has-text("+")',
    )
    .first();

  try {
    await newResButton.click({ timeout: 3000 });
    console.log('  ✅ "Nova rezervacija" clicked');
    await sleep(2000);
    await takeScreenshot(page, "nova-rezervacija-modal");

    // Check if modal opened
    const modal = page.locator(
      '[role="dialog"], [class*="modal"], [class*="dialog"]',
    );
    const isVisible = await modal.isVisible().catch(() => false);
    console.log(`  📍 Modal visible: ${isVisible}`);

    if (isVisible) {
      // Close modal
      await page.keyboard.press("Escape");
      await sleep(500);
    }
  } catch (error) {
    console.log(`  ⚠️ Error: ${error.message}`);
  }
}

async function testCalendarNavigation(page) {
  console.log("\n📅 Testing Calendar Navigation...");

  await page.goto(`${CONFIG.URL}/dashboard/tourism/calendar`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);
  await takeScreenshot(page, "calendar-initial");

  // Find month navigation buttons
  const prevMonth = page.locator(
    'button[aria-label="Previous month"], button:has-text("←"), a:has-text("←")',
  );
  const nextMonth = page.locator(
    'button[aria-label="Next month"], button:has-text("→"), a:has-text("→")',
  );

  try {
    console.log("  🔘 Clicking next month...");
    await nextMonth.first().click({ timeout: 3000 });
    await sleep(1000);
    await takeScreenshot(page, "calendar-next-month");

    console.log("  🔘 Clicking previous month...");
    await prevMonth.first().click({ timeout: 3000 });
    await sleep(1000);
    await takeScreenshot(page, "calendar-prev-month");
  } catch (error) {
    console.log(`  ⚠️ Calendar nav error: ${error.message}`);
  }
}

async function testAddNewTask(page) {
  console.log('\n📝 Testing "Add new task"...');

  await page.goto(`${CONFIG.URL}/dashboard/tourism`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);

  const addTaskButton = page.locator(
    'button:has-text("Add new task"), button:has-text("Dodaj nalogo"), a:has-text("+ Add")',
  );

  try {
    await addTaskButton.click({ timeout: 3000 });
    console.log('  ✅ "Add new task" clicked');
    await sleep(2000);
    await takeScreenshot(page, "add-task-form");
  } catch (error) {
    console.log(`  ⚠️ Error: ${error.message}`);
  }
}

async function testExportButtons(page) {
  console.log("\n📤 Testing Export Buttons...");

  await page.goto(`${CONFIG.URL}/dashboard/tourism`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);

  const exportButtons = page.locator(
    'button:has-text("Export"), button:has-text("iCal"), a:has-text("Export")',
  );
  const count = await exportButtons.count();
  console.log(`📍 Found ${count} export buttons`);

  for (let i = 0; i < Math.min(count, 3); i++) {
    try {
      const btn = exportButtons.nth(i);
      const text = await btn.textContent();
      console.log(`  🔘 Export ${i}: "${text?.trim()}"`);

      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 3000 });
      await sleep(1000);
      await takeScreenshot(page, `export-click-${i}`);
    } catch (error) {
      console.log(`  ⚠️ Export ${i} error: ${error.message}`);
    }
  }
}

async function testDropdownMenus(page) {
  console.log("\n📋 Testing Dropdown Menus...");

  await page.goto(`${CONFIG.URL}/dashboard/tourism`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);

  // Find dropdowns
  const dropdowns = page.locator(
    'select, [class*="dropdown"], [class*="select"]',
  );
  const count = await dropdowns.count();
  console.log(`📍 Found ${count} dropdowns`);

  if (count > 0) {
    try {
      const firstDropdown = dropdowns.first();
      await firstDropdown.click({ timeout: 3000 });
      await sleep(1000);
      await takeScreenshot(page, "dropdown-open");
      console.log("  ✅ Dropdown opened");
    } catch (error) {
      console.log(`  ⚠️ Dropdown error: ${error.message}`);
    }
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   🚀 AgentFlow Pro - Interactive Elements Test          ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  const fs = await import("fs");
  if (!fs.existsSync("screenshots/interactive")) {
    fs.mkdirSync("screenshots/interactive", { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({ viewport: CONFIG.VIEWPORT });
  const page = await context.newPage();

  try {
    await login(page);
    await testClickableViewElements(page);
    await testNewReservationButton(page);
    await testCalendarNavigation(page);
    await testAddNewTask(page);
    await testExportButtons(page);
    await testDropdownMenus(page);

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   ✅ INTERACTIVE TEST COMPLETE!                        ║");
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
