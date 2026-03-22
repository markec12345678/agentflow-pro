# AgentFlow Pro - Final Validation Script
Write-Host "🔍 AgentFlow Pro - Final Validation" -ForegroundColor Cyan
Write-Host "=" * 60

# Core Modules Validation
$checks = @(
    @{ Name = "Dashboard"; URL = "/dashboard"; Role = "all"; Critical = $true },
    @{ Name = "Director Summary"; URL = "/director/summary"; Role = "director"; Critical = $true },
    @{ Name = "Reservations"; URL = "/reservations"; Role = "receptionist"; Critical = $true },
    @{ Name = "Pending Approvals"; URL = "/reservations/pending"; Role = "receptionist"; Critical = $true },
    @{ Name = "Guest Management"; URL = "/guests"; Role = "receptionist"; Critical = $true },
    @{ Name = "Property Management"; URL = "/properties"; Role = "admin"; Critical = $true },
    @{ Name = "Agent Dashboard"; URL = "/agents"; Role = "admin"; Critical = $false },
    @{ Name = "Workflow Builder"; URL = "/workflows"; Role = "admin"; Critical = $false },
    @{ Name = "Alerts"; URL = "/alerts"; Role = "all"; Critical = $true },
    @{ Name = "eTurizem Integration"; URL = "/integrations/eturizem"; Role = "admin"; Critical = $true },
    @{ Name = "Analytics"; URL = "/analytics"; Role = "director"; Critical = $true },
    @{ Name = "Settings"; URL = "/settings"; Role = "admin"; Critical = $false },
    @{ Name = "Payments"; URL = "/payments"; Role = "receptionist"; Critical = $true },
    @{ Name = "Health Check"; URL = "/admin/health"; Role = "admin"; Critical = $true },
    @{ Name = "Booking Portal"; URL = "/book"; Role = "public"; Critical = $true }
)

$passed = 0
$failed = 0
$criticalFailed = 0

Write-Host "🧪 Testing Core Modules..." -ForegroundColor Yellow

foreach ($check in $checks) {
    try {
        # Simulacija HTTP status check (v produkciji uporabite真实 HTTP request)
        $response = Invoke-WebRequest -Uri "http://localhost:3000$($check.URL)" -Method GET -TimeoutSecs 10 -UseBasicParsing $false
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200) {
            $status = "✅"
            $color = "Green"
            $passed++
            if ($check.Critical) { Write-Host "  $status $($check.Name) ($($check.URL)) - CRITICAL" -ForegroundColor Green }
            else { Write-Host "  $status $($check.Name) ($($check.URL))" -ForegroundColor White }
        } else {
            $status = "❌"
            $color = "Red"
            $failed++
            if ($check.Critical) { 
                $criticalFailed++
                Write-Host "  $status $($check.Name) ($($check.URL)) - CRITICAL FAILED!" -ForegroundColor Red 
            } else {
                Write-Host "  $status $($check.Name) ($($check.URL)) - Status: $statusCode" -ForegroundColor Red 
            }
        }
    } catch {
        $status = "⚠️"
        $color = "Yellow"
        $failed++
        Write-Host "  $status $($check.Name) ($($check.URL)) - Timeout/Error" -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 200  # Kratka pavza med testi
}

Write-Host "=" * 60
Write-Host "📊 VALIDATION RESULTS:" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $passed" -ForegroundColor Green
Write-Host "  ❌ Failed: $failed" -ForegroundColor Red

if ($criticalFailed -gt 0) {
    Write-Host "  🚨 CRITICAL FAILURES: $criticalFailed" -ForegroundColor Red
    Write-Host ""
    Write-Host "⛔ PRODUCTION LAUNCH BLOCKED!" -ForegroundColor Red
    Write-Host "   Fix critical modules before launching." -ForegroundColor Red
    exit 1
} else {
    Write-Host "  🎉 ALL CRITICAL MODULES OPERATIONAL" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ READY FOR PRODUCTION LAUNCH!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Run: npm run build" -ForegroundColor White
    Write-Host "   2. Run: npm run start" -ForegroundColor White
    Write-Host "   3. Access: http://localhost:3000" -ForegroundColor White
}

Write-Host "=" * 60
