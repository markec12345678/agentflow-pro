/**
 * E2E Global Setup
 * Runs once before all tests. WebServer in config starts the Next.js app.
 */
async function globalSetup() {
  // Minimal checks - webServer handles app startup
  if (process.env.CI && !process.env.DATABASE_URL) {
    console.warn("E2E: DATABASE_URL not set - some features may be limited");
  }
  if (process.env.CI && !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    console.warn("E2E: Use STRIPE_SECRET_KEY (sk_test_...) for billing tests");
  }
}

export default globalSetup;
