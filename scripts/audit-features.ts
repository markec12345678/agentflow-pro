/**
 * AgentFlow Pro - Feature Discovery Audit Script
 * 1. Scans UI files for data-feature-tour attributes and compares with FeatureTour steps.
 * 2. Verifies prompts are registered (tourism prompts, categories in UI).
 * Run: npx tsx scripts/audit-features.ts
 * Or: npm run audit:features
 */

import fs from "fs";
import path from "path";
import { PROMPTS, CATEGORY_LABELS } from "../src/data/prompts";

const UI_PATTERN = /data-feature-tour=["']([^"']+)["']/g;
// Match [data-feature-tour='id'] (tour step target selectors) - bracket form excludes UI attr match
const TOUR_TARGET_PATTERN = /\[data-feature-tour=["']([^"']+)["']\]/g;

interface Occurrence {
  id: string;
  file: string;
  line?: number;
}

function walkDir(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const name of list) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name !== "node_modules" && name !== ".next") {
        results.push(...walkDir(full, exts));
      }
    } else if (exts.some((e) => name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function extractFromContent(
  content: string,
  filePath: string,
  pattern: RegExp,
  groupIndex: number
): Occurrence[] {
  const results: Occurrence[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const re = new RegExp(pattern.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const id = m[groupIndex] ?? m[1];
      if (id) {
        results.push({ id, file: filePath, line: i + 1 });
      }
    }
  }
  return results;
}

function extractFeatureIdsFromUI(content: string, filePath: string): Occurrence[] {
  return extractFromContent(content, filePath, UI_PATTERN, 1);
}

function extractTourTargets(content: string, filePath: string): Occurrence[] {
  return extractFromContent(content, filePath, TOUR_TARGET_PATTERN, 1);
}

function main() {
  const srcDir = path.resolve(process.cwd(), "src");
  if (!fs.existsSync(srcDir)) {
    console.error("src/ directory not found");
    process.exit(1);
  }

  const uiFiles = walkDir(srcDir, [".tsx", ".jsx"]);
  const uiOccurrences: Occurrence[] = [];
  const tourOccurrences: Occurrence[] = [];

  for (const file of uiFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const isTourFile = /FeatureTour|tour.*\.tsx?$/i.test(file);

    // UI: only from non-tour files (tour files contain selector strings, not actual JSX attributes)
    if (!isTourFile) {
      uiOccurrences.push(...extractFeatureIdsFromUI(content, relativePath));
    }
    tourOccurrences.push(...extractTourTargets(content, relativePath));
  }

  const inUI = new Map<string, Occurrence[]>();
  for (const o of uiOccurrences) {
    const list = inUI.get(o.id) ?? [];
    list.push(o);
    inUI.set(o.id, list);
  }

  const inTour = new Map<string, Occurrence[]>();
  for (const o of tourOccurrences) {
    const list = inTour.get(o.id) ?? [];
    list.push(o);
    inTour.set(o.id, list);
  }

  const uiIds = new Set(inUI.keys());
  const tourIds = new Set(inTour.keys());

  const orphaned = [...tourIds].filter((id) => !uiIds.has(id));
  const missingCoverage = [...uiIds].filter((id) => !tourIds.has(id));
  const matched = [...tourIds].filter((id) => uiIds.has(id));

  console.log("\nFeature Discovery Audit");
  console.log("======================\n");

  console.log("In UI (" + uiOccurrences.length + "):");
  for (const [id, list] of inUI) {
    for (const o of list) {
      console.log(`  ${id}  ${o.file}${o.line != null ? `:${o.line}` : ""}`);
    }
  }

  console.log("\nIn tour steps (" + tourOccurrences.length + "):");
  for (const [id, list] of inTour) {
    for (const o of list) {
      console.log(`  ${id}  ${o.file}${o.line != null ? `:${o.line}` : ""}`);
    }
  }

  if (orphaned.length > 0) {
    console.log("\nOrphaned (tour has no matching UI): " + orphaned.join(", "));
  }
  if (missingCoverage.length > 0) {
    console.log("Missing tour coverage: " + missingCoverage.join(", "));
  }

  if (orphaned.length > 0 || missingCoverage.length > 0) {
    console.log("\nFix:");
    for (const id of orphaned) {
      console.log(`  - Add data-feature-tour="${id}" to a UI element, or remove that step from FeatureTour.`);
    }
    for (const id of missingCoverage) {
      const locs = inUI.get(id) ?? [];
      const files = [...new Set(locs.map((o) => o.file))];
      console.log(`  - Add a tour step targeting "${id}" (used in ${files.join(", ")})`);
    }
  } else if (matched.length > 0) {
    console.log("\nAll " + matched.length + " tour targets have matching UI elements.");
  }

  // --- Prompt audit: verify all prompts registered in UI ---
  console.log("\n🔍 Feature Audit: Tourism Prompts\n");

  const tourismPrompts = PROMPTS.filter((p) => p.category === "tourism");
  console.log(`Found ${tourismPrompts.length} tourism prompts:`);
  tourismPrompts.forEach((prompt) => {
    console.log(`  ✓ ${prompt.name} (id: ${prompt.id})`);
    console.log(`    Variables: ${prompt.variables?.join(", ") || "none"}`);
  });

  console.log(`\nCategories available in UI: ${Object.keys(CATEGORY_LABELS).join(", ")}`);

  const categoriesInPrompts = new Set(PROMPTS.map((p) => p.category));
  const categoriesInLabels = new Set(Object.keys(CATEGORY_LABELS));
  const missingLabels = [...categoriesInPrompts].filter((c) => !categoriesInLabels.has(c));
  if (missingLabels.length > 0) {
    console.log(`\n⚠ Missing CATEGORY_LABELS for: ${missingLabels.join(", ")}`);
  } else {
    console.log("\n✓ All prompt categories have UI labels.");
  }

  console.log("");
}

main();
