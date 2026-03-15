# 🚀 Hitri Začetek: Testiranje Calendar API

## 1️⃣ Priprava (2 minuti)

### Korak 1: Zaženi Dev Server

```bash
cd f:\ffff\agentflow-pro
npm run dev
```

✅ Server teče na `http://localhost:3002`

### Korak 2: Odpri Terminal

```bash
# Windows PowerShell
cd f:\ffff\agentflow-pro\testing

# Ali odpri nov terminal v VS Code
Ctrl + Shift + ` (backtick)
```

---

## 2️⃣ Izberi Način Testiranja

### Opcija A: PowerShell Skripta (Priporočeno za Windows) ⭐

```powershell
cd testing
.\test-calendar-api.ps1
```

**Trajanje:** ~30 sekund  
**Rezultat:** 7 testov avtomatsko izvedenih

---

### Opcija B: Bash Skripta (Linux/Mac/WSL)

```bash
cd testing
chmod +x test-calendar-api.sh
./test-calendar-api.sh
```

**Trajanje:** ~30 sekund  
**Rezultat:** 7 testov avtomatsko izvedenih

---

### Opcija C: Ročno s cURL (Za napredne)

```bash
# Test 1: Get Calendar
curl -X GET "http://localhost:3002/api/tourism/calendar?propertyId=test&year=2026&month=4"

# Test 2: Create Reservation
curl -X POST "http://localhost:3002/api/tourism/calendar" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"test","type":"reservation","checkIn":"2026-04-01","checkOut":"2026-04-05","guestEmail":"test@example.com"}'
```

---

## 3️⃣ Interpretacija Rezultatov

### ✅ Vsi testi so uspeli:

```
========================================
  Test Suite Complete!
========================================

Test 1: GET Calendar           ✅ PASS
Test 2: POST Create Reservation ✅ PASS
Test 3: POST Blocked Dates      ✅ PASS
Test 4: PATCH Update Reservation ✅ PASS
Test 5: DELETE Cancel Reservation ✅ PASS
Test 6: Missing Auth            ✅ PASS
Test 7: Missing Fields          ✅ PASS
```

**Status:** 🎉 API deluje pravilno!

---

### ❌ Nekateri testi so padli:

#### Primer 1: Server ne teče

```
❌ FAIL - Connection refused
```

**Rešitev:**

```bash
npm run dev
# Počakaj da se server zažene
# Ponovno zaženi test
```

#### Primer 2: Napačen session

```
❌ FAIL - Status: 401 Unauthorized
```

**Rešitev:**

1. Prijavi se v aplikacijo
2. Kopiraj session cookie iz brskalnika
3. Posodobi `$TEST_COOKIE` v skripti

#### Primer 3: Property ne obstaja

```
❌ FAIL - Status: 404 Not Found
{"error": "Property not found"}
```

**Rešitev:**

1. Odpri Prisma Studio: `npx prisma studio`
2. Ustvari testni property
3. Kopiraj property ID
4. Posodobi testne skripte

---

## 4️⃣ Debugging

### Če testi ne delujejo:

#### 1. Preveri če server teče

```bash
curl http://localhost:3002/api/health
```

#### 2. Preveri database connection

```bash
npx prisma studio
# Če se odpre, je DB OK
```

#### 3. Preveri environment variables

```bash
# V .env.local preveri:
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3002
```

#### 4. Poglej server loge

```bash
# V terminalu kjer teče dev server
# Išči napake kot:
Error: Can't connect to database
Error: Missing environment variable
```

---

## 5️⃣ Napredno Testiranje

### Testiraj z Pravim Session-om

1. **Prijavi se v brskalniku:**
   - Odpri `http://localhost:3002/api/auth/signin`
   - Prijavi se z email/password

2. **Kopiraj Session Cookie:**
   - F12 → Application → Cookies
   - Kopiraj vrednost `next-auth.session-token`

3. **Posodobi Skripto:**
   ```powershell
   $testCookie = "next-auth.session-token=KOPIRAJ_TUKAJ"
   ```

---

### Testiraj Specifične Scenarije

#### Test: Date Conflict

```powershell
# 1. Ustvari rezervacijo za 2026-04-01 do 2026-04-05
# 2. Poskusi ustvariti drugo za iste datume
# 3. Pričakuj 409 Conflict

$body = @{
    propertyId = "test-property"
    type = "reservation"
    checkIn = "2026-04-01"
    checkOut = "2026-04-05"
    guestEmail = "test2@example.com"
    allowOverbooking = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body
```

#### Test: Overbooking Allowed

```powershell
# 1. Ustvari rezervacijo
# 2. Ustvari drugo z allowOverbooking = true
# 3. Pričakuj 201 Created z warning-om

$body = @{
    propertyId = "test-property"
    type = "reservation"
    checkIn = "2026-04-01"
    checkOut = "2026-04-05"
    guestEmail = "test2@example.com"
    allowOverbooking = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body
Write-Host "Warning: $($response.overbookingWarning)"
```

---

## 6️⃣ Rezultate Shrani

### Shrani Test Results

```powershell
# Zaženi teste in shrani output
.\test-calendar-api.ps1 > test-results-$(Get-Date -Format "yyyyMMdd-HHmmss").txt
```

### Ustvari Screenshot

```powershell
# Windows: Win + Shift + S
# Linux: Shift + PrintScreen
# Mac: Cmd + Shift + 4
```

---

## 7️⃣ Next Steps

### Če so vsi testi uspeli:

✅ API je pripravljen na production  
✅ Refactoring je uspešen  
✅ Nadaljuj z drugimi API-ji

### Če so testi padli:

📝 Zapiši napake v `.snapshots/BUG-REPORT.md`  
🐛 Odpri GitHub issue  
🔧 Popravi napake in ponovi teste

---

## 📞 Help & Support

### Dokumentacija:

- [MANUAL-TEST-CALENDAR-API.md](./MANUAL-TEST-CALENDAR-API.md) - Popolna dokumentacija
- [USE-CASE-FACTORY-PATTERN.md](../.snapshots/USE-CASE-FACTORY-PATTERN.md) - Arhitektura
- [KONCNO-POROCILO.md](../.snapshots/KONCNO-POROCILO.md) - Povzetek refactoringa

### Kontaktiraj:

- GitHub Issues: [Open Issue](https://github.com/your-repo/issues)
- Email: dev@example.com
- Slack: #calendar-api-testing

---

**Happy Testing! 🧪**
