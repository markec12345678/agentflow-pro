# Convert Prisma schema from PostgreSQL to SQLite-compatible format

$inputFile = "prisma\schema.prisma"
$outputFile = "prisma\schema.prisma"
$backupFile = "prisma\schema.prisma.pre-sqlite"

Write-Host "Reading schema file..."
$content = Get-Content $inputFile -Raw

# Save backup
Copy-Item $inputFile $backupFile -Force
Write-Host "Backup saved to $backupFile"

$changes = @()

# 1. Remove @db.Text
$matches = [regex]::Matches($content, '@db\.Text')
if ($matches.Count -gt 0) {
    $changes += "Removed @db.Text from $($matches.Count) occurrences"
    $content = $content -replace '@db\.Text\s*', ''
}

# 2. Convert Json to String
$matches = [regex]::Matches($content, '\bJson\b')
if ($matches.Count -gt 0) {
    $changes += "Converted $($matches.Count) Json fields to String"
    $content = $content -replace '\bJson\b', 'String'
}

# 3. Convert String[] to String
$matches = [regex]::Matches($content, 'String\[\]')
if ($matches.Count -gt 0) {
    $changes += "Converted $($matches.Count) String[] fields to String"
    $content = $content -replace 'String\[\]', 'String'
    # Fix default values
    $content = $content -replace '@default\(\[.*?\]\)', '@default("")'
    # Add default for required fields without default
    $content = $content -replace '(^\s*\w+\s+String\s+(?!@default))', '${1}@default("")'
}

# 4. Comment out enums
$enumPattern = '(?m)^enum\s+\w+\s*\{[^}]*\}'
$matches = [regex]::Matches($content, $enumPattern)
if ($matches.Count -gt 0) {
    $changes += "Commented out $($matches.Count) enum definitions"
    # Comment each enum
    $content = [regex]::Replace($content, '(?m)^(enum\s+\w+\s*\{)', '// $1')
    $content = [regex]::Replace($content, '(?m)^([^/].*?)(?=\s*//|$)', { param($m) 
        if ($m.Value.Trim() -match '^\s*\}') { 
            return "// " + $m.Value.TrimStart()
        }
        return $m.Value 
    })
}

# 5. Convert UserRole to String
$matches = [regex]::Matches($content, '\bUserRole\b')
if ($matches.Count -gt 0) {
    $changes += "Converted $($matches.Count) UserRole references to String"
    $content = $content -replace '\bUserRole\b', 'String'
    $content = $content -replace '@default\((ADMIN|EDITOR|VIEWER)\)', '@default("$1")'
}

# Write output
Set-Content -Path $outputFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Schema Conversion Summary" -ForegroundColor Green
Write-Host "=" * 50
foreach ($change in $changes) {
    Write-Host "- $change"
}
Write-Host "=" * 50
Write-Host ""
Write-Host "Converted schema saved to: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file to use: DATABASE_URL=`"file:./dev.db`""
Write-Host "2. Run: prisma generate"
Write-Host "3. Run: prisma db push"
