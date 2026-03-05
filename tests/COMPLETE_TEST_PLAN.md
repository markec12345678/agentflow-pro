# 🧪 AgentFlow Pro - Popoln Testni Načrt

**Datum:** 2026-03-04  
**Verzija:** 1.0  
**Aplikacija:** AgentFlow Pro (GitHub App)

---

## 📋 Pregled Vseh Funkcij

### 1. 🔐 Avtentikacija in Uporabniki
- [ ] Prijava z GitHubom
- [ ] Odjava
- [ ] Trial period (7 dni)
- [ ] Protected routes zaščita
- [ ] Session management

### 2. 🏠 Landing Page
- [ ] Hero sekcija
- [ ] Features sekcija
- [ ] Pricing sekcija (če obstaja)
- [ ] Navigacija
- [ ] Responsive design

### 3. 📊 Dashboard
- [ ] Pregled agentov
- [ ] Pregled projektov
- [ ] Navigacija med sekcijami
- [ ] Upgrade to Pro kartica

### 4. 🤖 Agenti
- [ ] Pregled vseh agentov
- [ ] Kreiranje novega agenta
- [ ] Urejanje agenta
- [ ] Brisanje agenta
- [ ] Chat z agentom
- [ ] Različne role (assistant, web_developer, researcher, writer, analyst)

### 5. 📁 Projekti
- [ ] Pregled projektov
- [ ] Preview projekta (iframe)
- [ ] Podrobnosti projekta
- [ ] Povezava z agenti

### 6. 🔧 MCP Strežniki (20 konfiguriranih)
- [ ] filesystem - dostop do datotek
- [ ] fetch - HTTP zahteve
- [ ] playwright - brskalniška avtomatizacija
- [ ] excel - Excel dokumenti
- [ ] word - Word dokumenti
- [ ] pdf-reader - PDF branje
- [ ] everything-search - iskanje datotek
- [ ] deep-research - globoko raziskovanje
- [ ] firecrawl - web scraping
- [ ] mysql - MySQL baza
- [ ] web-scraping - web scraping
- [ ] griblje-bicycle - bicycle scraping
- [ ] griblje-muzej - museum scraping
- [ ] git - Git operacije
- [ ] memory - AI memory
- [ ] sequentialthinking - AI reasoning
- [ ] time - čas/datum
- [ ] kanban - Kanban board
- [ ] qwen-local - Qwen model
- [ ] mastergo - MasterGo design

### 7. 💾 Baza (SQLite/Prisma)
- [ ] Shranjevanje uporabnikov
- [ ] Shranjevanje agentov
- [ ] Shranjevanje projektov
- [ ] Trial/end dates
- [ ] Subscription status

---

## 🚀 Priprava Okolja

### Predpogoji
```bash
# 1. Preveri da je server zagnan
npm run dev

# 2. Preveri da je .env pravilno nastavljen
cat .env

# 3. Preveri da je GitHub App konfiguriran
# https://github.com/settings/apps/agentflow-pro
```

### Namesti potrebne pakete
```bash
# Playwright za E2E teste
pip install playwright
playwright install chromium

# Prisma za bazo
npx prisma generate
```

---

## 📝 Manualni Testi (Korak po Korak)

### TEST 1: Avtentikacija

**Koraki:**
1. Odpri http://localhost:3000
2. Klikni "Get Started" ali "Dashboard"
3. Preusmeritev na /login
4. Klikni "Sign in with GitHub"
5. GitHub avtorizacija stran
6. Klikni "Authorize agentflow-pro"
7. Preusmeritev nazaj na dashboard

**Pričakovani rezultat:**
- ✅ Uspešna preusmeritev na dashboard
- ✅ Uporabnik je prijavljen
- ✅ Viden je user menu zgoraj desno
- ✅ Trial period je nastavljen (7 dni)

**Preveri v bazi:**
```bash
npx prisma studio
# Preveri User tabelo:
# - email nastavljen
# - trialEndsAt nastavljen (7 dni od danes)
# - name iz GitHub profila
```

---

### TEST 2: Dashboard Navigacija

**Koraki:**
1. Prijava kot zgoraj
2. Klikni "Dashboard" v sidebarju
3. Klikni "Agents" v sidebarju
4. Klikni "Projects" v sidebarju
5. Klikni "Analytics" v sidebarju

**Pričakovani rezultat:**
- ✅ Vse strani se naložijo
- ✅ Sidebar je viden na desktop
- ✅ Mobile menu deluje (hamburger icon)
- ✅ Search bar deluje

---

### TEST 3: Kreiranje Agenta

**Koraki:**
1. Pojdi na /dashboard/agents
2. Klikni "Add Agent"
3. Izpolni formo:
   - Name: "Test Agent"
   - Role: "General Assistant"
   - Description: "Test description"
4. Klikni "Create Agent"

**Pričakovani rezultat:**
- ✅ Agent se ustvari
- ✅ Toast notification "Agent created successfully"
- ✅ Preusmeritev na /dashboard/agents
- ✅ Agent je viden na seznamu
- ✅ Status je "active" ali "inactive"

**Preveri v bazi:**
```bash
npx prisma studio
# Preveri Agent tabelo:
# - name: "Test Agent"
# - role: "assistant"
# - description: "Test description"
# - userId: tvoj user ID
```

---

### TEST 4: Urejanje in Brisanje Agenta

**Koraki:**
1. Na /dashboard/agents klikni "Manage" na agentu
2. Spremeni ime/description
3. Shrani
4. Klikni "Delete" (če obstaja)

