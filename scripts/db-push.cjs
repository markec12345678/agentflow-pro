#!/usr/bin/env node
/**
 * Runs prisma db push with .env.local and .env loaded.
 * Syncs schema to DB without migration history - adds missing columns like activePropertyId.
 * Use: node scripts/db-push.js  or  npm run db:push
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("\nError: DATABASE_URL not set.");
  console.error("Add it to .env.local or .env (see .env.example)\n");
  process.exit(1);
}

const { spawnSync } = require("child_process");
const r = spawnSync("npx", ["prisma", "db", "push"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
