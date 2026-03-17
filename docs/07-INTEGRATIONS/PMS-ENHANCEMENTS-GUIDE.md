# 🚀 PMS Enhancements - Complete Guide

**Datum:** 2026-03-10  
**Status:** ✅ VSE IMPLEMENTIRANO

---

## 📱 1. Mobile App za Housekeeping Osebje

### Lokacija
- **URL:** `/mobile/housekeeping`
- **API:** `/api/tourism/housekeeping/my-tasks`

### Features
- ✅ Mobile-first responsive design
- ✅ Task list s filtri (all, pending, completed)
- ✅ Start/complete task buttons
- ✅ Priority indicators (urgent, high, medium, low)
- ✅ Task type icons (checkout, stayover, deep clean, maintenance)
- ✅ Real-time stats (total, pending, in-progress, completed)
- ✅ Task detail modal z opombami

### Uporaba
1. Odpri `/mobile/housekeeping` na mobilni napravi
2. Prijavi se z employee email-om (ki se ujema z User email-om)
3. Poglej svoje task-e za danes
4. Klikni "Začni" za začetek naloga
5. Klikni "Končaj" ko si končal

### API Response Example
```json
{
  "tasks": [
    {
      "id": "task-123",
      "roomName": "Soba 101",
      "roomType": "Double",
      "taskType": "check_out_clean",
      "priority": "high",
      "status": "pending",
      "estimatedTime": 45,
      "notes": "Gost odhaja ob 11h"
    }
  ]
}
```

---

## 🔌 2. Real-time WebSocket Updates

### Lokacija
- **Socket Server:** `src/lib/websocket/socket-server.ts`
- **Eventi:** `housekeeping_request`, `housekeeping_notification`

### Features
- ✅ Real-time notification ob novem task-u
- ✅ Status update broadcasts
- ✅ Property-specific channels
- ✅ Authenticated socket connections

### Client Integration
```typescript
const socket = io({
  auth: {
    token: sessionToken,
    propertyId: "property-123",
  },
});

socket.on("housekeeping_notification", (notification) => {
  console.log("Nov task:", notification);
  // Prikaži toast notification
  toast.success(`Nov task: ${notification.message}`);
});

socket.on("room_update", (update) => {
  console.log("Soba posodobljena:", update);
  // Refreshaj task list
});
```

---

## 📊 3. Advanced Reporting - PDF/Excel Export

### Lokacija
- **API:** `/api/tourism/revenue/export`
- **UI:** `/dashboard/tourism/revenue` (gumba 📊 Excel in 📄 PDF)

### Features
- ✅ Excel (CSV) export z vsemi rezervacijami
- ✅ PDF (HTML) export s formatiranim poročilom
- ✅ Key metrics (revenue, occupancy, ADR, RevPAR)
- ✅ Revenue by channel breakdown
- ✅ Reservation details table

### Uporaba
1. Odpri `/dashboard/tourism/revenue`
2. Izberi period (7d, 30d, 90d, custom)
3. Klikni "📊 Excel" ali "📄 PDF"
4. Prenesi se samodejno

### API Request
```json
POST /api/tourism/revenue/export
{
  "propertyId": "property-123",
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "format": "excel" // ali "pdf"
}
```

### Excel Columns
- Channel, Revenue, Bookings
- Guest Name, Check-in, Check-out, Nights, Room, Amount, Status

---

## 🔮 4. Forecasting - Predictive Occupancy/Revenue

### Lokacija
- **API:** `/api/tourism/forecasting/occupancy`
- **UI:** (prihodnost - lahko se doda na revenue page)

### Features
- ✅ 30-day occupancy forecast
- ✅ Revenue prediction
- ✅ Day-of-week patterns
- ✅ Trend analysis (increasing/decreasing)
- ✅ Confidence scoring
- ✅ Actionable insights

### Uporaba
```bash
GET /api/tourism/forecasting/occupancy?propertyId=property-123&days=30
```

