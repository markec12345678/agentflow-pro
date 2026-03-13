# Test all dashboard URLs
# Usage: .\test-dashboard-urls.ps1

$baseUrl = "http://localhost:3002"

$urls = @(
    # P0 - Critical
    "/",
    "/login",
    "/register",
    "/pricing",
    "/dashboard",
    "/dashboard/tourism",
    "/dashboard/receptor",
    "/dashboard/properties",
    "/dashboard/tourism/calendar",
    "/dashboard/tourism/generate",
    
    # Tourism Hub
    "/dashboard/tourism/inbox",
    "/dashboard/tourism/guest-communication",
    "/dashboard/tourism/email",
    "/dashboard/tourism/landing",
    "/dashboard/tourism/seo",
    "/dashboard/tourism/dynamic-pricing",
    "/dashboard/tourism/revenue",
    "/dashboard/tourism/competitors",
    "/dashboard/tourism/eturizem-settings",
    "/dashboard/tourism/analytics",
    "/dashboard/tourism/templates",
    "/dashboard/tourism/itineraries",
    "/dashboard/tourism/translate",
    
    # Receptor
    "/dashboard/receptor/quick-reservation",
    "/dashboard/receptor/calendar",
    "/dashboard/receptor/arrivals",
    "/dashboard/receptor/departures",
    
    # Properties
    "/dashboard/properties/create",
    
    # Reservations
    "/dashboard/reservations",
    "/dashboard/reservations/check-in",
    "/dashboard/reservations/check-out",
    
    # Rooms
    "/dashboard/rooms/housekeeping",
    "/dashboard/rooms/maintenance",
    
    # AI & Workflow
    "/dashboard/workflows",
    "/dashboard/workflows/builder",
    "/dashboard/mcp-builder",
    "/dashboard/chat",
    
    # Analytics
    "/dashboard/insights",
    "/dashboard/content-quality",
    "/dashboard/ab-tests",
    
    # Settings
    "/dashboard/settings",
    "/dashboard/settings/brand-voice",
    
    # Other
    "/dashboard/escalations",
    "/dashboard/approvals",
    "/dashboard/page-builder",
    
    # Public
    "/onboarding",
    "/forgot-password",
    "/generate",
    "/content",
    "/solutions",
    "/stories"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AgentFlow Pro - Dashboard URL Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0
$timeout = 0

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$url" -Method Head -TimeoutSec 3 -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq 200) {
            Write-Host "[OK]  $url" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "[WARN] $url - $status" -ForegroundColor Yellow
            $failed++
        }
    } catch {
        if ($_.Exception.Message -match "timeout") {
            Write-Host "[TIME] $url" -ForegroundColor DarkYellow
            $timeout++
        } else {
            $status = $_.Exception.Response.StatusCode
            if ($status -eq 404) {
                Write-Host "[404] $url" -ForegroundColor Red
            } else {
                Write-Host "[ERR] $url - $status" -ForegroundColor Red
            }
            $failed++
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed:  $passed" -ForegroundColor Green
Write-Host "Failed:  $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Timeout: $timeout" -ForegroundColor DarkYellow
Write-Host "Total:   $($urls.Count)`n" -ForegroundColor Cyan

# Export results to file
$resultsPath = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$passed, $failed, $timeout | Out-File -FilePath $resultsPath
Write-Host "Results saved to: $resultsPath" -ForegroundColor Gray
