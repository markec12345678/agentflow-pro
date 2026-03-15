# 🚀 AgentFlow Pro - Deployment Script
# Quick deploy promotional materials

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  AgentFlow Pro - Quick Deploy" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create promo directory
Write-Host "📁 Creating public/promo directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "public\promo" | Out-Null
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""

# 2. Copy video
Write-Host "🎬 Copying promo video..." -ForegroundColor Yellow
Copy-Item -Path "screenshots\agentflow-pro-promo.mp4" -Destination "public\promo\agentflow-pro-promo.mp4" -Force
Write-Host "✅ Video copied to public/promo/" -ForegroundColor Green
Write-Host ""

# 3. Copy promo image
Write-Host "📸 Copying promo image..." -ForegroundColor Yellow
Copy-Item -Path "agentflow-pro-promo-2025.png" -Destination "public\promo\agentflow-pro-promo-2025.png" -Force
Write-Host "✅ Image copied to public/promo/" -ForegroundColor Green
Write-Host ""

# 4. Update landing page video path
Write-Host "📝 Updating landing page video path..." -ForegroundColor Yellow
$landingPage = Get-Content "landing-page-hero.html" -Raw
$landingPage = $landingPage -replace 'src="screenshots/agentflow-pro-promo.mp4"', 'src="/promo/agentflow-pro-promo.mp4"'
$landingPage | Set-Content "landing-page-hero.html" -Encoding UTF8
Write-Host "✅ Video path updated!" -ForegroundColor Green
Write-Host ""

# 5. Copy landing page to app
Write-Host "🌐 Copying landing page to src/app..." -ForegroundColor Yellow
if (Test-Path "src\app\page.tsx") {
    Copy-Item -Path "landing-page-hero.html" -Destination "src\app\landing-page-backup.html" -Force
    Write-Host "⚠️  Backup created: src/app/landing-page-backup.html" -ForegroundColor Yellow
}
Copy-Item -Path "landing-page-hero.html" -Destination "src\app\landing-page-temp.html" -Force
Write-Host "✅ Landing page ready at src/app/landing-page-temp.html" -ForegroundColor Green
Write-Host ""

# 6. Show deployment instructions
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Pre-Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Convert HTML to React component:" -ForegroundColor White
Write-Host "   Copy src/app/landing-page-temp.html to your page.tsx" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Or use the React component I created:" -ForegroundColor White
Write-Host "   npm run create-landing-page (if available)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy to Vercel:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test live site:" -ForegroundColor White
Write-Host "   Open your production URL" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 7. Open landing page preview
Write-Host "🌐 Opening landing page preview..." -ForegroundColor Yellow
Start-Process "landing-page-hero.html"
Write-Host "✅ Preview opened in browser!" -ForegroundColor Green
Write-Host ""
