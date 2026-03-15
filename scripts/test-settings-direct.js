/**
 * 🚀 Test Settings Direct URL
 */

import { chromium } from "playwright";

async function main() {
  console.log("🧪 Test Settings Direct URL...\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Login and go to dashboard
    await page.goto("http://localhost:3002/login", {
      waitUntil: "networkidle",
    });
    await page.fill('input[type="email"]', "test@agentflow.com");
    await page.fill('input[type="password"]', "test123");
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await new Promise((r) => setTimeout(r, 3000));

    // Go directly to settings/api-keys
    console.log("📍 Going directly to /settings/api-keys...");
    await page.goto("http://localhost:3002/settings/api-keys", {
      waitUntil: "networkidle",
    });
    await new Promise((r) => setTimeout(r, 5000));

    console.log("📍 Current URL:", page.url());
    await page.screenshot({ path: "screenshots/settings-direct.png" });

    // Check for API keys
    const hasFirecrawl = await page
      .locator("text=Firecrawl")
      .isVisible()
      .catch(() => false);
    const hasOpenAI = await page
      .locator("text=OpenAI")
      .isVisible()
      .catch(() => false);
    const hasSaveButton = await page
      .locator('button:has-text("Save"), text=Shrani')
      .isVisible()
      .catch(() => false);

    console.log("📍 Has Firecrawl:", hasFirecrawl);
    console.log("📍 Has OpenAI:", hasOpenAI);
    console.log("📍 Has Save button:", hasSaveButton);

    if (hasFirecrawl || hasOpenAI || hasSaveButton) {
      console.log("\n✅ SETTINGS PAGE DELUJE! 🎉");
    } else {
      console.log("\n⚠️ Settings page might still be loading or empty...");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
