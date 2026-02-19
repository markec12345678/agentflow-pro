#!/usr/bin/env node
/**
 * Pre-deploy checks: verify env vars, optionally run E2E.
 * Usage: node scripts/predeploy.js [--skip-e2e]
 */
const { execSync } = require("child_process");

const skipE2E = process.argv.includes("--skip-e2e");

console.log("Predeploy: verify production env...");
execSync("npm run verify:production-env", { stdio: "inherit" });

if (skipE2E) {
  console.log("Predeploy: skipping E2E (--skip-e2e)");
} else {
  console.log("Predeploy: running E2E checklist...");
  execSync("npm run test:e2e:checklist", { stdio: "inherit" });
}

console.log("Predeploy: OK. Ready to deploy.");
