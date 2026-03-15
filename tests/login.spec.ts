import { test, expect } from "@playwright/test";

test("Login test", async ({ page }) => {
  console.log("🧪 Starting login test...");

  // Go to login page
  await page.goto("http://localhost:3000/login");
  console.log("✅ Navigated to login page");

  // Wait for page to load
  await page.waitForSelector('input[name="email"]');
  console.log("✅ Login form loaded");

  // Fill in credentials
  await page.fill('input[name="email"]', "test@agentflow.com");
  await page.fill('input[name="password"]', "test123");
  console.log("✅ Filled credentials");

  // Take screenshot before submit
  await page.screenshot({ path: "screenshots/before-login.png" });
  console.log("📸 Screenshot before login");

  // Submit form
  await page.click('button[type="submit"]');
  console.log("✅ Submitted form");

  // Wait for navigation or response
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    console.log("✅ Network idle reached");
  } catch (e) {
    console.log("⚠️ Network idle timeout (expected if redirect happens)");
  }

  // Take screenshot after
  await page.screenshot({ path: "screenshots/after-login.png" });
  console.log("📸 Screenshot after login");

  // Check URL
  const url = page.url();
  console.log("📍 Current URL:", url);

  // Check if redirected to dashboard
  if (url.includes("/dashboard")) {
    console.log("✅ SUCCESS: Redirected to dashboard!");
  } else if (url.includes("/login")) {
    console.log("❌ FAILED: Still on login page");
  }

  // Check for session
  const sessionResponse = await page.goto(
    "http://localhost:3000/api/auth/session",
  );
  const sessionData = await sessionResponse.json();
  console.log("📋 Session data:", JSON.stringify(sessionData, null, 2));

  if (sessionData?.user) {
    console.log("✅ Session exists!");
  } else {
    console.log("❌ Session is null!");
  }
});
