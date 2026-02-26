# Production Database Setup - AgentFlow Pro
# Run: .\scripts\setup-prod-database.ps1
# Prerequisites: DATABASE_URL set in .env.local (Supabase/Neon prod connection string)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

# Load .env.local
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), "Process")
        }
    }
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl -or $dbUrl -eq "") {
    Write-Host "ERROR: DATABASE_URL not set in .env.local" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Create project at https://supabase.com or https://neon.tech"
    Write-Host "2. Copy connection string (use pooler for Vercel)"
    Write-Host "3. Add to .env.local: DATABASE_URL=`"postgresql://...`""
    Write-Host ""
    exit 1
}

Write-Host "DATABASE_URL is set. Running Prisma migrate deploy..." -ForegroundColor Cyan
npm run db:migrate:deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeding database..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Seed failed (may be OK if already seeded)" -ForegroundColor Yellow 
}

Write-Host "Production database setup complete." -ForegroundColor Green
