import { chromium } from "playwright";

(async () => {
  console.log("🚀 Starting Credentials Login (Test User)...");

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // STEP 1: Navigate to login page
  console.log("📍 Navigating to login page...");
  await page.goto("http://localhost:3002/login", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.screenshot({ path: "screenshots/01-login-page.png" });
  console.log("📸 Login page screenshot taken");

  // STEP 2: Fill email
  console.log("🔍 Looking for email input...");
  const emailInput = page
    .locator('input[type="email"], input[name="email"]')
    .first();
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  console.log("✅ Email input found");

  const TEST_EMAIL = "test@agentflow.com";
  console.log(`⌨️ Typing email: ${TEST_EMAIL}`);
  await emailInput.fill(TEST_EMAIL);
  await page.screenshot({ path: "screenshots/02-email-entered.png" });

  // STEP 3: Fill password
  console.log("🔍 Looking for password input...");
  const passwordInput = page
    .locator('input[type="password"], input[name="password"]')
    .first();
  await passwordInput.waitFor({ state: "visible", timeout: 10000 });
  console.log("✅ Password input found");

  const TEST_PASSWORD = "test123";
  console.log("⌨️ Typing password...");
  await passwordInput.fill(TEST_PASSWORD);
  await page.screenshot({ path: "screenshots/03-password-entered.png" });

  // STEP 4: Click Sign In
  console.log("🖱️ Clicking Sign In button...");
  const signInButton = page
    .locator(
      'button[type="submit"], button:has-text("Sign in"), button:has-text("Prijava")',
    )
    .first();
  await signInButton.click();

  // STEP 5: Wait for redirect
  console.log("⏳ Waiting for authentication and redirect...");

  try {
    // Wait for network idle first (NextAuth makes API call)
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    console.log("📡 Network idle detected");

    // Small delay for NextAuth to process
    await page.waitForTimeout(2000);

    // Take screenshot to see state
    await page.screenshot({ path: "screenshots/04-after-click.png" });

    // Check current URL
    let finalUrl = page.url();
    console.log(`📍 URL after network idle: ${finalUrl}`);

    // If still on login, check for error
    if (finalUrl.includes("/login")) {
      // Check for error message
      const errorDiv = page
        .locator('.bg-red-50, [role="alert"], .text-red-600')
        .first();
      const hasError = await errorDiv.isVisible().catch(() => false);

      if (hasError) {
        const errorMessage = await errorDiv.textContent();
        console.error("❌ Login error:", errorMessage);
      } else {
        console.log("ℹ️ No error message visible - might be redirect issue");
      }

      // Try waiting a bit more for redirect
      console.log("⏳ Waiting additional 5 seconds for redirect...");
      await page.waitForTimeout(5000);

      finalUrl = page.url();
      console.log(`📍 Final URL after wait: ${finalUrl}`);

      if (finalUrl.includes("/login")) {
        console.log("⚠️ Still on login page after additional wait");
        await page.screenshot({ path: "screenshots/05-still-on-login.png" });
      }
    }

    // Check if successfully logged in
    if (
      finalUrl.includes("/dashboard") ||
      finalUrl.includes("/pregled") ||
      finalUrl.includes("/overview")
    ) {
      console.log("✅ Successfully logged in and redirected to dashboard!");
      await page.screenshot({ path: "screenshots/05-dashboard.png" });
    } else {
      // Try manual redirect to dashboard
      console.log("🔄 Attempting manual redirect to dashboard...");
      await page.goto("http://localhost:3002/dashboard", {
        waitUntil: "networkidle",
        timeout: 10000,
      });
      await page.screenshot({ path: "screenshots/05-manual-dashboard.png" });

      const manualUrl = page.url();
      if (manualUrl.includes("/dashboard") || manualUrl.includes("/login")) {
        console.log(`📍 Manual redirect result: ${manualUrl}`);
        if (manualUrl.includes("/dashboard")) {
          console.log("✅ Dashboard accessible!");
        } else {
          console.log("⚠️ Redirected back to login - auth not persisted");
        }
      }
    }
  } catch (error) {
    console.error("❌ Error waiting for redirect:", error.message);
    await page.screenshot({ path: "screenshots/error-redirect.png" });
  }

  console.log("✨ Done!");
  await browser.close();
})();
