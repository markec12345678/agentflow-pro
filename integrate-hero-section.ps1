# AgentFlow Pro - Samodejna Integracija HeroSection

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  AgentFlow Pro - HeroSection Integracija" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Preveri če page.tsx obstaja
Write-Host "📄 Checking src/app/page.tsx..." -ForegroundColor Yellow
if (Test-Path "src\app\page.tsx") {
    Write-Host "✅ Found src/app/page.tsx" -ForegroundColor Green
    
    # Naredi backup
    Write-Host "💾 Creating backup..." -ForegroundColor Yellow
    Copy-Item -Path "src\app\page.tsx" -Destination "src\app\page.tsx.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force
    Write-Host "✅ Backup created!" -ForegroundColor Green
} else {
    Write-Host "❌ src/app/page.tsx not found!" -ForegroundColor Red
    Write-Host "Creating new page.tsx..." -ForegroundColor Yellow
    New-Item -Path "src\app\page.tsx" -ItemType File -Force | Out-Null
}

Write-Host ""

# 2. Preveri če HeroSection.tsx obstaja v components
Write-Host "🧩 Checking HeroSection component..." -ForegroundColor Yellow
if (Test-Path "src\components\HeroSection.tsx") {
    Write-Host "✅ HeroSection.tsx found in src/components/" -ForegroundColor Green
} else {
    Write-Host "❌ HeroSection.tsx not found!" -ForegroundColor Red
    Write-Host "Copying from root..." -ForegroundColor Yellow
    if (Test-Path "HeroSection.tsx") {
        New-Item -ItemType Directory -Force -Path "src\components" | Out-Null
        Copy-Item -Path "HeroSection.tsx" -Destination "src\components\HeroSection.tsx" -Force
        Write-Host "✅ HeroSection.tsx copied!" -ForegroundColor Green
    } else {
        Write-Host "❌ HeroSection.tsx not found in root either!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 3. Posodobi page.tsx z HeroSection
Write-Host "📝 Updating page.tsx..." -ForegroundColor Yellow

$pageContent = @"
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
"@

Set-Content -Path "src\app\page.tsx" -Value $pageContent -Encoding UTF8 -NoNewline
Write-Host "✅ page.tsx updated!" -ForegroundColor Green

Write-Host ""

# 4. Preveri public/promo mapo
Write-Host "📁 Checking public/promo directory..." -ForegroundColor Yellow
if (Test-Path "public\promo") {
    Write-Host "✅ public/promo found" -ForegroundColor Green
    
    $videoExists = Test-Path "public\promo\agentflow-pro-promo.mp4"
    $imageExists = Test-Path "public\promo\agentflow-pro-promo-2025.png"
    
    if ($videoExists) {
        Write-Host "✅ Video found: agentflow-pro-promo.mp4" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Video not found in public/promo/" -ForegroundColor Yellow
    }
    
    if ($imageExists) {
        Write-Host "✅ Image found: agentflow-pro-promo-2025.png" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Image not found in public/promo/" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  public/promo not found - run .\deploy-landing-page.ps1 first" -ForegroundColor Yellow
}

Write-Host ""

# 5. Odpri navodila
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Integracija Uspešna!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Testiraj lokalno:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host "   start http://localhost:3002" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Preveri če vse deluje:" -ForegroundColor White
Write-Host "   ✅ Video se avtomatsko predvaja" -ForegroundColor Gray
Write-Host "   ✅ CTA gumbi delujejo" -ForegroundColor Gray
Write-Host "   ✅ Responsive na mobile" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Commitaj in deployaj:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m `"🎨 Launch new hero section`"" -ForegroundColor Cyan
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Odpri navodila:" -ForegroundColor White
Write-Host "   start INTEGRACIJA-NAVODILA.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 6. Odpri navodila
Start-Process "INTEGRACIJA-NAVODILA.md"
Write-Host "📖 Opened integration instructions!" -ForegroundColor Green
Write-Host ""
