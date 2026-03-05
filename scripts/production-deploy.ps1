# AgentFlow Pro - Production Deployment Script
Write-Host "🚀 AgentFlow Pro - Production Deployment" -ForegroundColor Cyan
Write-Host "=" * 60

# Pre-deployment checks
Write-Host "🔍 Pre-deployment checks..." -ForegroundColor Yellow

# Check if build is successful
Write-Host "  📦 Building application..." -ForegroundColor White
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Build failed! Fix errors before deployment." -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Build successful" -ForegroundColor Green

# Run final validation
Write-Host "  🧪 Running final validation..." -ForegroundColor White
& .\scripts\final-validation.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Validation failed! Cannot deploy." -ForegroundColor Red
    exit 1
}

# Environment checks
Write-Host "  🌍 Environment checks..." -ForegroundColor White
if ($env:NODE_ENV -ne "production") {
    Write-Host "  ⚠️  Warning: NODE_ENV not set to production" -ForegroundColor Yellow
}

# Database connection check
Write-Host "  🗄️  Database connection test..." -ForegroundColor White
try {
    $dbTest = node -e "const { prisma } = require('./database/schema'); prisma.$connect().then(() => console.log('CONNECTED')).catch(() => console.log('FAILED'));"
    if ($dbTest -match "CONNECTED") {
        Write-Host "  ✅ Database connected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Database connection failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Database test failed" -ForegroundColor Red
    exit 1
}

# Production optimizations
Write-Host "⚡ Production optimizations..." -ForegroundColor Yellow

# Clear development caches
Write-Host "  🧹 Clearing caches..." -ForegroundColor White
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# Set production environment
$env:NODE_ENV = "production"

# Start production server
Write-Host ""
Write-Host "🎉 AGENTFLOW PRO READY FOR PRODUCTION!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "🌐 Server starting on http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 Monitoring: http://localhost:3000/admin/health" -ForegroundColor Cyan
Write-Host "📈 Analytics: http://localhost:3000/analytics" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop server" -ForegroundColor White
Write-Host "=" * 60

# Start the application
npm start
