Write-Host "📊 AgentFlow Pro - First Week Report" -ForegroundColor Cyan
Write-Host "=" * 60

$startDate = (Get-Date).AddDays(-7)
$endDate = Get-Date

Write-Host "`nPeriod: $($startDate.ToString('yyyy-MM-dd')) - $($endDate.ToString('yyyy-MM-dd'))"

# Simulirani podatki (zamenjaj z dejanskimi API klici)
$report = @{
    totalReservations = 84
    autoApproved = 71
    manualReview = 13
    autoApprovalRate = [Math]::Round((71/84)*100, 1)
    revenue = 8450
    occupancy = 78
    guestSatisfaction = 4.7
    systemUptime = 99.95
    errors = 2
}

Write-Host "`n📈 AUTOMATION METRICS:" -ForegroundColor Yellow
Write-Host "  Total Reservations: $($report.totalReservations)"
Write-Host "  Auto-Approved: $($report.autoApproved) ($($report.autoApprovalRate)%)"
Write-Host "  Manual Review: $($report.manualReview)"

Write-Host "`n💰 BUSINESS METRICS:" -ForegroundColor Yellow
Write-Host "  Revenue: €$($report.revenue)"
Write-Host "  Occupancy: $($report.occupancy)%"

Write-Host "`n🤖 SYSTEM METRICS:" -ForegroundColor Yellow
Write-Host "  Uptime: $($report.systemUptime)%"
Write-Host "  Errors: $($report.errors)"

Write-Host "`n" + "=" * 60
if ($report.autoApprovalRate -ge 70) {
    Write-Host "✅ AUTO-APPROVAL TARGET MET!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Auto-approval below target (70%)" -ForegroundColor Yellow
}
