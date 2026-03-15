/**
 * 🚀 AgentFlow Pro - Google/Email Login Automation
 *
 * Uporaba:
 *   node scripts/login-automation.js [google|email]
 *
 * Options:
 *   google - Try Google OAuth login
 *   email  - Use test credentials (default)
 */

import { chromium } from "playwright";
import { readFileSync } from "fs";

// Configuration
const CONFIG = {
  URL: "http://localhost:3002",
  TEST_EMAIL: "test@agentflow.com",
  TEST_PASSWORD: "test123",
  GOOGLE_EMAIL: process.env.GOOGLE_EMAIL || "agentflowtest100@gmail.com",
  GOOGLE_PASSWORD: process.env.GOOGLE_PASSWORD || "AgentFlow123!",
  VIEWPORT: { width: 1920, height: 1080 },
  TIMEOUT: 30000,
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const path = `screenshots/${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 Screenshot: ${path}`);
  return path;
}

async function loginWithCredentials(page) {
  console.log("\n📝 Prijava s testnimi kredenciali...");

  // Navigate to login
  console.log("📍 Navigating to login page...");
  await page.goto(`${CONFIG.URL}/login`, {
    waitUntil: "networkidle",
    timeout: CONFIG.TIMEOUT,
  });
  await takeScreenshot(page, "01-login-page");

  // Fill email
  console.log("⌨️ Filling email...");
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible" });
  await emailInput.fill(CONFIG.TEST_EMAIL);
  await takeScreenshot(page, "02-email-entered");

  // Fill password
  console.log("⌨️ Filling password...");
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: "visible" });
  await passwordInput.fill(CONFIG.TEST_PASSWORD);
  await takeScreenshot(page, "03-password-entered");

  // Click sign in
  console.log("🖱️ Clicking Sign In...");
  const signInButton = page.locator('button[type="submit"]').first();
  await signInButton.click();

  // Wait for authentication
  console.log("⏳ Waiting for authentication...");
  await page.waitForLoadState("networkidle");
  await sleep(2000);
  await takeScreenshot(page, "04-after-login");

  // Check result
  let currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);

  // If still on login, try manual redirect
  if (currentUrl.includes("/login")) {
    console.log("🔄 Attempting manual redirect to dashboard...");
    await page.goto(`${CONFIG.URL}/dashboard`, {
      waitUntil: "networkidle",
      timeout: CONFIG.TIMEOUT,
    });
    await sleep(3000);
    await takeScreenshot(page, "05-dashboard");
    currentUrl = page.url();
  }

  // Verify we're on dashboard
  if (currentUrl.includes("/dashboard")) {
    console.log("✅ Prijava uspešna! Dashboard dosežen.");
    return true;
  } else {
    console.log("❌ Prijava ni uspela.");
    return false;
  }
}

