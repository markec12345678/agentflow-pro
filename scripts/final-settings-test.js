/**
 * 🚀 Final Settings Test
 */

import { chromium } from "playwright";

async function main() {
  console.log("🧪 Final Settings Test...\n");

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

    console.log("✅ Logged in.");
    await page.screenshot({ path: "screenshots/settings-final-1.png" });

    // Click Nastavitve from sidebar
    console.log("\n🖱️ Clicking Nastavitve from sidebar...");
    const nastavitveLink = page.locator('a:has-text("Nastavitve")').first();
    await nastavitveLink.click();
    await new Promise((r) => setTimeout(r, 5000));
    await page.screenshot({ path: "screenshots/settings-final-2.png" });

    console.log("✅ Current URL:", page.url());

    // Check for API Keys inputs
    const hasFirecrawl = await page
      .locator('input[placeholder*="fc_"], input[name="firecrawl"]')
      .isVisible()
      .catch(() => false);
    const hasOpenAI = await page
      .locator('input[placeholder*="sk-"], input[name="openai"]')
      .isVisible()
      .catch(() => false);

    console.log("📍 Has Firecrawl input:", hasFirecrawl);
    console.log("📍 Has OpenAI input:", hasOpenAI);

    if (hasFirecrawl || hasOpenAI) {
      console.log("\n✅ SETTINGS PAGE WORKS!");
    } else {
      console.log("\n⚠️ Settings page might still be loading...");
      await new Promise((r) => setTimeout(r, 5000));
      await page.screenshot({ path: "screenshots/settings-final-3.png" });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
