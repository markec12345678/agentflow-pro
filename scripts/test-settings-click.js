/**
 * 🚀 Test Settings Click
 */

import { chromium } from "playwright";

async function main() {
  console.log("🧪 Test Settings Click...\n");

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

    // Manual redirect to dashboard
    await page.goto("http://localhost:3002/dashboard", {
      waitUntil: "networkidle",
    });
    await new Promise((r) => setTimeout(r, 3000));

    console.log("✅ On dashboard");
    await page.screenshot({ path: "screenshots/settings-click-1.png" });

    // Click Nastavitve
    console.log("\n🖱️ Clicking Nastavitve...");
    await page.click('a:has-text("Nastavitve")');
    await new Promise((r) => setTimeout(r, 5000));

    console.log("📍 Current URL:", page.url());
    await page.screenshot({ path: "screenshots/settings-click-2.png" });

    // Check for API keys
    const hasFirecrawl = await page
      .locator("text=Firecrawl")
      .isVisible()
      .catch(() => false);
    const hasOpenAI = await page
      .locator("text=OpenAI")
      .isVisible()
      .catch(() => false);

    console.log("📍 Has Firecrawl:", hasFirecrawl);
    console.log("📍 Has OpenAI:", hasOpenAI);

    if (hasFirecrawl || hasOpenAI) {
      console.log("\n✅ SETTINGS PAGE DELUJE! 🎉");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
