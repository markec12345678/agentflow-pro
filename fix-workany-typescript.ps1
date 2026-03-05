# PowerShell script to fix TypeScript error in WorkAny project
# This script replaces "_options" with "options" in the deepagents index.ts file

$filePath = "F:\AI\workany\src-api\src\extensions\agent\deepagents\index.ts"

# Check if file exists
if (-Not (Test-Path $filePath)) {
    Write-Host "Error: File not found at $filePath"
    exit 1
}

# Read the file content
$content = Get-Content $filePath -Raw

# Replace the problematic lines
$updatedContent = $content -replace "id: _options\?\.sessionId,", "id: options?.sessionId,"
$updatedContent = $updatedContent -replace "abortController: _options\?\.abortController,", "abortController: options?.abortController,"

# Write the updated content back to the file
$updatedContent | Set-Content $filePath

Write-Host "TypeScript error fixed successfully!"
Write-Host "You can now build the API by running:"
Write-Host "cd F:\AI\workany\src-api"
Write-Host "pnpm build"