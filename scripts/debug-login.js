/**
 * 🚀 Debug Login
 */

import { chromium } from "playwright";

async function main() {
  console.log("🧪 Debug Login...\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Go to login
    await page.goto("http://localhost:3002/login", {
      waitUntil: "networkidle",
    });
    console.log("📍 On login page");

    // Fill and submit
    await page.fill('input[type="email"]', "test@agentflow.com");
    await page.fill('input[type="password"]', "test123");
    console.log("⌨️ Filled credentials");

    await page.click('button[type="submit"]');
    console.log("🖱️ Clicked Sign In");

    // Wait
    await new Promise((r) => setTimeout(r, 5000));

    console.log("📍 Current URL:", page.url());
    console.log("📍 Current Title:", await page.title());

    await page.screenshot({ path: "screenshots/debug-login-1.png" });

    // Check for dashboard elements
    const hasDashboard = await page
      .locator("text=Dashboard, text=Koledar")
      .isVisible()
      .catch(() => false);
    console.log("📍 Has Dashboard sidebar:", hasDashboard);

    // Try manual navigation
    console.log("\n🔄 Trying manual navigation to /dashboard...");
    await page.goto("http://localhost:3002/dashboard", {
      waitUntil: "networkidle",
    });
    await new Promise((r) => setTimeout(r, 3000));

    console.log("📍 New URL:", page.url());
    await page.screenshot({ path: "screenshots/debug-login-2.png" });

    // Check for sidebar
    const hasSidebar = await page
      .locator("text=Nastavitve")
      .isVisible()
      .catch(() => false);
    console.log("📍 Has Sidebar with Nastavitve:", hasSidebar);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
