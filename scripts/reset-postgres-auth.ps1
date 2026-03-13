# AgentFlow Pro - Reset PostgreSQL Authentication to TRUST mode
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL Trust Mode Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"

# Check if file exists
if (!(Test-Path $pgHbaPath)) {
    Write-Host "❌ pg_hba.conf not found at: $pgHbaPath" -ForegroundColor Red
    Write-Host "Please update the path if PostgreSQL is installed elsewhere."
    pause
    exit 1
}

Write-Host "📄 Found pg_hba.conf at: $pgHbaPath" -ForegroundColor Green
Write-Host ""

# Read the file
$content = Get-Content $pgHbaPath -Raw
$originalContent = $content

# Replace scram-sha-256 with trust for localhost connections
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)scram-sha-256', '${1}trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)scram-sha-256', '${1}trust'

# Also replace md5 if present
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)md5', '${1}trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)md5', '${1}trust'

# Save the file
try {
    Set-Content $pgHbaPath -Value $content -NoNewline
    Write-Host "✅ pg_hba.conf updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Changes made:" -ForegroundColor Yellow
    Write-Host "  - 127.0.0.1: scram-sha-256 → trust"
    Write-Host "  - ::1 (IPv6): scram-sha-256 → trust"
    Write-Host ""
} catch {
    Write-Host "❌ Failed to update pg_hba.conf" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Please run this script as Administrator."
    pause
    exit 1
}

# Restart PostgreSQL service
Write-Host "🔄 Restarting PostgreSQL service..." -ForegroundColor Yellow

try {
    Restart-Service -Name "postgresql*" -Force
    Write-Host "✅ PostgreSQL service restarted!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not restart PostgreSQL service automatically" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please restart it manually:"
    Write-Host "  1. Press Win + R"
    Write-Host "  2. Type: services.msc"
    Write-Host "  3. Find: PostgreSQL 18"
    Write-Host "  4. Right-click → Restart"
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Connection..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test connection
$testResult = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT 1 AS test;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUCCESS! Connection works without password!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Output:" -ForegroundColor Gray
    Write-Host $testResult -ForegroundColor Gray
    Write-Host ""
    
    # Create database
    Write-Host "📦 Creating database 'agentflow_local'..." -ForegroundColor Yellow
    $createResult = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE agentflow_local;" 2>&1
    
    if ($createResult -like '*already exists*') {
        Write-Host "ℹ️  Database already exists" -ForegroundColor Yellow
    } elseif ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not create database: $createResult" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Update your .env.local with:" -ForegroundColor Cyan
    Write-Host 'DATABASE_URL="postgresql://postgres:anything@localhost:5432/agentflow_local?schema=public"' -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Cyan
    Write-Host "  npx prisma db push" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Connection test failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Output:" -ForegroundColor Gray
    Write-Host $testResult -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Make sure PostgreSQL service is running"
    Write-Host "  2. Check Windows Firewall"
    Write-Host "  3. Try restarting your computer"
    Write-Host ""
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
