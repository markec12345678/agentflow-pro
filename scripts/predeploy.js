#!/usr/bin/env node
/**
 * Pre-deploy checks: verify env vars, optionally run E2E smoke tests.
 * Usage: node scripts/predeploy.js [--skip-e2e]
 * - Default: runs test:e2e:smoke (per production-launch-checklist 8.3.5)
 * - --skip-e2e: skip E2E (faster, but run npm run test:e2e:smoke manually before launch)
 */
const { execSync } = require("child_process");

const skipE2E = process.argv.includes("--skip-e2e");

console.log("Predeploy: verify production env...");
execSync("npm run verify:production-env", { stdio: "inherit" });

if (skipE2E) {
  console.log("Predeploy: skipping E2E (--skip-e2e). Before launch, run: npm run test:e2e:smoke");
} else {
  console.log("Predeploy: running E2E smoke tests...");
  execSync("npm run test:e2e:smoke", { stdio: "inherit" });
}

console.log("Predeploy: OK. Ready to deploy.");
