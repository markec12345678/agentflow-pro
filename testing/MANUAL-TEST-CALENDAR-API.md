# 🧪 Testni Načrt: Calendar API

## 📋 Pregled Testov

| Test                    | Endpoint                | Metoda | Status     | Prioriteta |
| ----------------------- | ----------------------- | ------ | ---------- | ---------- |
| 1. Get Calendar         | `/api/tourism/calendar` | GET    | ⏳ Pending | P0         |
| 2. Create Reservation   | `/api/tourism/calendar` | POST   | ⏳ Pending | P0         |
| 3. Create Blocked Dates | `/api/tourism/calendar` | POST   | ⏳ Pending | P0         |
| 4. Update Reservation   | `/api/tourism/calendar` | PATCH  | ⏳ Pending | P1         |
| 5. Cancel Reservation   | `/api/tourism/calendar` | DELETE | ⏳ Pending | P1         |

## 🔧 Priprava Okolja

### 1. Zaženi Dev Server

```bash
cd f:\ffff\agentflow-pro
npm run dev
```

**Pričakovano:** Server se zažene na `http://localhost:3002`

### 2. Preveri Database Connection

```bash
npx prisma studio
```

**Pričakovano:** Prisma Studio se odpre na `http://localhost:5555`

### 3. Ustvari Testnega Uporabnika (če ga nimaš)

Preveri v Prisma Studio:

- User tabela
- Email: `test@example.com`
- Password: `Test123!`

---

## 📝 Testni Primeri

### Test 1: Get Calendar ✅/❌

**Cilj:** Preveriti pridobivanje koledarja za property

**Endpoint:** `GET /api/tourism/calendar?propertyId=xxx&year=2026&month=4`

**Headers:**

```
Cookie: next-auth.session-token=xxx
```

**Pričakovan Odziv:**

```json
{
  "success": true,
  "days": [...],
  "reservations": [...],
  "blockedDates": [...]
}
```

**Koraki:**

1. Odpri Postman/Thunder Client
2. Nastavi GET request
3. Dodaj query parametre
4. Dodaj session cookie
5. Pošlji request
6. Preveri response (200 OK)

**Test Skripta (cURL):**

```bash
curl -X GET "http://localhost:3002/api/tourism/calendar?propertyId=test-property&year=2026&month=4" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### Test 2: Create Reservation ✅/❌

**Cilj:** Ustvariti novo rezervacijo

**Endpoint:** `POST /api/tourism/calendar`

**Headers:**

```
Content-Type: application/json
Cookie: next-auth.session-token=xxx
```

**Body:**

```json
{
  "propertyId": "test-property-id",
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
}
```

**Pričakovan Odziv:**

```json
{
  "success": true,
  "type": "reservation",
  "reservation": {
    "id": "res_xxx",
    "propertyId": "test-property-id",
    "guestId": "guest_xxx",
    "checkIn": "2026-04-01T00:00:00.000Z",
    "checkOut": "2026-04-05T00:00:00.000Z",
    "status": "confirmed",
    "confirmationCode": "xxx",
    "totalPrice": 400,
    "deposit": 100,
    "touristTax": 20
  },
  "guest": {
    "id": "guest_xxx",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "Rezervacija je bila uspešno ustvarjena."
}
```

**Test Skripta (cURL):**

```bash
curl -X POST "http://localhost:3002/api/tourism/calendar" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "propertyId": "test-property-id",
    "type": "reservation",
    "checkIn": "2026-04-01",
    "checkOut": "2026-04-05",
    "guestEmail": "john@example.com",
    "guestName": "John Doe",
    "guests": 2,
    "totalAmount": 400
  }'
```

---

### Test 3: Create Blocked Dates ✅/❌

**Cilj:** Blokirati datume v koledarju

**Endpoint:** `POST /api/tourism/calendar`

**Body:**

```json
{
  "propertyId": "test-property-id",
  "roomId": null,
  "type": "blocked",
  "checkIn": "2026-04-10",
  "checkOut": "2026-04-15",
  "notes": "Renoviranje",
  "allowOverbooking": false
}
```

**Pričakovan Odziv:**

```json
{
  "success": true,
  "type": "blocked",
  "blockedDates": [
    {
      "id": "blocked_xxx",
      "propertyId": "test-property-id",
      "date": "2026-04-10",
      "reason": "Renoviranje"
    },
    ...
  ],
  "message": "Blokiranih 5 datumov."
}
```

**Test Skripta (cURL):**

```bash
curl -X POST "http://localhost:3002/api/tourism/calendar" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "propertyId": "test-property-id",
    "type": "blocked",
    "checkIn": "2026-04-10",
    "checkOut": "2026-04-15",
    "notes": "Renoviranje"
  }'
```

---

### Test 4: Update Reservation ✅/❌

**Cilj:** Posodobiti obstoječo rezervacijo

**Endpoint:** `PATCH /api/tourism/calendar`

**Body:**

```json
{
  "id": "res_xxx",
  "status": "confirmed",
  "notes": "Updated notes",
  "totalAmount": 450,
  "deposit": 150,
  "touristTax": 25
}
```

**Pričakovan Odziv:**

```json
{
  "success": true,
  "reservation": {
    "id": "res_xxx",
    "propertyId": "test-property-id",
    "status": "confirmed",
    "notes": "Updated notes",
    "totalPrice": 450,
    "deposit": 150,
    "touristTax": 25,
    "updatedAt": "2026-03-13T..."
  },
  "message": "Rezervacija je bila uspešno posodobljena."
}
```

**Test Skripta (cURL):**

```bash
curl -X PATCH "http://localhost:3002/api/tourism/calendar" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "id": "res_xxx",
    "status": "confirmed",
    "notes": "Updated notes",
    "totalAmount": 450
  }'
