import { chromium } from "playwright";

(async () => {
  console.log("🚀 Starting Direct Google Login...");

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // STEP 1: Navigate directly to Google OAuth
  console.log("📍 Navigating to Google OAuth...");
  const googleOAuthUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id:
        "114548306327-trc6nj5ma38gn1t8jnhnr7bih21a7v04.apps.googleusercontent.com",
      redirect_uri: "http://localhost:3002/api/auth/callback/google",
      response_type: "code",
      scope: "openid email profile",
      state: "test-state-123",
    }).toString();

  await page.goto(googleOAuthUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({ path: "screenshots/01-google-oauth.png" });
  console.log("📸 Google OAuth page screenshot taken");
  console.log(`📍 Current URL: ${page.url()}`);

  // STEP 2: Find and fill email
  console.log("🔍 Looking for email input...");
  const emailInput = page
    .locator(
      'input[type="email"], input[name="email"], input[name="identifier"], input[id="identifierId"]',
    )
    .first();

  try {
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("✅ Email input found");

    const USER_EMAIL = "agentflowtest100@gmail.com";
    console.log(`⌨️ Typing email: ${USER_EMAIL}`);
    await emailInput.fill(USER_EMAIL);
    await page.screenshot({ path: "screenshots/02-email-entered.png" });

    // Click Next
    console.log("🖱️ Clicking Next button...");
    const nextButton = page
      .locator('button:has-text("Next"), input[type="button"][value="Next"]')
      .first();
    await nextButton.click();

    // Wait for password page
    console.log("⏳ Waiting for password page...");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "screenshots/03-password-page.png" });

    // STEP 3: Find and fill password
    console.log("🔍 Looking for password input...");
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("✅ Password input found");

    const USER_PASSWORD = "AgentFlow123!";
    console.log("⌨️ Typing password...");
    await passwordInput.fill(USER_PASSWORD);
    await page.screenshot({ path: "screenshots/04-password-entered.png" });

    // Click Sign In
    console.log("🖱️ Clicking Sign In button...");
    const signInButton = page
      .locator('button:has-text("Next"), button:has-text("Sign in")')
      .first();
    await signInButton.click();

    // Wait for authentication and redirect
    console.log("⏳ Waiting for authentication and redirect...");
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await page.screenshot({ path: "screenshots/05-after-auth.png" });

    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);

    // Check if redirected to app
    if (finalUrl.includes("localhost:3002")) {
      console.log("✅ Successfully authenticated and redirected to app!");

      // Wait for final redirect
      await page.waitForURL("http://localhost:3002/**", { timeout: 10000 });
      await page.screenshot({ path: "screenshots/06-app-redirect.png" });
      console.log("📸 App redirect screenshot taken");
    } else {
      console.log("⚠️ Still on Google - might need additional verification");
    }
  } catch (error) {
    console.error("❌ Error during login:", error.message);
    await page.screenshot({ path: "screenshots/error.png" });
  }

  console.log("✨ Done!");
  await browser.close();
})();
