import { chromium } from "playwright";

(async () => {
  console.log("🚀 Starting Google Login...");

  // Launch browser
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Navigate to login page
  console.log("📍 Navigating to login page...");
  await page.goto("http://localhost:3002/login", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Take screenshot of login page
  await page.screenshot({ path: "screenshots/01-login-page.png" });
  console.log("📸 Login page screenshot taken");

  // Wait for Google button to be visible
  console.log("🔍 Looking for Google Sign In button...");
  const googleButton = page
    .locator(
      'button:has-text("Sign in with Google"), button:has-text("Google"), a:has-text("Google")',
    )
    .first();

  try {
    await googleButton.waitFor({ state: "visible", timeout: 10000 });
    console.log("✅ Google button found");

    // Click Google button
    console.log("🖱️ Clicking Google Sign In button...");

    // Wait for either popup OR navigation
    const popupPromise = page
      .waitForEvent("popup", { timeout: 5000 })
      .catch(() => null);
    const navigationPromise = page
      .waitForNavigation({ waitUntil: "networkidle", timeout: 5000 })
      .catch(() => null);

    await googleButton.click();

    console.log("⏳ Waiting for Google login...");
    const popup = await popupPromise;

    if (popup) {
      console.log("✅ Google popup opened");
      await handleGoogleLogin(popup);
    } else {
      console.log("ℹ️ No popup - checking if redirected...");
      await page.screenshot({ path: "screenshots/02-after-click.png" });

      // Check if we're on Google accounts URL
      const currentUrl = page.url();
      if (currentUrl.includes("accounts.google.com")) {
        console.log("✅ Redirected to Google on same page");
        await handleGoogleLogin(page);
      } else {
        console.log("❌ Not on Google login page");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    await page.screenshot({ path: "screenshots/error.png" });
  }

  console.log("✨ Done!");
  await browser.close();
})();

async function handleGoogleLogin(popup) {
  try {
    // Wait for Google login page to load
    await popup.waitForLoadState("networkidle");
    await popup.screenshot({ path: "screenshots/02-google-login.png" });
    console.log("📸 Google login screenshot taken");

    const url = popup.url();
    console.log(`📍 Current URL: ${url}`);

    // Look for email input
    const emailInput = popup
      .locator(
        'input[type="email"], input[name="email"], input[name="identifier"], input[id="identifierId"]',
      )
      .first();

    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("✅ Email input found");

    // TYPE USER EMAIL
    const USER_EMAIL = "agentflowtest100@gmail.com";
    console.log(`⌨️ Typing email: ${USER_EMAIL}`);
    await emailInput.fill(USER_EMAIL);
    await popup.screenshot({ path: "screenshots/03-email-entered.png" });

    // Click Next
    const nextButton = popup
      .locator('button:has-text("Next"), input[type="button"][value="Next"]')
      .first();
    await nextButton.click();
    console.log("🖱️ Clicked Next button");

    // Wait for password field
    await popup.waitForLoadState("networkidle");
    await popup.screenshot({ path: "screenshots/04-password-page.png" });

    // Look for password input
    const passwordInput = popup.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("✅ Password input found");

    // TYPE PASSWORD
    const USER_PASSWORD = "AgentFlow123!";
    console.log("⌨️ Typing password...");
    await passwordInput.fill(USER_PASSWORD);
    await popup.screenshot({ path: "screenshots/05-password-entered.png" });

    // Click Next/Sign In
    const signInButton = popup
      .locator('button:has-text("Next"), button:has-text("Sign in")')
      .first();
    await signInButton.click();
    console.log("🖱️ Clicked Sign In button");

    // Wait for authentication
    console.log("⏳ Waiting for authentication...");
    await popup.waitForLoadState("networkidle", { timeout: 15000 });
    await popup.screenshot({ path: "screenshots/06-authenticating.png" });

    // Check if login was successful
    const finalUrl = popup.url();
    console.log(`📍 Final URL: ${finalUrl}`);

    // If still on accounts.google.com, there might be 2FA
    if (finalUrl.includes("accounts.google.com")) {
      console.log(
        "⚠️ Still on Google - might need 2FA or additional verification",
      );
      console.log("📸 Taking final screenshot for manual review...");
      await popup.screenshot({ path: "screenshots/07-needs-verification.png" });
    } else {
      console.log("✅ Login successful!");
    }
  } catch (error) {
    console.error("❌ Error during Google login:", error.message);
    await popup.screenshot({ path: "screenshots/error-login.png" });
    throw error;
  }
}
