#!/usr/bin/env node
/**
 * Pre-deploy checks: verify env vars, npm audit, check doc links, optionally run E2E smoke tests.
 * Usage: node scripts/predeploy.js [--skip-e2e] [--skip-audit] [--skip-links]
 * - Default: runs npm audit (high+), verify env, check-links, test:e2e:smoke (per production-launch-checklist 8.3.5)
 * - --skip-e2e: skip E2E (faster, but run npm run test:e2e:smoke manually before launch)
 * - --skip-audit: skip npm audit (use only if audit blocks deploy and issues are tracked)
 * - --skip-links: skip internal doc link check (use only if broken links are tracked)
 */
const { execSync } = require("child_process");

const skipE2E = process.argv.includes("--skip-e2e");
const skipAudit = process.argv.includes("--skip-audit");
const skipLinks = process.argv.includes("--skip-links");

if (!skipAudit) {
  console.log("Predeploy: running npm audit (audit-level=high)...");
  try {
    execSync("npm audit --audit-level=high", { stdio: "inherit" });
  } catch (err) {
    console.error("Predeploy: npm audit found critical/high vulnerabilities. Resolve before launch or use --skip-audit.");
    process.exit(1);
  }
}

console.log("Predeploy: verify production env...");
execSync("npm run verify:production-env", { stdio: "inherit" });

if (!skipLinks) {
  console.log("Predeploy: checking internal doc links...");
  try {
    execSync("npm run check-links", { stdio: "inherit" });
  } catch (err) {
    console.error("Predeploy: broken links in docs. Fix or use --skip-links.");
    process.exit(1);
  }
}

if (skipE2E) {
  console.log("Predeploy: skipping E2E (--skip-e2e). Before launch, run: npm run test:e2e:smoke");
} else {
  console.log("Predeploy: running E2E smoke tests...");
  execSync("npm run test:e2e:smoke", { stdio: "inherit" });
}

console.log("Predeploy: OK. Ready to deploy.");
