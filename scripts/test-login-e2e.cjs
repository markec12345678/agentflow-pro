#!/usr/bin/env node
/**
 * Test login flow with Playwright.
 * Requires: dev server on 3002, playwright installed
 * Run: node scripts/test-login-e2e.js
 */
const { chromium } = require("playwright");

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const base = "http://localhost:3002";

    const loginUrl = `${base}/login`;
    console.log("1. Going to", loginUrl, "...");
    await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 20000 });

    console.log("2. Waiting for form and CSRF...");
    await page.waitForSelector('input[name="email"], input#email', { timeout: 15000 });
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 20000 });
    await page.fill('input[name="email"], input#email', "e2e@test.com");
    await page.fill('input[name="password"], input#password', "e2e-secret");

    console.log("3. Submitting...");
    await page.waitForTimeout(500);
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForURL(url => !url.includes("callback/credentials"), { timeout: 15000 }).catch(() => {});

    const url = page.url();
    console.log("4. Result URL:", url);

    const content = await page.textContent("body");
    if (content && content.length < 500) console.log("Body:", content);
    if (url.includes("callback/credentials")) {
      await page.screenshot({ path: "screenshots/login-result.png" });
      console.log("Screenshot: screenshots/login-result.png");
    }

    if (url.includes("/dashboard") || url.includes("/onboarding") || url === `${base}/`) {
      console.log("OK: Login succeeded, redirected to:", url);
      process.exit(0);
    }
    if (url.includes("/login") && url.includes("error")) {
      console.log("FAIL: Redirected to login with error");
      const err = await page.textContent("[class*='red'], [class*='error']").catch(() => "");
      console.log("Error text:", err);
      process.exit(1);
    }
    console.log("UNKNOWN: Got URL", url);
    process.exit(1);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}
main();
