#!/usr/bin/env node
/**
 * Pre-commit hook: lint + unit tests.
 * Cross-platform (Node.js) - runs on Windows without bash.
 * Run: npm run precommit  or  node scripts/pre-commit.js
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  return r.status;
}

const ciEnv = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "ci-secret-key",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3002",
};

console.log("🔍 Pre-commit: lint + test");
console.log("");

if (run("npm", ["run", "lint"], ciEnv) !== 0) {
  console.error("\n❌ Lint failed. Fix errors and try again.");
  process.exit(1);
}

if (run("npm", ["run", "test"], ciEnv) !== 0) {
  console.error("\n❌ Tests failed. Fix failures and try again.");
  process.exit(1);
}

console.log("\n✅ Pre-commit checks passed.");
