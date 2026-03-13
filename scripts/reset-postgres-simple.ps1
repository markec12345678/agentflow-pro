# AgentFlow Pro - Reset PostgreSQL Authentication to TRUST mode
Write-Host "PostgreSQL Trust Mode Setup"
Write-Host "============================"

$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"

if (!(Test-Path $pgHbaPath)) {
    Write-Host "ERROR: pg_hba.conf not found at: $pgHbaPath"
    pause
    exit 1
}

Write-Host "Found pg_hba.conf at: $pgHbaPath"

# Read and update
$content = Get-Content $pgHbaPath -Raw
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)scram-sha-256', '${1}trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)scram-sha-256', '${1}trust'

Set-Content $pgHbaPath -Value $content -NoNewline
Write-Host "Updated pg_hba.conf to TRUST mode"

# Restart service
Write-Host "Restarting PostgreSQL service..."
Restart-Service -Name "postgresql*" -Force -ErrorAction SilentlyContinue

# Test connection
Write-Host "Testing connection..."
$testResult = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT 1 AS test;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Connection works!"
    Write-Host ""
    Write-Host "Creating database..."
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE agentflow_local;" 2>&1 | Out-Null
    
    Write-Host ""
    Write-Host "Update .env.local with:"
    Write-Host 'DATABASE_URL="postgresql://postgres:anything@localhost:5432/agentflow_local?schema=public"'
    Write-Host ""
    Write-Host "Then run: npx prisma db push"
} else {
    Write-Host "Connection test failed. Please restart PostgreSQL manually via services.msc"
}

pause
