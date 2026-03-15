# 🚀 TAKOJ: Testirati API Ročno - Navodila

## ✅ Kaj Je Bilo Ustvarjeno

### 📁 Testne Datoteke

| Datoteka                                  | Opis                         | Kako Uporabiti            |
| ----------------------------------------- | ---------------------------- | ------------------------- |
| **`testing/MANUAL-TEST-CALENDAR-API.md`** | Popolna testna dokumentacija | Odpri in sledi navodilom  |
| **`testing/test-calendar-api.ps1`**       | PowerShell testna skripta    | `.\test-calendar-api.ps1` |
| **`testing/test-calendar-api.sh`**        | Bash testna skripta          | `./test-calendar-api.sh`  |
| **`testing/README-QUICK-START.md`**       | Hitri začetek                | Preberi za hiter start    |
| **`testing/TESTNA-CHECKLISTA.md`**        | Checklista za testiranje     | Natisni in obkljukaj      |

---

## 🎯 Hitri Začetek (5 minut)

### Korak 1: Zaženi Dev Server

```bash
cd f:\ffff\agentflow-pro
npm run dev
```

✅ Server teče na `http://localhost:3002`

### Korak 2: Zaženi Teste

```bash
cd testing
.\test-calendar-api.ps1
```

✅ 7 testov se bo izvedlo avtomatsko

### Korak 3: Preveri Rezultate

```
✅ PASS - Test 1: GET Calendar
✅ PASS - Test 2: POST Create Reservation
✅ PASS - Test 3: POST Create Blocked Dates
✅ PASS - Test 4: PATCH Update Reservation
✅ PASS - Test 5: DELETE Cancel Reservation
✅ PASS - Test 6: Missing Authentication
✅ PASS - Test 7: Missing Required Fields

Test Suite Complete!
```

---

## 📊 Kaj Testiramo

### Funkcionalni Testi (5)

1. ✅ **GET Calendar** - Pridobi koledar za property
2. ✅ **POST Create Reservation** - Ustvari novo rezervacijo
3. ✅ **POST Create Blocked Dates** - Blokiraj datume
4. ✅ **PATCH Update Reservation** - Posodobi rezervacijo
5. ✅ **DELETE Cancel Reservation** - Prekliči rezervacijo

### Error Testi (2)

6. ✅ **Missing Authentication** - Brez session cookie-ja → 401
7. ✅ **Missing Required Fields** - Manjkajoči fieldi → 400

---

## 🔧 Orodja

### Izbira Orodja:

| Orodje                     | Prednosti                    | Slabosti           | Priporočilo |
| -------------------------- | ---------------------------- | ------------------ | ----------- |
| **PowerShell Skripta**     | Avtomatsko, hitro, enostavno | Samo Windows       | ⭐⭐⭐⭐⭐  |
| **Bash Skripta**           | Avtomatsko, cross-platform   | Zahteva bash       | ⭐⭐⭐⭐    |
| **Postman/Thunder Client** | Vizualno, interaktivno       | Ročno, počasneje   | ⭐⭐⭐      |
| **cURL Commands**          | Univerzalno, scriptable      | Zahteva poznavanje | ⭐⭐⭐      |

---

## 📝 Postopek Testiranja

### 1. Priprava (2 minuti)

- [ ] Zaženi dev server
- [ ] Odpri terminal v `testing/` mapi
- [ ] Preveri da je database povezan

### 2. Izvedi Teste (1 minuta)

- [ ] Zaženi `.\test-calendar-api.ps1`
- [ ] Počakaj na rezultate

### 3. Analiziraj Rezultate (2 minuti)

- [ ] Preveri število uspešnih testov
- [ ] Če so napake, preberi error message
- [ ] Shrani rezultate

### 4. Dokumentiraj (1 minuta)

- [ ] Izpolni `TESTNA-CHECKLISTA.md`
- [ ] Zapiši morebitne bug-e
- [ ] Shrani v `.snapshots/`