```

---

### Test 5: Cancel Reservation ✅/❌

**Cilj:** Preklicati rezervacijo

**Endpoint:** `DELETE /api/tourism/calendar?id=res_xxx&type=reservation`

**Headers:**

```
Cookie: next-auth.session-token=xxx
```

**Pričakovan Odziv:**

```json
{
  "success": true,
  "type": "reservation",
  "message": "Rezervacija je bila uspešno preklicana."
}
```

**Test Skripta (cURL):**

```bash
curl -X DELETE "http://localhost:3002/api/tourism/calendar?id=res_xxx&type=reservation" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

## ⚠️ Error Scenariji

### Test 6: Missing Authentication ❌→✅

**Endpoint:** `POST /api/tourism/calendar`

**Brez Cookie-ja:**

```bash
curl -X POST "http://localhost:3002/api/tourism/calendar" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Pričakovan Odziv:**

```json
{
  "error": "Authentication required"
}
```

**Status:** `401 Unauthorized` ✅

---

### Test 7: Missing Required Fields ❌→✅

**Body:**

```json
{
  "propertyId": "test-property-id"
  // Manjka: checkIn, checkOut, type
}
```

**Pričakovan Odziv:**

```json
{
  "error": "Missing required fields: propertyId, checkIn, checkOut, type"
}
```

**Status:** `400 Bad Request` ✅

---

### Test 8: Date Conflict (No Overbooking) ❌→✅

**Body:**

```json
{
  "propertyId": "test-property-id",
  "type": "reservation",
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-05",
  "guestEmail": "test@example.com",
  "allowOverbooking": false
}
```

**Če že obstaja rezervacija za te datume:**

**Pričakovan Odziv:**

```json
{
  "error": "Date range conflicts with existing reservation res_xxx"
}
```

**Status:** `409 Conflict` ✅

---

### Test 9: Property Not Found ❌→✅

**Body:**

```json
{
  "propertyId": "non-existent-property",
  "type": "reservation",
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-05",
  "guestEmail": "test@example.com"
}
```

**Pričakovan Odziv:**

```json
{
  "error": "Property not found"
}
```

**Status:** `404 Not Found` ✅

---

## 📊 Test Results Template

### Test Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Calendar API Test Results                                  │
├─────────────────────────────────────────────────────────────┤
│  Date: 2026-03-13                                           │
│  Tester: [Your Name]                                        │
│  Environment: Development (localhost:3002)                  │
└─────────────────────────────────────────────────────────────┘

Test 1: Get Calendar           [ ] PASS  [ ] FAIL  [ ] SKIP
Test 2: Create Reservation     [ ] PASS  [ ] FAIL  [ ] SKIP
Test 3: Create Blocked Dates   [ ] PASS  [ ] FAIL  [ ] SKIP
Test 4: Update Reservation     [ ] PASS  [ ] FAIL  [ ] SKIP
Test 5: Cancel Reservation     [ ] PASS  [ ] FAIL  [ ] SKIP

Error Tests:
Test 6: Missing Auth           [ ] PASS  [ ] FAIL  [ ] SKIP
Test 7: Missing Fields         [ ] PASS  [ ] FAIL  [ ] SKIP
Test 8: Date Conflict          [ ] PASS  [ ] FAIL  [ ] SKIP
Test 9: Property Not Found     [ ] PASS  [ ] FAIL  [ ] SKIP

─────────────────────────────────────────────────────────────
Overall Status: [ ] ALL PASS  [ ] SOME FAIL  [ ] NOT TESTED
```

---

## 🐛 Bug Report Template

Če test odpove, izpolni:

````markdown
### Bug Report

**Test:** [Ime testa]
**Endpoint:** `[METHOD] /api/tourism/calendar`
**Date:** 2026-03-13

**Expected:**

```json
{
  "success": true,
  ...
}
```
````

**Actual:**

```json
{
  "error": "..."
}
```

**Status Code:** 500

**Steps to Reproduce:**

1. ...
2. ...
3. ...

**Error Log:**

```
[Attach error log from terminal]
```

**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

````

---

## ✅ Checklist Pred Testiranjem

- [ ] Dev server teče (`npm run dev`)
- [ ] Database je povezan (Prisma Studio deluje)
- [ ] Testni user obstaja
- [ ] Testni property obstaja
- [ ] Postman/Thunder Client nameščen
- [ ] cURL na voljo (opcija)
- [ ] Terminal odprt za logiranje napak

---

## 🚀 Quick Start Commands

```bash
# 1. Zaženi dev server
npm run dev

# 2. Odpri Prisma Studio (v novem terminalu)
npx prisma studio

# 3. Testiraj GET endpoint
curl -X GET "http://localhost:3002/api/tourism/calendar?propertyId=test&year=2026&month=4"

# 4. Testiraj POST endpoint
curl -X POST "http://localhost:3002/api/tourism/calendar" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"test","type":"reservation","checkIn":"2026-04-01","checkOut":"2026-04-05","guestEmail":"test@example.com"}'
````

---

**Ready to test! 🧪**
