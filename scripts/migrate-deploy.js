#!/usr/bin/env node
/**
 * Runs prisma migrate deploy with .env.local and .env loaded.
 * Prisma CLI reads .env by default but not .env.local.
 * Use: node scripts/migrate-deploy.js  or  npm run db:migrate:deploy
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("\nError: DATABASE_URL not set.");
  console.error("Add it to .env.local or .env (see .env.example)\n");
  process.exit(1);
}

const { spawnSync } = require("child_process");
const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
