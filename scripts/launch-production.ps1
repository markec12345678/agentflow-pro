param(
    [switch]$DryRun,
    [switch]$Verbose
)

Write-Host "🚀 AgentFlow Pro - Production Launch" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Preveri environment variables
Write-Host "`n📋 Checking environment variables..." -ForegroundColor Yellow
$requiredEnv = @('DATABASE_URL', 'NEXTAUTH_SECRET', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'ETURIZEM_API_KEY')
foreach ($env in $requiredEnv) {
    if ($env:$env) {
        Write-Host "  ✅ $env" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $env - MISSING!" -ForegroundColor Red
        exit 1
    }
}

# 2. Run database migrations
Write-Host "`n🗄️ Running database migrations..." -ForegroundColor Yellow
if (!$DryRun) {
    npm run db:migrate
    npm run db:seed
}

# 3. Build application
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
if (!$DryRun) {
    npm run build
}

# 4. Run tests
Write-Host "`n🧪 Running test suite..." -ForegroundColor Yellow
if (!$DryRun) {
    pwsh -File scripts/test-all.ps1 -Environment production
}

# 5. Deploy to Vercel
Write-Host "`n🌐 Deploying to Vercel..." -ForegroundColor Yellow
if (!$DryRun) {
    vercel --prod
}

# 6. Health check
Write-Host "`n🏥 Running health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 30  # Wait for deployment
$response = Invoke-RestMethod "https://agentflow.pro/api/health"
if ($response.status -eq 'ok') {
    Write-Host "  ✅ System healthy" -ForegroundColor Green
} else {
    Write-Host "  ❌ System unhealthy!" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + "=" * 60
Write-Host "🎉 LAUNCH SUCCESSFUL!" -ForegroundColor Green
Write-Host "   URL: https://agentflow.pro" -ForegroundColor Cyan
Write-Host "   Director: https://agentflow.pro/director/summary" -ForegroundColor Cyan
Write-Host "   Health: https://agentflow.pro/api/health" -ForegroundColor Cyan
