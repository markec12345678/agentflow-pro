#!/usr/bin/env npx tsx
/**
 * Jest → Vitest Migration Script
 */

import { readFileSync, writeFileSync } from "fs";

const VITEST_IMPORT = 'import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";';

const PATTERNS: Array<{ name: string; regex: RegExp; replacement: string | ((m: string, ...args: any[]) => string) }> = [
  { name: "jest.mock", regex: /jest\.mock\s*\(/g, replacement: "vi.mock(" },
  { name: "jest.fn", regex: /jest\.fn\s*\(/g, replacement: "vi.fn(" },
  { name: "jest.spyOn", regex: /jest\.spyOn\s*\(/g, replacement: "vi.spyOn(" },
  { name: "jest.resetAllMocks", regex: /jest\.resetAllMocks\s*\(\)/g, replacement: "vi.resetAllMocks()" },
  { name: "jest.restoreAllMocks", regex: /jest\.restoreAllMocks\s*\(\)/g, replacement: "vi.restoreAllMocks()" },
  { name: "jest.clearAllMocks", regex: /jest\.clearAllMocks\s*\(\)/g, replacement: "vi.clearAllMocks()" },
  { name: "jest.setTimeout", regex: /jest\.setTimeout\s*\(\s*(\d+)\s*\)/g, replacement: (m: string, t: string) => `vi.setConfig({ timeout: ${t} })` },
  { name: "jest.requireActual", regex: /jest\.requireActual\s*\(/g, replacement: "vi.importActual(" },
  { name: "jest.requireMock", regex: /jest\.requireMock\s*\(/g, replacement: "vi.importMock(" },
  { name: "jest.useFakeTimers", regex: /jest\.useFakeTimers\s*\(\)/g, replacement: "vi.useFakeTimers()" },
  { name: "jest.useRealTimers", regex: /jest\.useRealTimers\s*\(\)/g, replacement: "vi.useRealTimers()" },
  { name: "jest.setSystemTime", regex: /jest\.setSystemTime\s*\(/g, replacement: "vi.setSystemTime(" },
];

const TEST_FILES = process.argv.slice(2);

if (TEST_FILES.length === 0) {
  console.error("Usage: npx tsx migrate-jest-to-vitest.ts <file1> [file2] ...");
  process.exit(1);
}

let totalChanges = 0;
let filesWithChanges = 0;

console.log(`🔄 Migrating ${TEST_FILES.length} test files from Jest to Vitest...\n`);

for (const filePath of TEST_FILES) {
  try {
    let content = readFileSync(filePath, "utf-8");
    const original = content;
    let fileChanges = 0;

    // Add vitest import if not present
    if (!/from\s+["']vitest["']/.test(content)) {
      const importMatch = content.match(/^(import\s+.*?;)/m);
      if (importMatch) {
        content = content.replace(/^(import\s+.*?;)/m, (m) => `${VITEST_IMPORT}\n${m}`);
      } else {
        content = `${VITEST_IMPORT}\n\n${content}`;
      }
      fileChanges++;
    }

    // Apply pattern replacements
    for (const pattern of PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches?.length) {
        content = content.replace(pattern.regex, pattern.replacement as any);
        console.log(`  - Replaced ${matches.length}x "${pattern.name}" in ${filePath.split('\\').pop()}`);
        fileChanges += matches.length;
      }
    }

    // Write back if changed
    if (content !== original) {
      writeFileSync(filePath, content, "utf-8");
      filesWithChanges++;
      totalChanges += fileChanges;
      const relative = filePath.replace(process.cwd() + "\\", "");
      console.log(`✓ ${relative} (${fileChanges} changes)`);
    }
  } catch (err: any) {
    console.error(`✗ Error processing ${filePath}: ${err.message}`);
  }
}

console.log(`\n✅ Migration complete!`);
console.log(`   Files modified: ${filesWithChanges}/${TEST_FILES.length}`);
console.log(`   Total changes: ${totalChanges}`);
