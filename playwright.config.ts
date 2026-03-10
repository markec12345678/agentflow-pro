import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/app.spec.ts"], // Outdated: tests /auth/*, /tourism/workflows, /booking/*, /reviews/*, /billing/* - routes do not exist
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["json", { outputFolder: "test-results/results.json" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  timeout: 30_000,
  expect: { timeout: 5_000 },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Email-specific test project with extended timeouts for AI generation
    {
      name: "chromium-email",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: "**/tourism-email.spec.ts",
      timeout: 60_000,
      expect: { timeout: 15_000 },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      MOCK_MODE: "true",
      DRY_RUN: "true", // Prevent actual email sending during tests
      RESEND_API_KEY: "test-key-for-testing",
    },
  },
});
