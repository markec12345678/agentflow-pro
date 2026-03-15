# ✅ Testna Checklista: Calendar API

## 📋 Priprava

- [ ] Dev server teče (`npm run dev`)
- [ ] Database je povezan (Prisma Studio deluje)
- [ ] Testni user obstaja (preveri v Prisma Studio)
- [ ] Testni property obstaja (ustvari če ga ni)
- [ ] Terminal odprt v `f:\ffff\agentflow-pro\testing`
- [ ] PowerShell ali cURL na voljo

---

## 🧪 Avtomatski Testi

### Opcija 1: PowerShell (Windows)

```powershell
cd testing
.\test-calendar-api.ps1
```

**Rezultati:**

- [ ] Test 1: GET Calendar - ✅/❌
- [ ] Test 2: POST Create Reservation - ✅/❌
- [ ] Test 3: POST Create Blocked Dates - ✅/❌
- [ ] Test 4: PATCH Update Reservation - ✅/❌
- [ ] Test 5: DELETE Cancel Reservation - ✅/❌
- [ ] Test 6: Missing Authentication - ✅/❌
- [ ] Test 7: Missing Required Fields - ✅/❌

**Skupaj:** \_/7 uspešnih

---

### Opcija 2: Bash (Linux/Mac/WSL)

```bash
cd testing
chmod +x test-calendar-api.sh
./test-calendar-api.sh
```

**Rezultati:**

- [ ] Test 1: GET Calendar - ✅/❌
- [ ] Test 2: POST Create Reservation - ✅/❌
- [ ] Test 3: POST Create Blocked Dates - ✅/❌
- [ ] Test 4: PATCH Update Reservation - ✅/❌
- [ ] Test 5: DELETE Cancel Reservation - ✅/❌
- [ ] Test 6: Missing Authentication - ✅/❌
- [ ] Test 7: Missing Required Fields - ✅/❌

**Skupaj:** \_/7 uspešnih

---

## 🎯 Ročno Testiranje (Postman/Thunder Client)

### Test 1: Get Calendar

- [ ] Odpri `GET /api/tourism/calendar?propertyId=xxx&year=2026&month=4`
- [ ] Dodaj session cookie
- [ ] Pošlji request
- [ ] Preveri response: `200 OK`
- [ ] Preveri body: `{ success: true, days: [...], ... }`

### Test 2: Create Reservation

- [ ] Odpri `POST /api/tourism/calendar`
- [ ] Nastavi body:
  ```json
  {
    "propertyId": "xxx",
    "type": "reservation",
    "checkIn": "2026-04-01",
    "checkOut": "2026-04-05",
    "guestEmail": "test@example.com"
  }
  ```
- [ ] Pošlji request
- [ ] Preveri response: `201 Created`
- [ ] Preveri body: `{ success: true, reservation: {...} }`

### Test 3: Create Blocked Dates

- [ ] Odpri `POST /api/tourism/calendar`
- [ ] Nastavi body:
  ```json
  {
    "propertyId": "xxx",
    "type": "blocked",
    "checkIn": "2026-04-10",
    "checkOut": "2026-04-15",
    "notes": "Renoviranje"
  }
  ```
- [ ] Pošlji request
- [ ] Preveri response: `201 Created`
- [ ] Preveri body: `{ success: true, blockedDates: [...] }`

### Test 4: Update Reservation

- [ ] Odpri `PATCH /api/tourism/calendar`
- [ ] Nastavi body:
  ```json
  {
    "id": "res_xxx",
    "status": "confirmed",
    "notes": "Updated",
    "totalAmount": 450
  }
  ```
- [ ] Pošlji request
- [ ] Preveri response: `200 OK`
- [ ] Preveri body: `{ success: true, reservation: {...} }`

### Test 5: Cancel Reservation

- [ ] Odpri `DELETE /api/tourism/calendar?id=res_xxx&type=reservation`
- [ ] Pošlji request
- [ ] Preveri response: `200 OK`
- [ ] Preveri body: `{ success: true, message: "..." }`

---

## ⚠️ Error Scenariji

### Test 6: Missing Authentication

- [ ] Pošlji POST brez session cookie-ja
- [ ] Preveri response: `401 Unauthorized`
- [ ] Preveri body: `{ error: "Authentication required" }`
- [ ] ✅ Pričakovano vedenje

### Test 7: Missing Required Fields

- [ ] Pošlji POST samo z `propertyId`
- [ ] Preveri response: `400 Bad Request`
- [ ] Preveri body: `{ error: "Missing required fields..." }`
- [ ] ✅ Pričakovano vedenje

### Test 8: Date Conflict

- [ ] Ustvari rezervacijo za določene datume
- [ ] Poskusi ustvariti drugo za iste datume (brez overbooking)
- [ ] Preveri response: `409 Conflict`
- [ ] Preveri body: `{ error: "Date range conflicts..." }`
- [ ] ✅ Pričakovano vedenje

### Test 9: Property Not Found

- [ ] Pošlji POST z `propertyId: "non-existent"`
- [ ] Preveri response: `404 Not Found`
- [ ] Preveri body: `{ error: "Property not found" }`
- [ ] ✅ Pričakovano vedenje

---

## 📊 Povzetek Testiranja

### Datum: ******\_\_\_******

### Tester: ******\_\_\_******

### Rezultati:

| Kategorija       | Uspešni    | Skupaj | %           |
| ---------------- | ---------- | ------ | ----------- |
| Avtomatski testi | \_\_\_     | 7      | \_\_\_%     |
| Ročni testi      | \_\_\_     | 5      | \_\_\_%     |
| Error scenariji  | \_\_\_     | 4      | \_\_\_%     |
| **SKUPAJ**       | **\_\_\_** | **16** | **\_\_\_%** |

### Status:

- [ ] ✅ Vsi testi uspeli (100%)
- [ ] ⚠️ Nekateri testi padli (<100%)
- [ ] ❌ Večina testov padla (<50%)

---

## 🐛 Najdene Napake

### Napaka #1

- **Test:** ******\_\_\_******
- **Opis:** ******\_\_\_******
- **Status Code:** **\_\_\_**
- **Expected:** ******\_\_\_******
- **Actual:** ******\_\_\_******
- **Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

### Napaka #2

- **Test:** ******\_\_\_******
- **Opis:** ******\_\_\_******
- **Status Code:** **\_\_\_**
- **Expected:** ******\_\_\_******
- **Actual:** ******\_\_\_******
- **Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

---

## ✅ Zaključek

### Ali je API pripravljen na production?

- [ ] ✅ DA - Vsi testi so uspeli
- [ ] ❌ NE - Popravi napake in ponovi teste

### Naslednji koraki:

- [ ] Shrani rezultate v `.snapshots/TEST-RESULTS-YYYY-MM-DD.md`
- [ ] Ustvari bug reporte za padle teste
- [ ] Nadaljuj z refactoringom drugih API-jev

---

**Podpis testerja:** ******\_\_\_******  
**Datum zaključka:** ******\_\_\_******
