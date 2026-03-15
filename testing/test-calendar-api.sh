#!/bin/bash
# 🧪 Calendar API Test Suite - cURL/bash
# 
# Uporaba: ./test-calendar-api.sh
# Zahteva: Dev server teče na localhost:3002

BASE_URL="http://localhost:3002/api/tourism/calendar"
TEST_COOKIE="next-auth.session-token=test-token"  # Zamenjaj s pravim session-om

echo "========================================"
echo "  Calendar API Test Suite"
echo "  Base URL: $BASE_URL"
echo "========================================"
echo ""

# ============================================================================
# Test 1: GET Calendar
# ============================================================================

echo "Test 1: GET Calendar"
echo "Endpoint: GET /api/tourism/calendar?propertyId=test-property&year=2026&month=4"
echo ""

response=$(curl -s -w "\n%{http_code}" -X GET \
    "$BASE_URL?propertyId=test-property&year=2026&month=4" \
    -H "Cookie: $TEST_COOKIE")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✅ PASS - Status: 200 OK"
    echo "Response: $body" | jq .
else
    echo "❌ FAIL - Status: $http_code"
    echo "Response: $body"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================================================
# Test 2: POST Create Reservation
# ============================================================================

echo "Test 2: POST Create Reservation"
echo "Endpoint: POST /api/tourism/calendar"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
    "$BASE_URL" \
    -H "Cookie: $TEST_COOKIE" \
    -H "Content-Type: application/json" \
    -d '{
        "propertyId": "test-property",
        "roomId": null,
        "type": "reservation",
        "checkIn": "2026-04-01",
        "checkOut": "2026-04-05",
        "guestName": "John Doe",
        "guestEmail": "john@example.com",
        "guestPhone": "+38640123456",
        "channel": "direct",
        "totalAmount": 400,
        "deposit": 100,
        "touristTax": 20,
        "guests": 2,
        "allowOverbooking": false
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    echo "✅ PASS - Status: 201 Created"
    echo "Response: $body" | jq .
else
    echo "❌ FAIL - Status: $http_code"
    echo "Response: $body"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================================================
# Test 3: POST Create Blocked Dates
# ============================================================================

echo "Test 3: POST Create Blocked Dates"
echo "Endpoint: POST /api/tourism/calendar"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
    "$BASE_URL" \
    -H "Cookie: $TEST_COOKIE" \
    -H "Content-Type: application/json" \
    -d '{
        "propertyId": "test-property",
        "roomId": null,
        "type": "blocked",
        "checkIn": "2026-04-10",
        "checkOut": "2026-04-15",
        "notes": "Renoviranje",
        "allowOverbooking": false
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    echo "✅ PASS - Status: 201 Created"
    echo "Response: $body" | jq .
else
    echo "❌ FAIL - Status: $http_code"
    echo "Response: $body"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================================================
# Test 4: PATCH Update Reservation
# ============================================================================

echo "Test 4: PATCH Update Reservation"
echo "Endpoint: PATCH /api/tourism/calendar"
echo ""

response=$(curl -s -w "\n%{http_code}" -X PATCH \
    "$BASE_URL" \
    -H "Cookie: $TEST_COOKIE" \
    -H "Content-Type: application/json" \
    -d '{
        "id": "res_test-123",
        "status": "confirmed",
        "notes": "Updated notes",
        "totalAmount": 450,
        "deposit": 150,
        "touristTax": 25
    }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✅ PASS - Status: 200 OK"
    echo "Response: $body" | jq .
else
    echo "❌ FAIL - Status: $http_code"
    echo "Response: $body"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================================================
# Test 5: DELETE Cancel Reservation
# ============================================================================

echo "Test 5: DELETE Cancel Reservation"
echo "Endpoint: DELETE /api/tourism/calendar?id=res_test-123&type=reservation"
echo ""

response=$(curl -s -w "\n%{http_code}" -X DELETE \
    "$BASE_URL?id=res_test-123&type=reservation" \
    -H "Cookie: $TEST_COOKIE")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✅ PASS - Status: 200 OK"
    echo "Response: $body" | jq .
else
    echo "❌ FAIL - Status: $http_code"
    echo "Response: $body"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================================================
# Test 6: Error - Missing Authentication
# ============================================================================

echo "Test 6: Error - Missing Authentication (Expected: 401)"
echo "Endpoint: POST /api/tourism/calendar (no cookie)"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
    "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "propertyId": "test-property",
        "type": "reservation",
        "checkIn": "2026-04-01",
        "checkOut": "2026-04-05",
        "guestEmail": "test@example.com"
    }')

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ]; then
    echo "✅ PASS - Got expected 401 Unauthorized"
else
    echo "❌ FAIL - Expected 401 but got $http_code"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================================================
# Test 7: Error - Missing Required Fields
# ============================================================================

echo "Test 7: Error - Missing Required Fields (Expected: 400)"
echo "Endpoint: POST /api/tourism/calendar (missing fields)"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
    "$BASE_URL" \
    -H "Cookie: $TEST_COOKIE" \
    -H "Content-Type: application/json" \
    -d '{
        "propertyId": "test-property"
    }')

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "400" ]; then
    echo "✅ PASS - Got expected 400 Bad Request"
else
    echo "❌ FAIL - Expected 400 but got $http_code"
fi

echo ""
echo "========================================"
echo "  Test Suite Complete!"
echo "========================================"
echo ""
