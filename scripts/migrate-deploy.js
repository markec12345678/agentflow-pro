#!/usr/bin/env node
/**
 * Runs prisma migrate deploy with .env.local and .env loaded.
 * Prisma CLI reads .env by default but not .env.local.
 * Use: node scripts/migrate-deploy.js  or  npm run db:migrate:deploy
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

// Load .env.local explicitly (dotenv/config loads .env automatically)
const envLocalPath = path.join(root, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, "utf8");
  envLocal.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^"|"$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

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

const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
process.exit(r.status ?? 1);
