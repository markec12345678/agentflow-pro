/**
 * 🚀 Quick Settings Test
 */

import { chromium } from "playwright";

async function main() {
  console.log("🧪 Quick Settings Test...\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Login
    console.log("📝 Logging in...");
    await page.goto("http://localhost:3002/login", {
      waitUntil: "networkidle",
    });
    await page.fill('input[type="email"]', "test@agentflow.com");
    await page.fill('input[type="password"]', "test123");
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await new Promise((r) => setTimeout(r, 3000));

    console.log("✅ Logged in. URL:", page.url());
    await page.screenshot({ path: "screenshots/settings-quick-test-1.png" });

    // Go to /dashboard/settings
    console.log("\n📍 Going to /dashboard/settings...");
    await page.goto("http://localhost:3002/dashboard/settings", {
      waitUntil: "domcontentloaded",
    });
    await new Promise((r) => setTimeout(r, 5000));
    await page.screenshot({ path: "screenshots/settings-quick-test-2.png" });

    console.log("✅ Current URL:", page.url());

    // Check for API keys section
    const hasAPIKeys = await page
      .locator("text=API Keys, text=OpenAI")
      .isVisible()
      .catch(() => false);
    console.log("📍 Has API Keys:", hasAPIKeys);

    // Check for loading spinner
    const isLoading = await page
      .locator("animate-spin, text=Loading")
      .isVisible()
      .catch(() => false);
    console.log("📍 Is Loading:", isLoading);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