async function loginWithGoogle(page) {
  console.log("\n🔵 Prijava z Google OAuth...");

  // Navigate to login
  console.log("📍 Navigating to login page...");
  await page.goto(`${CONFIG.URL}/login`, {
    waitUntil: "networkidle",
    timeout: CONFIG.TIMEOUT,
  });
  await takeScreenshot(page, "01-login-page");

  // Click Google button
  console.log("🖱️ Clicking Google Sign In...");
  const googleButton = page
    .locator('button:has-text("Sign in with Google")')
    .first();

  try {
    await googleButton.waitFor({ state: "visible", timeout: 10000 });
    await googleButton.click();

    // Wait for popup or redirect
    const popupPromise = page
      .waitForEvent("popup", { timeout: 5000 })
      .catch(() => null);
    await sleep(1000);

    const popup = await popupPromise;

    if (popup) {
      console.log("✅ Google popup opened");
      await handleGooglePopup(popup);
    } else {
      console.log("ℹ️ No popup - checking same-window redirect");
      const currentUrl = page.url();
      if (currentUrl.includes("accounts.google.com")) {
        await handleGoogleLogin(page);
      } else {
        console.log("❌ Google login did not open");
        await takeScreenshot(page, "error-google");
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Google login error:", error.message);
    await takeScreenshot(page, "error-google");
    return false;
  }
}

async function handleGooglePopup(popup) {
  try {
    await popup.waitForLoadState("networkidle");
    await takeScreenshot(popup, "02-google-popup");

    console.log("📍 Google URL:", popup.url());

    // Fill email
    const emailInput = popup
      .locator('input[type="email"], input[name="identifier"]')
      .first();
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(CONFIG.GOOGLE_EMAIL);
    await takeScreenshot(popup, "03-google-email");

    // Click Next
    const nextButton = popup
      .locator('button:has-text("Next"), input[type="button"][value="Next"]')
      .first();
    await nextButton.click();
    await popup.waitForLoadState("networkidle");
    await takeScreenshot(popup, "04-google-password");

    // Fill password
    const passwordInput = popup.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(CONFIG.GOOGLE_PASSWORD);
    await takeScreenshot(popup, "05-google-password-entered");

    // Click Sign In
    const signInButton = popup
      .locator('button:has-text("Next"), button:has-text("Sign in")')
      .first();
    await signInButton.click();

    // Wait for authentication
    console.log("⏳ Waiting for Google authentication...");
    await popup.waitForLoadState("networkidle", { timeout: 20000 });
    await takeScreenshot(popup, "06-google-authenticating");

    // Close popup
    await popup.close();
    console.log("✅ Popup closed");
  } catch (error) {
    console.error("❌ Google popup error:", error.message);
    await takeScreenshot(popup, "error-google-popup");
    throw error;
  }
}

async function handleGoogleLogin(page) {
  console.log("🔵 Handling Google login in same window...");

  try {
    await takeScreenshot(page, "02-google-login");

    // Fill email
    const emailInput = page
      .locator('input[type="email"], input[name="identifier"]')
      .first();
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(CONFIG.GOOGLE_EMAIL);
    await takeScreenshot(page, "03-google-email");

    // Click Next
    const nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();
    await page.waitForLoadState("networkidle");
    await takeScreenshot(page, "04-google-password");

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(CONFIG.GOOGLE_PASSWORD);
    await takeScreenshot(page, "05-google-password-entered");

    // Click Sign In
    const signInButton = page
      .locator('button:has-text("Next"), button:has-text("Sign in")')
      .first();
    await signInButton.click();

    // Wait for authentication
    console.log("⏳ Waiting for Google authentication...");
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await takeScreenshot(page, "06-google-authenticating");
  } catch (error) {
    console.error("❌ Google login error:", error.message);
    await takeScreenshot(page, "error-google-login");
    throw error;
  }
}

async function main() {
  const loginMethod = process.argv[2] || "email";

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   🚀 AgentFlow Pro - Login Automation                  ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log(`\n📋 Login method: ${loginMethod}`);
  console.log(`🌐 Target URL: ${CONFIG.URL}`);

  // Launch browser
  console.log("\n🌐 Launching browser...");
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport: CONFIG.VIEWPORT,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    let success = false;

    if (loginMethod === "google") {
      success = await loginWithGoogle(page);
    } else {
      success = await loginWithCredentials(page);
    }

    if (success) {
      console.log(
        "\n╔════════════════════════════════════════════════════════╗",
      );
      console.log("║   ✅ LOGIN SUCCESSFUL!                                 ║");
      console.log("╚════════════════════════════════════════════════════════╝");

      // Wait a moment so user can see the dashboard
      console.log("⏳ Waiting 5 seconds before closing...");
      await sleep(5000);
    } else {
      console.log(
        "\n╔════════════════════════════════════════════════════════╗",
      );
      console.log("║   ❌ LOGIN FAILED                                      ║");
      console.log("╚════════════════════════════════════════════════════════╝");
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    await takeScreenshot(page, "fatal-error");
  } finally {
    await browser.close();
    console.log("\n✨ Browser closed. Done!\n");
  }
}

// Run
main().catch(console.error);
