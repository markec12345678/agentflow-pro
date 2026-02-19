#!/usr/bin/env node
/**
 * Verify required production environment variables.
 * Run before deploy: npm run verify:production-env
 * Loads .env.local if present, else .env
 */
const path = require("path");
const fs = require("fs");

const envLocal = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envLocal)) {
  require("dotenv").config({ path: envLocal });
} else if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const required = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO",
];

const optional = [
  "SENTRY_DSN",
  "GA_MEASUREMENT_ID",
  "GITHUB_TOKEN",
  "FIRECRAWL_API_KEY",
  "CONTEXT7_API_KEY",
  "OPENAI_API_KEY",
];

const env = process.env;
const missing = required.filter((k) => !env[k] || env[k].trim() === "");
const warnings = optional.filter((k) => !env[k] || env[k].trim() === "");

if (missing.length > 0) {
  console.error("Missing required env vars:");
  missing.forEach((k) => console.error("  -", k));
  process.exit(1);
}

if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
  console.warn(
    "STRIPE_SECRET_KEY should be sk_live_... for production (not sk_test_)"
  );
}

if (
  env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  !env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")
) {
  console.warn(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should be pk_live_... for production (not pk_test_)"
  );
}

if (warnings.length > 0) {
  console.warn("Optional vars not set:", warnings.join(", "));
}

console.log("Required env vars OK.");
process.exit(0);