### Response Example
```json
{
  "forecast": [
    {
      "date": "2024-03-11",
      "dayOfWeek": "Mon",
      "predictedOccupied": 15,
      "totalRooms": 20,
      "predictedOccupancyRate": 75,
      "predictedRevenue": 1500,
      "alreadyBooked": 10,
      "confidence": 95
    }
  ],
  "summary": {
    "totalPredictedRevenue": 45000,
    "avgPredictedOccupancy": 72.5,
    "peakDays": 5,
    "lowDays": 3,
    "trend": 0.08
  },
  "insights": [
    "Trend is positive - occupancy is increasing",
    "5 peak days predicted - ensure adequate staffing",
    "3 low-occupancy days - consider discounts"
  ]
}
```

### Algorithm
1. **Historical Analysis**: 90-day lookback
2. **Day-of-Week Patterns**: Average by weekday
3. **Trend Detection**: Recent vs older occupancy comparison
4. **Confidence Scoring**: Decreases 2% per day ahead

---

## 🧪 5. Integration Testing - PMS Adapters

### Lokacija
- **Test File:** `tests/integration/pms-adapters.test.ts`
- **Command:** `npm run test:pms`

### Features
- ✅ Unit tests za vse adapterje
- ✅ Data transformation validation
- ✅ Status mapping tests
- ✅ Auto-approval rule tests
- ✅ Live integration tests (optional, z credentials)

### Run Tests
```bash
# Run all PMS tests
npm run test:pms

# Run with coverage
npm run test:pms -- --coverage

# Run specific test
npm run test:pms -- -t "Mews Adapter"
```

### Live Testing (Optional)
Za prave API teste nastavi environment variables:

```bash
# .env.test.local
PMS_TEST_MEWS_ENABLED=true
PMS_TEST_MEWS_ACCESS_TOKEN=your_token
PMS_TEST_MEWS_CLIENT_TOKEN=your_client_token

PMS_TEST_BOOKING_ENABLED=true
PMS_TEST_BOOKING_HOTEL_ID=your_hotel_id
PMS_TEST_BOOKING_USERNAME=your_username
PMS_TEST_BOOKING_PASSWORD=your_password

PMS_TEST_AIRBNB_ENABLED=true
PMS_TEST_AIRBNB_LISTING_ID=your_listing_id
PMS_TEST_AIRBNB_ACCESS_TOKEN=your_access_token
```

### Test Coverage
- ✅ Mews Adapter (2 tests)
- ✅ Booking.com Adapter (2 tests)
- ✅ Airbnb Adapter (2 tests)
- ✅ Sync to AgentFlow (2 tests)
- ✅ Auto-Approval Rules (1 test)
- ✅ Live Integration (3 tests, skipped by default)

---

## 📁 Datoteke

### Mobile App
- `src/app/mobile/housekeeping/page.tsx` - Mobile UI
- `src/app/api/tourism/housekeeping/my-tasks/route.ts` - API

### Export
- `src/app/api/tourism/revenue/export/route.ts` - PDF/Excel API
- `src/app/dashboard/tourism/revenue/page.tsx` - UI z export gumbi

### Forecasting
- `src/app/api/tourism/forecasting/occupancy/route.ts` - Forecast API

### Testing
- `tests/integration/pms-adapters.test.ts` - Integration tests
- `package.json` - `test:pms` script

---

## 🎯 Next Steps (Optional)

1. **WebSocket UI** - Dodaj real-time notifications na housekeeping page
2. **Forecasting UI** - Dodaj forecast vizualizacijo na revenue page
3. **Mobile PWA** - Add manifest.json za installable mobile app
4. **Push Notifications** - Web push za task assignments
5. **Advanced Analytics** - Machine learning za boljši forecasting

---

## ✅ Testing Checklist

- [ ] Mobile housekeeping page loads on phone
- [ ] Task start/complete works
- [ ] Excel export downloads CSV
- [ ] PDF export downloads HTML
- [ ] Forecasting API returns data
- [ ] PMS tests pass (`npm run test:pms`)

---

**Vse izboljšave so implementirane in pripravljene za uporabo!** 🎉
