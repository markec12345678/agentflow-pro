#!/usr/bin/env node
/**
 * Runs prisma migrate dev with .env.local and .env loaded.
 * Prisma CLI reads .env by default but not .env.local.
 * Use: node scripts/migrate-dev.js  or  npm run db:migrate
 */

import dotenv from "dotenv";
import { spawnSync } from "child_process";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("\nError: DATABASE_URL not set.");
  console.error("Add it to .env.local or .env (see .env.example)\n");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", "migrate", "dev"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
