Write-Host "`n🔍 Iskanje Property Management UI..." -ForegroundColor Cyan

$paths = @(
    "src/app/dashboard/properties",
    "src/app/dashboard/properties/create",
    "src/app/dashboard/properties/[id]",
    "src/app/dashboard/properties/[id]/rooms",
    "src/app/dashboard/properties/[id]/pricing",
    "src/app/dashboard/properties/[id]/amenities",
    "src/app/dashboard/properties/[id]/policies",
    "src/app/dashboard/properties/[id]/blocked-dates",
    "src/app/dashboard/properties/[id]/integrations",
    "src/web/components/property-form",
    "src/web/components/room-editor",
    "src/web/components/pricing-editor"
)

foreach ($path in $paths) {
    $exists = Test-Path $path
    $icon = if($exists){"✅"}else{"❌"}
    $color = if($exists){"Green"}else{"Yellow"}
    Write-Host "  $icon $path" -ForegroundColor $color
}

# Preveri API route
$apiExists = Test-Path "src/app/api/properties/route.ts"
Write-Host "`n  $(if($apiExists){"✅"}else{"❌"}) src/app/api/properties/route.ts" -ForegroundColor $(if($apiExists){"Green"}else{"Red"})

# Preveri dodatne API route
$apiPaths = @(
    "src/app/api/tourism/properties/route.ts",
    "src/app/api/tourism/properties/[id]/rooms/route.ts",
    "src/app/api/tourism/properties/[id]/amenities/route.ts",
    "src/app/api/tourism/properties/[id]/policies/route.ts",
    "src/app/api/tourism/properties/[id]/blocked-dates/route.ts",
    "src/app/api/tourism/properties/[id]/pricing/route.ts"
)

Write-Host "`n🔍 API Routes:" -ForegroundColor Cyan
foreach ($path in $apiPaths) {
    $exists = Test-Path $path
    $icon = if($exists){"✅"}else{"❌"}
    $color = if($exists){"Green"}else{"Red"}
    Write-Host "  $icon $path" -ForegroundColor $color
}

# Preveri individualne route datoteke
$individualRoutes = @(
    "src/app/api/tourism/properties/[id]/rooms/[roomId]/route.ts",
    "src/app/api/tourism/properties/[id]/amenities/[amenityId]/route.ts",
    "src/app/api/tourism/properties/[id]/policies/[policyId]/route.ts"
)

Write-Host "`n🔍 Individual Routes:" -ForegroundColor Cyan
foreach ($path in $individualRoutes) {
    $exists = Test-Path $path
    $icon = if($exists){"✅"}else{"❌"}
    $color = if($exists){"Green"}else{"Red"}
    Write-Host "  $icon $path" -ForegroundColor $color
}

# Preveri integracije
$integrationPaths = @(
    "src/app/api/integrations/eturizem/sync/route.ts",
    "src/app/api/integrations/eturizem/status/route.ts",
    "src/lib/tourism/tourism-kg-sync.ts",
    "src/lib/cache.ts"
)

Write-Host "`n🔍 Integration Components:" -ForegroundColor Cyan
foreach ($path in $integrationPaths) {
    $exists = Test-Path $path
    $icon = if($exists){"✅"}else{"❌"}
    $color = if($exists){"Green"}else{"Red"}
    Write-Host "  $icon $path" -ForegroundColor $color
}

# Preveri velikosti datotek
Write-Host "`n📊 Velikosti datotek:" -ForegroundColor Cyan
$files = @(
    "src/app/dashboard/properties/page.tsx",
    "src/app/dashboard/properties/create/page.tsx",
    "src/app/dashboard/properties/[id]/page.tsx",
    "src/app/dashboard/properties/[id]/rooms/page.tsx",
    "src/app/dashboard/properties/[id]/pricing/page.tsx",
    "src/app/dashboard/properties/[id]/amenities/page.tsx",
    "src/app/dashboard/properties/[id]/policies/page.tsx",
    "src/app/dashboard/properties/[id]/blocked-dates/page.tsx",
    "src/app/dashboard/properties/[id]/integrations/page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $sizeKB = [math]::Round($size / 1KB, 1)
        Write-Host "  📄 $file ($sizeKB KB)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (ne obstaja)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Preverjanje koncano!" -ForegroundColor Green
