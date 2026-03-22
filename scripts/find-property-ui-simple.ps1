Write-Host "`n🔍 Iskanje Property Management UI..." -ForegroundColor Cyan

# Preveri UI poti
$paths = @(
    "src/app/dashboard/properties",
    "src/app/dashboard/properties/create",
    "src/app/dashboard/properties/[id]",
    "src/app/dashboard/properties/[id]/rooms",
    "src/app/dashboard/properties/[id]/pricing",
    "src/app/dashboard/properties/[id]/amenities",
    "src/app/dashboard/properties/[id]/policies",
    "src/app/dashboard/properties/[id]/blocked-dates",
    "src/app/dashboard/properties/[id]/integrations"
)

Write-Host "`n📂 UI Komponente:" -ForegroundColor Cyan
foreach ($path in $paths) {
    $exists = Test-Path $path
    if ($exists) {
        Write-Host "  ✅ $path" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $path" -ForegroundColor Red
    }
}

# Preveri API route
$apiPaths = @(
    "src/app/api/tourism/properties/route.ts",
    "src/app/api/tourism/properties/[id]/rooms/route.ts",
    "src/app/api/tourism/properties/[id]/amenities/route.ts",
    "src/app/api/tourism/properties/[id]/policies/route.ts",
    "src/app/api/tourism/properties/[id]/blocked-dates/route.ts",
    "src/app/api/tourism/properties/[id]/pricing/route.ts"
)

Write-Host "`n🔌 API Routes:" -ForegroundColor Cyan
foreach ($path in $apiPaths) {
    $exists = Test-Path $path
    if ($exists) {
        Write-Host "  ✅ $path" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $path" -ForegroundColor Red
    }
}

# Preveri individualne route datoteke
$individualRoutes = @(
    "src/app/api/tourism/properties/[id]/rooms/[roomId]/route.ts",
    "src/app/api/tourism/properties/[id]/amenities/[amenityId]/route.ts",
    "src/app/api/tourism/properties/[id]/policies/[policyId]/route.ts"
)

Write-Host "`n🎯 Individual Routes:" -ForegroundColor Cyan
foreach ($path in $individualRoutes) {
    $exists = Test-Path $path
    if ($exists) {
        Write-Host "  ✅ $path" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $path" -ForegroundColor Red
    }
}

# Preveri integracije
$integrationPaths = @(
    "src/app/api/integrations/eturizem/sync/route.ts",
    "src/app/api/integrations/eturizem/status/route.ts",
    "src/lib/tourism/tourism-kg-sync.ts",
    "src/lib/cache.ts"
)

Write-Host "`n🔗 Integration Components:" -ForegroundColor Cyan
foreach ($path in $integrationPaths) {
    $exists = Test-Path $path
    if ($exists) {
        Write-Host "  ✅ $path" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $path" -ForegroundColor Red
    }
}

Write-Host "`n✅ Preverjanje koncano!" -ForegroundColor Green
