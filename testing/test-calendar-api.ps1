# 🧪 Calendar API Test Suite - PowerShell Scripts
# 
# Uporaba: .\test-calendar-api.ps1
# Zahteva: Dev server teče na localhost:3002

$baseUrl = "http://localhost:3002/api/tourism/calendar"
$testCookie = "next-auth.session-token=test-token"  # Zamenjaj s pravim session-om

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Calendar API Test Suite" -ForegroundColor Cyan
Write-Host "  Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Test 1: GET Calendar
# ============================================================================

Write-Host "Test 1: GET Calendar" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/tourism/calendar?propertyId=test-property&year=2026&month=4"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$baseUrl?propertyId=test-property&year=2026&month=4" `
        -Method GET `
        -Headers @{ "Cookie" = $testCookie } `
        -ContentType "application/json"
    
    Write-Host "✅ PASS - Status: 200 OK" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Test 2: POST Create Reservation
# ============================================================================

Write-Host "Test 2: POST Create Reservation" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/tourism/calendar"
Write-Host ""

$body = @{
    propertyId = "test-property"
    roomId = $null
    type = "reservation"
    checkIn = "2026-04-01"
    checkOut = "2026-04-05"
    guestName = "John Doe"
    guestEmail = "john@example.com"
    guestPhone = "+38640123456"
    channel = "direct"
    totalAmount = 400
    deposit = 100
    touristTax = 20
    guests = 2
    allowOverbooking = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl `
        -Method POST `
        -Headers @{ 
            "Cookie" = $testCookie
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ PASS - Status: 201 Created" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Test 3: POST Create Blocked Dates
# ============================================================================

Write-Host "Test 3: POST Create Blocked Dates" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/tourism/calendar"
Write-Host ""

$body = @{
    propertyId = "test-property"
    roomId = $null
    type = "blocked"
    checkIn = "2026-04-10"
    checkOut = "2026-04-15"
    notes = "Renoviranje"
    allowOverbooking = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl `
        -Method POST `
        -Headers @{ 
            "Cookie" = $testCookie
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ PASS - Status: 201 Created" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Test 4: PATCH Update Reservation
# ============================================================================

Write-Host "Test 4: PATCH Update Reservation" -ForegroundColor Yellow
Write-Host "Endpoint: PATCH /api/tourism/calendar"
Write-Host ""

$body = @{
    id = "res_test-123"
    status = "confirmed"
    notes = "Updated notes"
    totalAmount = 450
    deposit = 150
    touristTax = 25
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl `
        -Method PATCH `
        -Headers @{ 
            "Cookie" = $testCookie
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ PASS - Status: 200 OK" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Test 5: DELETE Cancel Reservation
# ============================================================================

Write-Host "Test 5: DELETE Cancel Reservation" -ForegroundColor Yellow
Write-Host "Endpoint: DELETE /api/tourism/calendar?id=res_test-123&type=reservation"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$baseUrl?id=res_test-123&type=reservation" `
        -Method DELETE `
        -Headers @{ "Cookie" = $testCookie }
    
    Write-Host "✅ PASS - Status: 200 OK" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Test 6: Error - Missing Authentication
# ============================================================================

Write-Host "Test 6: Error - Missing Authentication (Expected: 401)" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/tourism/calendar (no cookie)"
Write-Host ""

$body = @{
    propertyId = "test-property"
    type = "reservation"
    checkIn = "2026-04-01"
    checkOut = "2026-04-05"
    guestEmail = "test@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $body
    
    Write-Host "❌ FAIL - Expected 401 but got 200" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASS - Got expected 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - Expected 401 but got $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Test 7: Error - Missing Required Fields
# ============================================================================

Write-Host "Test 7: Error - Missing Required Fields (Expected: 400)" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/tourism/calendar (missing fields)"
Write-Host ""

$body = @{
    propertyId = "test-property"
    # Manjka: type, checkIn, checkOut
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl `
        -Method POST `
        -Headers @{ 
            "Cookie" = $testCookie
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "❌ FAIL - Expected 400 but got 200" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASS - Got expected 400 Bad Request" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - Expected 400 but got $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Suite Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
