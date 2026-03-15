# 🚨 HITRI POPRAVEK - Dashboardi se ne nalagajo

## Problem
"Vmesniki dashboardsi se mi ne naložijo" - Dashboard interfaces not loading

---

## ⚡ HITRA REŠITEV (5 minut)

### 1. Zaženi avtomatski fix skripto

```bash
node scripts/fix-dashboard-loading.js
```

To bo:
- ✅ Preveril .env datoteko
- ✅ Namestil odvisnosti
- ✅ Generiral Prisma client
- ✅ Konfiguriral bazo (če je mogoče)
- ✅ Počistil cache
- ✅ Zagnal dev server

### 2. ALI ročno nastavi .env

Ustvari `.env` datoteko z minimalnimi vrednostmi:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/agentflow"
NEXTAUTH_SECRET="TVOJ_32_ZNAKOV_SECRET_KEY_HERE"
NEXTAUTH_URL="http://localhost:3002"
MOCK_MODE="true"
```

**Generiraj NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Namesti in zaženi

```bash
npm install
npm run db:generate
npm run dev
```

---

## 🔍 DIAGNOSTIKA

### Kateri dashboardi se ne nalagajo?

Testiraj vsakega posebej:

| URL | Status | Napaka |
|-----|--------|--------|
| http://localhost:3002/dashboard | ⬜ | |
| http://localhost:3002/dashboard/tourism | ⬜ | |
| http://localhost:3002/dashboard/receptor | ⬜ | |
| http://localhost:3002/dashboard/properties | ⬜ | |
| http://localhost:3002/dashboard/tourism/calendar | ⬜ | |

### Zaženi diagnostično skripto

```bash
npx tsx scripts/diagnose-dashboard-loading.ts
```

To bo:
- Testiralo vse dashboard route
- Posnelo screenshot-e
- Zabeležilo vse napake
- Ustvarilo poročilo v `screenshots/dashboard-diagnostic/`

---

## 🎯 NAJPOGOSTEJŠE NAPAKE IN REŠITVE

### ❌ "Prisma Client is not imported"

**Rešitev:**
```bash
npm run db:generate
```

### ❌ "connect ECONNREFUSED 127.0.0.1:5432"

**Pomen:** PostgreSQL ne teče

**Rešitev:**

**Option A: Lokalni PostgreSQL**
```bash
# Windows - preveri service
Get-Service -Name postgresql*

# Zaženi PostgreSQL
Start-Service postgresql-x64-14
```

**Option B: Supabase (priporočeno)**
1. Odpri https://supabase.com
2. Ustvari nov project
3. Kopiraj connection string
4. Posodobi `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### ❌ "Invalid NEXTAUTH_SECRET"

**Rešitev:**
```bash
openssl rand -base64 32
# Kopiraj output v .env
NEXTAUTH_SECRET="output-iz-zgornjega-ukaza"
```

### ❌ Stran visi na "Loading..."

**Debug:**
1. Odpri DevTools (F12) → Console
2. Išči rdeče napake
3. Preveri Network tab za failed requeste
4. Poglej `/api/dashboard/boot` status

**Rešitev:**
- Preveri console napake
- Preveri če baza teče
- Poženi `npm run db:migrate`

### ❌ Prazna/bela stran

**Preveri:**
1. Browser console za napake
2. Server terminal za compilation errors
3. Next.js build loge

**Rešitev:**
```bash
# Počisti cache in rebuild
rm -rf .next node_modules/.cache
npm run dev

# Preveri TypeScript errors
npx tsc --noEmit
```

---

## 📊 API ENDPOINT TEST

Testiraj boot API direktno:

```bash
# Brez avtentikacije (vrne 401)
curl http://localhost:3002/api/dashboard/boot

# S cookie-jem iz brskalnika
curl http://localhost:3002/api/dashboard/boot \
  -H "Cookie: next-auth.session-token=TVOJ_TOKEN"
```

**Pričakovan odgovor brez auth:**
```json
{
  "error": "Unauthorized"
}
```

**Pričakovan odgovor z auth:**
```json
{
  "profile": { 
    "onboarding": { "industry": "tourism" } 
  },
  "usage": { ... },
  "activePropertyId": null,
  "hasProperty": false,
  ...
}
```

