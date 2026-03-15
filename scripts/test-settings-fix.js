/**
 * 🚀 Test Settings Page Fix
 */

import { chromium } from "playwright";

async function main() {
  console.log("🧪 Testing Settings Page Fix...\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Test 1: Direct /settings access (should redirect to login)
    console.log("📍 Test 1: Direct /settings access...");
    await page.goto("http://localhost:3002/settings", {
      waitUntil: "networkidle",
    });
    await page.screenshot({ path: "screenshots/settings-test-1.png" });

    const isOnLogin = page.url().includes("/login");
    console.log(
      `  ${isOnLogin ? "✅" : "❌"} Redirected to login: ${page.url()}`,
    );

    // Test 2: Login and access /settings
    console.log("\n📝 Logging in...");
    await page.goto("http://localhost:3002/login", {
      waitUntil: "networkidle",
    });
    await page.fill('input[type="email"]', "test@agentflow.com");
    await page.fill('input[type="password"]', "test123");
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await new Promise((r) => setTimeout(r, 3000));

    console.log("\n📍 Test 2: Access /settings after login...");
    await page.goto("http://localhost:3002/settings", {
      waitUntil: "networkidle",
    });
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: "screenshots/settings-test-2.png" });

    const isOnSettings = page.url().includes("/settings");
    const hasAPIKeys = await page
      .locator("text=API Keys, text=OpenAI, text=Firecrawl")
      .isVisible()
      .catch(() => false);

    console.log(
      `  ${isOnSettings ? "✅" : "❌"} On settings page: ${page.url()}`,
    );
    console.log(`  ${hasAPIKeys ? "✅" : "❌"} Settings content visible`);

    // Test 3: /dashboard/settings
    console.log("\n📍 Test 3: Access /dashboard/settings...");
    await page.goto("http://localhost:3002/dashboard/settings", {
      waitUntil: "networkidle",
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: "screenshots/settings-test-3.png" });

    const dashboardSettingsUrl = page.url();
    console.log(`  📍 URL: ${dashboardSettingsUrl}`);

    console.log("\n✅ Settings page tests complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    await page.screenshot({ path: "screenshots/settings-test-error.png" });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
