/**
 * E2E Global Setup
 * Runs once before all tests. WebServer in config starts the Next.js app.
 * Seeds E2E user (e2e@test.com) when DATABASE_URL is set.
 */
import { execSync } from "child_process";

async function globalSetup() {
  if (process.env.CI && !process.env.DATABASE_URL) {
    console.warn("E2E: DATABASE_URL not set - some features may be limited");
  }
  if (process.env.CI && !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    console.warn("E2E: Use STRIPE_SECRET_KEY (sk_test_...) for billing tests");
  }

  if (process.env.DATABASE_URL) {
    try {
      execSync("npx prisma db seed", {
        stdio: "pipe",
        cwd: process.cwd(),
      });
    } catch {
      console.warn("E2E: prisma db seed failed - auth tests may fail if e2e@test.com is missing");
    }
  }
}

export default globalSetup;