**Pričakovani rezultat:**
- ✅ Spremembe se shranijo
- ✅ Agent se posodobi v bazi
- ✅ Brisanje deluje (če implementirano)

---

### TEST 5: Chat z Agentom

**Koraki:**
1. Na /dashboard/agents klikni "Chat" na agentu
2. Pojdi na /dashboard/agents/[id]/chat
3. Vnesi sporočilo
4. Pošlji

**Pričakovani rezultat:**
- ✅ Chat okno se odpre
- ✅ Sporočilo se pošlje
- ✅ Agent odgovori (če je implementirano)
- ✅ Sporočila se shranijo v bazo

---

### TEST 6: Projekti

**Koraki:**
1. Pojdi na /dashboard/projects
2. Preglej projekte (če obstajajo)
3. Klikni "View Details" na projektu

**Pričakovani rezultat:**
- ✅ Projekti se prikažejo v grid
- ✅ Iframe preview deluje
- ✅ Podrobnosti projekta se prikažejo
- ✅ Povezava z agentom je vidna

---

### TEST 7: Protected Routes

**Koraki:**
1. Odjavi se (Logout)
2. Poskusi dostopati do /dashboard
3. Poskusi dostopati do /dashboard/agents
4. Poskusi dostopati do /login

**Pričakovani rezultat:**
- ✅ /dashboard → preusmeri na /login
- ✅ /dashboard/agents → preusmeri na /login
- ✅ /login → dovoli dostop (ni protected)

---

### TEST 8: Trial/Subscription Flow

**Koraki:**
1. Prijavi se
2. Preveri v bazi trialEndsAt
3. Poskusi dostopati do dashboarda

**Pričakovani rezultat:**
- ✅ Trial je aktiven (7 dni)
- ✅ Dashboard je dostopen
- ✅ "Upgrade to Pro" kartica je vidna

---

## 🤖 Avtomatizirani Testi

### Playwright E2E Test Script

Ustvaril bom celovit test script:

```bash
python test_complete.py
```

---

## 🔧 MCP Strežnik Testi

### Test 1: Filesystem MCP
```bash
# Testiraj dostop do datotek
cd F:/d
dir
```

### Test 2: Fetch MCP
```bash
# Testiraj HTTP zahteve
curl https://api.github.com
```

### Test 3: Playwright MCP
```bash
# Testiraj brskalniško avtomatizacijo
# Odpri testno stran in naredi screenshot
```

### Test 4: Web Scraping MCP
```bash
# Testiraj scraping
# griblje-bicycle, griblje-muzej
```

---

## 📊 Baza Podatkov Testi

### Preveri SQLite Bazo
```bash
# Odpri Prisma Studio
npx prisma studio

# Preveri tabele:
- User
- Account
- Session
- Agent
- Project
- Subscription
```

### SQL Queryji za preverjanje
```sql
-- Preveri uporabnike
SELECT * FROM "User";

-- Preveri agente
SELECT * FROM "Agent" WHERE "userId" = 'tvoj-user-id';

-- Preveri projekte
SELECT * FROM "Project";

-- Preveri trial status
SELECT email, "trialEndsAt", createdAt FROM "User";
```

---

## ✅ Testni Checklist

### Kritični Testi (Must Pass)
- [ ] Prijava z GitHubom deluje
- [ ] Dashboard je dostopen prijavljenim uporabnikom
- [ ] Kreiranje agenta deluje
- [ ] Baza shranjuje podatke pravilno
- [ ] Protected routes so zaščitene

### Pomembni Testi (Should Pass)
- [ ] Urejanje agenta deluje
- [ ] Chat z agentom deluje
- [ ] Projekti se prikažejo pravilno
- [ ] Odjava deluje
- [ ] Responsive design deluje

### Dodatni Testi (Nice to Pass)
- [ ] MCP strežniki delujejo
- [ ] Web scraping deluje
- [ ] Analytics stran deluje
- [ ] Upgrade flow deluje

---

## 🐛 Porocanje Napak

Če najdeš napako, zabeleži:

```markdown
### Napaka: [Kratek opis]

**Koraki za reprodukcijo:**
1. ...
2. ...
3. ...

**Pričakovani rezultat:**
...

**Dejanski rezultat:**
...

**Screenshot:**
[prilepi screenshot]

**Console napake:**
[prilepi console napake]

**Okolje:**
- Browser: Chrome/Firefox/Safari
- OS: Windows/Mac/Linux
- URL: http://localhost:3000/...
```

---

## 📈 Metrike Uspešnosti

| Kategorija | Cilj | Dejansko | Status |
|------------|------|----------|--------|
| Avtentikacija | 100% | - | ⏳ |
| Dashboard | 100% | - | ⏳ |
| Agenti | 100% | - | ⏳ |
| Projekti | 100% | - | ⏳ |
| Baza | 100% | - | ⏳ |
| MCP Strežniki | 80% | - | ⏳ |

**Skupaj:** 0% complete

---

## 🎯 Naslednji Koraki

1. ✅ Odpri http://localhost:3000
2. ✅ Prijavi se z GitHubom
3. ✅ Sledi manualnim testom zgoraj
4. ✅ Zaženi avtomatizirane teste
5. ✅ Zabeleži rezultate
6. ✅ Popravi napake
7. ✅ Ponovno testiraj

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-04  
**Author:** AgentFlow Pro Testing Team
