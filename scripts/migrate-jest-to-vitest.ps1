#!/usr/bin/env pwsh
# Jest → Vitest Migration Script (PowerShell)
# 
# Converts:
# - jest.mock() → vi.mock()
# - jest.fn() → vi.fn()
# - jest.spyOn() → vi.spyOn()
# - etc.

$ErrorActionPreference = "Stop"

$VITEST_IMPORT = 'import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";'

$PATTERNS = @(
    @{ Name = "jest.mock"; Regex = "jest\.mock\s*\("; Replacement = "vi.mock(" },
    @{ Name = "jest.fn"; Regex = "jest\.fn\s*\("; Replacement = "vi.fn(" },
    @{ Name = "jest.spyOn"; Regex = "jest\.spyOn\s*\("; Replacement = "vi.spyOn(" },
    @{ Name = "jest.resetAllMocks"; Regex = "jest\.resetAllMocks\s*\(\)"; Replacement = "vi.resetAllMocks()" },
    @{ Name = "jest.restoreAllMocks"; Regex = "jest\.restoreAllMocks\s*\(\)"; Replacement = "vi.restoreAllMocks()" },
    @{ Name = "jest.clearAllMocks"; Regex = "jest\.clearAllMocks\s*\(\)"; Replacement = "vi.clearAllMocks()" },
    @{ Name = "jest.setTimeout"; Regex = "jest\.setTimeout\s*\(\s*(\d+)\s*\)"; Replacement = "vi.setConfig({ timeout: `$1 })" },
    @{ Name = "jest.requireActual"; Regex = "jest\.requireActual\s*\("; Replacement = "vi.importActual(" },
    @{ Name = "jest.requireMock"; Regex = "jest\.requireMock\s*\("; Replacement = "vi.importMock(" },
    @{ Name = "jest.useFakeTimers"; Regex = "jest\.useFakeTimers\s*\(\)"; Replacement = "vi.useFakeTimers()" },
    @{ Name = "jest.useRealTimers"; Regex = "jest\.useRealTimers\s*\(\)"; Replacement = "vi.useRealTimers()" },
    @{ Name = "jest.setSystemTime"; Regex = "jest\.setSystemTime\s*\("; Replacement = "vi.setSystemTime(" }
)

Write-Host "🔍 Scanning for test files...`n"

# Find all test files
$testFiles = Get-ChildItem -Path "tests", "src" -Recurse -Include "*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx" -File -ErrorAction SilentlyContinue

Write-Host "Found $($testFiles.Count) test files`n"
Write-Host "🔄 Migrating Jest → Vitest...`n"

$totalChanges = 0
$filesWithChanges = 0

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileChanges = 0
    
    # Check if already has vitest import
    if ($content -notmatch 'from\s+["'']vitest["'']') {
        # Add vitest import
        if ($content -match '^(import\s+.*?;)') {
            $content = $content -replace '^(import\s+.*?;)', "$VITEST_IMPORT`n`$1"
        } else {
            $content = "$VITEST_IMPORT`n`n$content"
        }
        $fileChanges++
    }
    
    # Apply pattern replacements
    foreach ($pattern in $PATTERNS) {
        $matches = [regex]::Matches($content, $pattern.Regex)
        if ($matches.Count -gt 0) {
            $content = [regex]::Replace($content, $pattern.Regex, $pattern.Replacement)
            Write-Host "  - Replaced $($matches.Count)x `"$($pattern.Name)`""
            $fileChanges += $matches.Count
        }
    }
    
    # Write back if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesWithChanges++
        $totalChanges += $fileChanges
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        Write-Host "✓ $relativePath ($fileChanges changes)"
    }
}

Write-Host "`n✅ Migration complete!"
Write-Host "   Files modified: $filesWithChanges / $($testFiles.Count)"
Write-Host "   Total changes: $totalChanges"
Write-Host "`n📝 Next steps:"
Write-Host "   1. Install vitest: npm install -D vitest @vitest/ui"
Write-Host "   2. Update package.json scripts to use 'vitest' instead of 'jest'"
Write-Host "   3. Run tests: npm test"
