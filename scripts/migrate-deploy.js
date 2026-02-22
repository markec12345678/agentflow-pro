#!/usr/bin/env node
/**
 * Runs prisma migrate deploy with .env.local and .env loaded.
 * Prisma CLI reads .env by default but not .env.local.
 * Use: node scripts/migrate-deploy.js  or  npm run db:migrate:deploy
 */

const path = require("path");
const fs = require("fs");
const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env.local") });
require("dotenv").config({ path: path.join(root, ".env") });

if (!process.env.DATABASE_URL) {
  console.error("\nError: DATABASE_URL not set.");
  console.error("Add it to .env.local or .env (see .env.example)\n");
  process.exit(1);
}

// Prisma CLI reads .env - ensure DATABASE_URL for subprocess
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath) || !/^DATABASE_URL=/m.test(fs.readFileSync(envPath, "utf8"))) {
  const safe = process.env.DATABASE_URL.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  fs.writeFileSync(envPath, (content.trimEnd() ? content.trimEnd() + "\n" : "") + `DATABASE_URL="${safe}"\n`);
}

const { spawnSync } = require("child_process");
const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
process.exit(r.status ?? 1);
