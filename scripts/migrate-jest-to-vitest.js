#!/usr/bin/env node
/**
 * Jest → Vitest Migration Script
 * 
 * Converts:
 * - jest.mock() → vi.mock()
 * - jest.fn() → vi.fn()
 * - jest.spyOn() → vi.spyOn()
 * - jest.resetAllMocks() → vi.resetAllMocks()
 * - jest.restoreAllMocks() → vi.restoreAllMocks()
 * - jest.clearAllMocks() → vi.clearAllMocks()
 * - jest.setTimeout() → vi.setConfig({ timeout: })
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, extname, sep } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Root directories to scan (recursively)
const ROOT_DIRS = [
  join(process.cwd(), "tests"),
  join(process.cwd(), "src"),
];

// File extensions to process
const TEST_EXTENSIONS = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];

// Regex patterns for Jest syntax
const PATTERNS = [
  {
    name: "jest.mock",
    regex: /jest\.mock\s*\(/g,
    replacement: "vi.mock(",
  },
  {
    name: "jest.fn",
    regex: /jest\.fn\s*\(/g,
    replacement: "vi.fn(",
  },
  {
    name: "jest.spyOn",
    regex: /jest\.spyOn\s*\(/g,
    replacement: "vi.spyOn(",
  },
  {
    name: "jest.resetAllMocks",
    regex: /jest\.resetAllMocks\s*\(\)/g,
    replacement: "vi.resetAllMocks()",
  },
  {
    name: "jest.restoreAllMocks",
    regex: /jest\.restoreAllMocks\s*\(\)/g,
    replacement: "vi.restoreAllMocks()",
  },
  {
    name: "jest.clearAllMocks",
    regex: /jest\.clearAllMocks\s*\(\)/g,
    replacement: "vi.clearAllMocks()",
  },
  {
    name: "jest.setTimeout",
    regex: /jest\.setTimeout\s*\(\s*(\d+)\s*\)/g,
    replacement: (match, timeout) => `vi.setConfig({ timeout: ${timeout} })`,
  },
  {
    name: "jest.requireActual",
    regex: /jest\.requireActual\s*\(/g,
    replacement: "vi.importActual(",
  },
  {
    name: "jest.requireMock",
    regex: /jest\.requireMock\s*\(/g,
    replacement: "vi.importMock(",
  },
  {
    name: "jest.createMockFromModule",
    regex: /jest\.createMockFromModule\s*\(/g,
    replacement: "vi.createMockFromModule(",
  },
  {
    name: "jest.advanceTimersByTime",
    regex: /jest\.advanceTimersByTime\s*\(/g,
    replacement: "vi.advanceTimersByTime(",
  },
  {
    name: "jest.runAllTimers",
    regex: /jest\.runAllTimers\s*\(\)/g,
    replacement: "vi.runAllTimers()",
  },
  {
    name: "jest.runOnlyPendingTimers",
    regex: /jest\.runOnlyPendingTimers\s*\(\)/g,
    replacement: "vi.runOnlyPendingTimers()",
  },
  {
    name: "jest.useFakeTimers",
    regex: /jest\.useFakeTimers\s*\(\)/g,
    replacement: "vi.useFakeTimers()",
  },
  {
    name: "jest.useRealTimers",
    regex: /jest\.useRealTimers\s*\(\)/g,
    replacement: "vi.useRealTimers()",
  },
  {
    name: "jest.setSystemTime",
    regex: /jest\.setSystemTime\s*\(/g,
    replacement: "vi.setSystemTime(",
  },
];

// Import pattern to add at the top of test files
const VITEST_IMPORT = 'import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";';

function isTestFile(filePath) {
  const ext = extname(filePath);
  return TEST_EXTENSIONS.includes(ext);
}

function getAllTestFilesRecursively(dir) {
  const files = [];
  
  if (!dir || !existsSync(dir)) {
    return files;
  }
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, dist, .next
        if (["node_modules", "dist", ".next"].includes(entry.name)) {
          continue;
        }
        files.push(...getAllTestFilesRecursively(fullPath));
      } else if (entry.isFile() && isTestFile(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
  
  return files;
}

function getAllTestFiles(rootDirs) {
  const allFiles = [];
  for (const dir of rootDirs) {
    const files = getAllTestFilesRecursively(dir);
    allFiles.push(...files);
  }
  return allFiles;
}

function migrateFile(filePath) {
  let content = readFileSync(filePath, "utf-8");
  const originalContent = content;
  let changesCount = 0;
  
  // Check if file already has vitest import
  const hasVitestImport = /from\s+["']vitest["']/.test(content);
  
  // Add vitest import if not present
  if (!hasVitestImport) {
    // Add after any existing imports or at the top
    const importRegex = /^(import\s+.*?;)/m;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => {
        return `${VITEST_IMPORT}\n${match}`;
      });
      changesCount++;
    } else {
      content = `${VITEST_IMPORT}\n\n${content}`;
      changesCount++;
    }
  }
  
  // Apply all pattern replacements
  for (const pattern of PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      if (typeof pattern.replacement === "string") {
        content = content.replace(pattern.regex, pattern.replacement);
      } else if (typeof pattern.replacement === "function") {
        content = content.replace(pattern.regex, pattern.replacement);
      }
      changesCount += matches.length;
      console.log(`  - Replaced ${matches.length}x "${pattern.name}"`);
    }
  }
  
  // Write back if changed
  if (content !== originalContent) {
    writeFileSync(filePath, content, "utf-8");
    return changesCount;
  }
  
  return 0;
}

function main() {
  console.log("🔍 Scanning for test files...\n");
  
  const testFiles = getAllTestFiles(ROOT_DIRS);
  console.log(`Found ${testFiles.length} test files\n`);
  
  let totalChanges = 0;
  let filesWithChanges = 0;
  
  console.log("🔄 Migrating Jest → Vitest...\n");
  
  for (const file of testFiles) {
    const relativePath = file.replace(process.cwd() + sep, "");
    const changes = migrateFile(file);
    
    if (changes > 0) {
      filesWithChanges++;
      totalChanges += changes;
      console.log(`✓ ${relativePath} (${changes} changes)`);
    }
  }
  
  console.log("\n✅ Migration complete!");
  console.log(`   Files modified: ${filesWithChanges}/${testFiles.length}`);
  console.log(`   Total changes: ${totalChanges}`);
  console.log("\n📝 Next steps:");
  console.log("   1. Install vitest: npm install -D vitest @vitest/ui");
  console.log("   2. Update package.json scripts to use 'vitest' instead of 'jest'");
  console.log("   3. Run tests: npm test");
}

main();
