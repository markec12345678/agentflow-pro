# AgentFlow Pro - Quick Start Script
Write-Host "🚀 AgentFlow Pro - Quick Start" -ForegroundColor Cyan
Write-Host "=" * 60

# Quick validation
Write-Host "🔍 Quick system check..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (Test-Path "node_modules") {
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  📦 Installing dependencies..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Dependency installation failed" -ForegroundColor Red
        exit 1
    }
}

# Environment setup
Write-Host "  🌍 Setting up environment..." -ForegroundColor White
$env:NODE_ENV = "development"

# Start development server with options
Write-Host ""
Write-Host "🎯 Choose startup mode:" -ForegroundColor Cyan
Write-Host "  1. Development mode (npm run dev)" -ForegroundColor White
Write-Host "  2. Production mode (npm run build && npm start)" -ForegroundColor White
Write-Host "  3. Validation mode (.\scripts\final-validation.ps1)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "  🛠️  Starting development server..." -ForegroundColor Yellow
        Write-Host "  🌐 http://localhost:3000" -ForegroundColor Cyan
        Write-Host "  🔄 Hot reload enabled" -ForegroundColor Green
        npm run dev
    }
    "2" {
        Write-Host "  🚀 Starting production server..." -ForegroundColor Yellow
        & .\scripts\production-deploy.ps1
    }
    "3" {
        Write-Host "  🧪 Running validation..." -ForegroundColor Yellow
        & .\scripts\final-validation.ps1
    }
    default {
        Write-Host "  ❌ Invalid choice. Starting development mode..." -ForegroundColor Red
        npm run dev
    }
}