---

## 🛠️ NAPREDNO REŠEVANJE

### Omogoči debug logging

Dodaj v `.env`:
```bash
DEBUG=true
LOG_LEVEL=debug
```

Preveri server loge za:
- "Dashboard boot"
- "API route"
- "Prisma"
- "Error"

### Validacija database sheme

```sql
-- Poveži se na bazo
psql -U postgres -d agentflow

-- Izpiši vse tabele
\dt

-- Mora vsebovati:
# User, Account, Session, VerificationToken
# Onboarding, Property, Booking, ContentHistory
# WorkflowCheckpoint, SmartAlertLog, itd.
```

Če manjkajo tabele:
```bash
npm run db:migrate
npm run db:push
```

### Analiza omrežnih zahtevkov

Odpri DevTools → Network tab:

1. Filtriraj: `dashboard` ali `api`
2. Išči:
   - Rdeče (failed) requeste
   - Dolge response čase (>5s)
   - 4xx ali 5xx status kode
   
3. Klikni na `/api/dashboard/boot`
4. Preveri:
   - **Headers**: Status code, cookies
   - **Response**: JSON payload
   - **Timing**: DNS, TCP, SSL, TTFB

---

## ✅ USPEH KRITERIJI

Dashboard dela ko:

1. ✅ Stran se naloži v < 3 sekundah
2. ✅ Ni console errorjev
3. ✅ Vsi KPI cardi prikazujejo podatke
4. ✅ Sidebar navigacija vidna in deluje
5. ✅ Ni infinite loading state-ov
6. ✅ API `/api/dashboard/boot` vrne veljaven JSON
7. ✅ Lahko navigiraš na sub-page
8. ✅ Dark mode toggle dela
9. ✅ Mobile responsive design dela

---

## 📝 CHECKLISTA PO KORAKIH

### Korak 1: Environment
- [ ] `.env` datoteka obstaja
- [ ] `DATABASE_URL` nastavljen
- [ ] `NEXTAUTH_SECRET` nastavljen (min 32 znakov)
- [ ] `NEXTAUTH_URL` = `http://localhost:3002`
- [ ] `MOCK_MODE="true"` (za development)

### Korak 2: Database
- [ ] PostgreSQL teče (lokalno ali Supabase)
- [ ] Baza `agentflow` obstaja
- [ ] Connection string pravilen
- [ ] Migrations aplicirane (`npm run db:migrate`)
- [ ] Prisma client generiran (`npm run db:generate`)

### Korak 3: Dependencies
- [ ] `npm install` uspešen
- [ ] Vse dependencie nameščene
- [ ] Ni version conflictov

### Korak 4: Build
- [ ] Cache počiščen (`rm -rf .next`)
- [ ] `npm run dev` se zažene brez errorjev
- [ ] Ni TypeScript compilation errors
- [ ] Server teče na port 3002

### Korak 5: Testing
- [ ] `/dashboard` se naloži
- [ ] `/dashboard/tourism` se naloži
- [ ] `/dashboard/receptor` se naloži
- [ ] Ni console errorjev
- [ ] API endpointi delujejo

---

## 🆘 ŠE VEDNO NE DELA?

### Zberi diagnostiko:

```bash
# Zaženi full diagnostic
npx tsx scripts/diagnose-dashboard-loading.ts

# Preveri poročilo
cat screenshots/dashboard-diagnostic/diagnostic-report.json
```

### Pošlji te informacije:

- OS in verzija
- Node.js verzija (`node --version`)
- npm verzija (`npm --version`)
- PostgreSQL verzija (če lokalno)
- Database provider (local/Supabase/Neon)
- Celotni errorji iz console-a
- Screenshot-i iz diagnostic skripte
- `.env` vsebina (brez sensitive values)

---

## 📞 KONTAKTIRAJ PODPORO

Če potrebuješ dodatno pomoč, odpri issue z:

1. Opisom problema
2. Koraki ki si jih že poskusil
3. Diagnostičnim poročilom
4.Screenshot-i napak

---

**Zadnja posodobitev:** 2026-03-12  
**Status:** Aktivni troubleshooting guide
