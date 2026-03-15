import { chromium } from "playwright";

async function openExtensions() {
  console.log("🚀 Opening Chrome extensions page...");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
  });

  const page = await browser.newPage();
  await page.goto("chrome://extensions/");

  console.log("✅ Chrome extensions page opened!");
  console.log("📍 URL:", page.url());

  // Wait for user to see the page
  await page.waitForTimeout(5000);

  await browser.close();
  console.log("✅ Browser closed");
}

openExtensions().catch(console.error);