**Skupni čas:** ~6 minut

---

## 🎯 Pričakovani Rezultati

### Vse Deluje ✅

```
Test Suite Complete!
7/7 tests passed

Status: ALL PASS ✅
```

**Akcija:** Nadaljuj z drugimi API-ji

### Nekaj Ne Deluje ⚠️

```
Test Suite Complete!
5/7 tests passed

Failed:
- Test 2: POST Create Reservation (500 Error)
- Test 4: PATCH Update Reservation (404 Not Found)
```

**Akcija:**

1. Preveri server loge
2. Preveri database connection
3. Popravi napake
4. Ponovi teste

---

## 🐛 Debugging Scenariji

### Scenario 1: Server Ne Odgovarja

**Error:** `Connection refused` ali `ECONNREFUSED`

**Rešitev:**

```bash
# Preveri če server teče
npm run dev

# Preveri port
netstat -ano | findstr :3002

# Restartaj server
Ctrl+C
npm run dev
```

---

### Scenario 2: Database Error

**Error:** `Can't connect to database` ali `PrismaClientInitializationError`

**Rešitev:**

```bash
# Preveri .env.local
cat .env.local | grep DATABASE_URL

# Restartaj Prisma
npx prisma generate
npx prisma db push

# Preveri database
npx prisma studio
```

---

### Scenario 3: Authentication Error

**Error:** `401 Unauthorized` pri vseh testih

**Rešitev:**

1. Prijavi se v aplikacijo (`http://localhost:3002/api/auth/signin`)
2. Kopiraj session cookie iz brskalnika
3. Posodobi `$testCookie` v testni skripti

---

### Scenario 4: Property Not Found

**Error:** `404 Not Found` z `{ error: "Property not found" }`

**Rešitev:**

1. Odpri Prisma Studio: `npx prisma studio`
2. Ustvari nov property v `Property` tabeli
3. Kopiraj ID
4. Posodobi testne skripte z novim ID-jem

---

## 📊 Rezultate Shrani

### Shrani Output

```powershell
# PowerShell
.\test-calendar-api.ps1 > results-$(Get-Date -Format "yyyyMMdd-HHmmss").txt

# Bash
./test-calendar-api.sh > results-$(date +%Y%m%d-%H%M%S).txt
```

### Naredi Screenshot

- **Windows:** Win + Shift + S
- **Mac:** Cmd + Shift + 4
- **Linux:** Shift + PrintScreen

### Izpolni Checklisto

Odpri `TESTNA-CHECKLISTA.md` in obkljukaj vse opravljene teste.

---

## ✅ Zaključek Testiranja

### Ko Vsi Testi Uspelo:

```
✅ Vsi testi so uspeli (100%)
✅ API deluje pravilno
✅ Refactoring je uspešen
✅ Pripravljeno na production
```

**Naslednji Korak:** Refaktoriti `/api/tourism/reservations`

---

### Ko Nekateri Testi Ne Uspelo:

```
⚠️ Nekateri testi niso uspeli (___%)
📝 Zapiši napake
🐛 Ustvari bug reporte
🔧 Popravi napake
🔄 Ponovi teste
```

**Naslednji Korak:** Popravi napake in ponovi teste

---

## 📞 Podpora

### Dokumentacija:

- [MANUAL-TEST-CALENDAR-API.md](./MANUAL-TEST-CALENDAR-API.md)
- [USE-CASE-FACTORY-PATTERN.md](../.snapshots/USE-CASE-FACTORY-PATTERN.md)
- [KONCNO-POROCILO.md](../.snapshots/KONCNO-POROCILO.md)

### Help:

- GitHub Issues: [Open Issue](https://github.com/your-repo/issues)
- Email: dev@example.com

---

## 🎯 Cilj

**Cilj:** Vsi testi morajo uspeti (7/7 = 100%)

**Čas:** ~6 minut

**Orodje:** PowerShell skripta (priporočeno)

**Status:** ⏳ Pending

---

**Ready to test! 🧪**
