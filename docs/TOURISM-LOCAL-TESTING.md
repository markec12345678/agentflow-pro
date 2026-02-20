# Tourism Layer - Lokalno Testiranje

Checklist za preverjanje tourism implementacije po KORAK 1-7.

---

## Phase 1 Checklist

### Database

- [x] Dodaj UserTemplate model v prisma/schema.prisma
- [ ] `npx prisma db push` (zahtevano: DATABASE_URL v .env)
- [ ] `npx prisma generate` (zahtevano: zapri procese, ki držijo node_modules)

### Pages

- [x] /dashboard/tourism – Overview s stats + quick actions (Hitri Začetek, Nedavni Template-i)
- [x] /dashboard/tourism/generate – Centraliziran generator (2-col layout, VariableForm, Save as Template)
- [x] /dashboard/tourism/templates – Seznam shranjenih template-ov (UI)

### Navigation

- [x] Posodobi sidebar z Tourism Hub dropdown (pogojno pri userIndustry tourism/travel-agency)
- [ ] Dodaj "Tourism Hub" link v glavni navbar (opcionalno)

### Testing

- [ ] Lokalni test: generiraj opis → shrani kot template → uporabi template
- [ ] Preveri responsive na mobilniku
- [ ] Preveri dark mode compatibility

### Phase 1 Test Flow

1. Login / register
2. Onboarding: izberi industrio "Tourism" ali "Travel Agency" (da vidiš Tourism Hub v sidebaru)
3. /dashboard/tourism – Overview: preveri stats, Hitri Začetek grid, Nedavni Template-i
4. Klikni "Booking.com Opis" (ali drug prompt) → /dashboard/tourism/generate?prompt=booking-description
5. Izpolni spremenljivke (Lokacija, Tip, Jezik, itd.), klikni "Generiraj Vsebino"
6. Po generiranju: modal "Shrani kot Template" – vnesi ime (npr. "Test Apartma"), klikni "Shrani"
7. /dashboard/tourism/templates – preveri, da se template prikaže
8. Klikni "Uporabi" → /dashboard/tourism/generate?template=... – preveri, da so vrednosti predizpolnjene

---

## Phase 2 Checklist

> **Specifikacije in Timeline**: Glej [TOURISM-PHASE2-SPEC.md](./TOURISM-PHASE2-SPEC.md) za 7-dnevni plan in zahteve "kako mora bit".

### Database

- [x] Dodaj LandingPage, SeoMetric, TranslationJob modele v prisma/schema.prisma
- [ ] `npx prisma db push` (zahtevano: DATABASE_URL v .env)
- [ ] `npx prisma generate` (zahtevano: zapri dev server in druge procese ki držijo node_modules; na Windows pogosto EPERM – zapri VS Code/Cursor, terminale)

### Pages

- [x] /dashboard/tourism/landing – Landing Page Generator (3-step flow)
- [x] /dashboard/tourism/email – Email Workflow za goste (Welcome, Follow-up, Sezonska)
- [x] /dashboard/tourism/seo – SEO Dashboard (keyword table, chart, filter/sort, Optimiziraj z AI)
- [x] /dashboard/tourism/translate – Multi-Language Batch Translator UI

### API

- [x] POST /api/tourism/generate-landing – generira vsebino po template in formData
- [x] POST /api/tourism/batch-translate – prevod vsebine v več jezikov (OpenAI)
- [x] POST /api/tourism/generate-email – generira guest emaile
- [x] Shranjevanje v LandingPage DB (Phase 3)

### Utilities

- [x] src/lib/tourism/publish-helpers.ts – formatForBooking, formatForAirbnb, generateHashtags
- [x] Integracija helpers v Tourism Generator UI (Kopiraj za Booking/Airbnb, Kopiraj hashtags)

### Sidebar (Tourism Hub)

- [x] Overview
- [x] Generate
- [x] Templates
- [x] Landing Page
- [x] Email
- [x] SEO
- [x] Multi-Language (batch translator)

### Testing

- [ ] Testiraj Landing Page generator z različnimi template-i (Standard, Luksuz, Družinski)
- [ ] Testiraj batch translate API z 2+ jeziki (POST /api/tourism/batch-translate) – glej Batch Translate curl primer spodaj
- [ ] Preveri da copy-paste helpers delujejo (Kopiraj za Booking, Airbnb, hashtags)
- [ ] Mobile responsive test za vse nove strani
- [ ] E2E: `npx playwright test tourism --project=chromium` (zahteva DATABASE_URL, e2e user iz seed)

### Phase 2 Use-Case Primeri

| Funkcija | Use-case |
|----------|----------|
| Landing Page | Apartma v Bela Krajina – izberi Standard template, vnesi podatke, generiraj v SL+EN |
| Email | Pred prihodom gosta – Welcome Email s check-in navodili v njegovem jeziku |
| SEO Dashboard | Spremljaj ključne besede (apartmaji bela krajina, počitnice kolpa), optimiziraj predloge |
| Batch Translate | Prevedi opis nastanitve iz SL v EN, DE, IT za multi-market listing |
| Publish Helpers | Po generiranju Booking opisa – klikni "Kopiraj za Booking.com" (formatira brez HTML/markdown), "Kopiraj za Airbnb" (omejuje line breaks), "Kopiraj hashtags" (generira Instagram hashtage iz lokacije + tipa) |

### Phase 2 UX Polish (vključeno)

- [x] Skeleton loading na tourism straneh (stats, templates, properties, translate)
- [x] Toast obvestila (Sonner) namesto alert()
- [x] Mobile responsive: grid breakpoints, min-h 44px tap targets, full-width gumbi na mobilniku
- [x] Dark mode: borders, hover, placeholder, focus ring, Skeleton pulse

### Phase 2 Test Flow (Landing Page)

1. Login / register, onboarding: Tourism ali Travel Agency
2. Sidebar: klikni "Landing Page" → /dashboard/tourism/landing
3. Step 1: izberi predlogo (npr. Standard) – avtomatsko prehod na Step 2
4. Step 2: vnesi Ime nastanitve, Lokacijo, izberi jezike (SL, EN), klikni "Generiraj Zdaj"
5. Step 3 – preveri Predogled, Export JSON/Markdown/HTML, Shrani
6. Klikni "← Uredi" za vrnitev na Step 2

### Phase 2 Test Flow (Email)

1. Sidebar: klikni "Email" → /dashboard/tourism/email
2. Izberi tip (Welcome, Follow-up, Sezonska)
3. Vnesi podatke (ime nastanitve, lokacija, jezik, check-in/out)
4. Klikni "Generiraj Email" – preveri rezultat, Kopiraj, Pošlji prek Gmaila
5. Welcome: izpolni Ime nastanitve, Lokacija → generiraj → preveri output
6. Follow-up: izberi Follow-up Email → generiraj → preveri vsebino o review
7. Sezonska: izberi Sezonska Ponudba → vnesi Sezona (npr. Poletje 2026), Ponudba (npr. 15% popust) → generiraj

Glej tudi E2E: [tests/e2e/tourism-email.spec.ts](../tests/e2e/tourism-email.spec.ts)

### Phase 2 Test Flow (Publish Helpers)

1. /dashboard/tourism/generate – izberi Booking.com prompt, izpolni spremenljivke (Lokacija, Tip, itd.), generiraj
2. Po generiranju: prikažejo se gumbi "Kopiraj za Booking.com", "Kopiraj za Airbnb", "Kopiraj hashtags"
3. Klikni "Kopiraj za Booking.com" – preveri toast "Kopirano v formatu za Booking.com"
4. Klikni "Kopiraj za Airbnb" – preveri toast "Kopirano v formatu za Airbnb"
5. Klikni "Kopiraj hashtags" – preveri toast "Hashtagi kopirani" (uporabi lokacija + tip iz formulirja)

### Phase 2 Test Flow (Multi-Language Batch Translator)

1. Sidebar: klikni "Multi-Language" → /dashboard/tourism/translate
2. Vstavi besedilo (npr. opis apartmaja v slovenščini)
3. Izberi izvorni jezik (npr. sl), ciljne jezike (EN, DE)
4. Klikni "Prevedi v izbrane jezike"
5. Preveri prevode, klikni "Kopiraj" pri vsakem jeziku
6. Brez OPENAI_API_KEY: mock prevodi (`[MOCK en] ...`)

### Batch Translate API – curl primer

**Predpogoj:** `DATABASE_URL` v `.env`, server teče (`npm run dev`), prijavljen si (session cookie).

```bash
# 1. Odpri http://localhost:3000/login, prijavi se
# 2. V DevTools → Application → Cookies: kopiraj vrednost next-auth.session-token
# 3. Zamenjaj YOUR_SESSION z vrednostjo

curl -X POST http://localhost:3000/api/tourism/batch-translate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"content":"Dobrodošli v apartmaju. Idealno za družinske počitnice v Bela Krajini.","sourceLang":"sl","targetLangs":["en","de","it","hr"]}'
```

Odziv: `{ "jobId": "...", "translations": { "en": "...", "de": "...", ... } }`

### Translation Quality – turistična terminologija (ročni QA)

Pri testiranju s pravim OPENAI_API_KEY preveri:

| Izraz | Pričakovano obnašanje |
|-------|------------------------|
| Apartma | Ohranjen ali preveden v "apartment" (EN), "Ferienwohnung" (DE) |
| Bela Krajina | Ohranjen (lastno ime regije) ali "Weiße Krajina" (DE) |
| Kolpa | Ohranjen (ime reke) |
| gostitelj | Preveden: host (EN), Gastgeber (DE) |

### Troubleshooting: Prisma generate EPERM (Windows)

Če `npx prisma generate` vrne `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`:

1. Zapri vse terminale, ki tečejo `npm run dev` ali druge Node procese
2. Zapri Cursor / VS Code (včasih drži file lock)
3. Požen `npx prisma generate` v novem terminalu
4. Če še vedno ne gre: `npm run postinstall` (teče tudi ob `npm install`)

---

## Quick Smoke Test (3 koraki)

1. **Restartaj dev server**
   ```bash
   npm run dev
   ```

2. **Odpri v brskalniku:**
   - http://localhost:3000
   - http://localhost:3000/onboarding
   - http://localhost:3000/workflows

3. **Testiraj generiranje:**
   - Izberi prompt: "Booking.com Opis Nastanitve" (v /prompts, filter Tourism)
   - Vnesi: Lokacija="Bela krajina", Tip="Apartma", Jezik="Slovenščina"
   - Klikni "Generate" (ali uporabi /chat) in preveri output

---

## 1. Priprava baze in dev serverja

```bash
# 1. Nastavi DATABASE_URL v .env (PostgreSQL)
# 2. Posodobi shemo (ustvari tabele landing_pages, seo_metrics, translation_jobs)
npm run db:push

# 3. Generiraj Prisma client (zapri dev server prej – na Windows pogosto EPERM če proces drži node_modules)
npx prisma generate

# 4. Zaženi dev server
npm run dev
```

Odpri http://localhost:3000

---

## 2. Strani za testiranje

| URL | Kaj preveriti |
|-----|---------------|
| http://localhost:3000 | Hero naslov: "Generate destination guides, hotel copy, and travel campaigns with AI Agents" |
| http://localhost:3000/onboarding | Tourism / Hospitality in Travel Agency / DMO na vrhu industrij |
| http://localhost:3000/prompts | Filtriraj po "Tourism" - 5 promptov (Booking.com, Airbnb, Vodič, Sezonska kampanja, Instagram) |
| http://localhost:3000/chat | Generiraj testni opis z placeholderji |
| http://localhost:3000/solutions/industry/tourism | Tourism & Hospitality industry stran |
| http://localhost:3000/solutions/tourism-marketing | Tourism Marketing Manager role stran |
| http://localhost:3000/dashboard/tourism | Tourism Hub overview (zahteva login + industry tourism) |
| http://localhost:3000/dashboard/tourism/generate | Centraliziran generator s publish helpers |
| http://localhost:3000/dashboard/tourism/landing | Landing Page Generator (3-step) |
| http://localhost:3000/dashboard/tourism/email | Email Workflow za goste |
| http://localhost:3000/dashboard/tourism/seo | SEO Dashboard (keywords, chart, Optimiziraj) |
| http://localhost:3000/dashboard/tourism/translate | Multi-Language Batch Translator |

---

## 3. Testni content - Booking.com opis

Uporabi prompt "Booking.com Opis Nastanitve" v /prompts ali /chat z vrednostmi:

- Lokacija: Bela krajina, Slovenija
- Tip: Apartma
- Osebe: 4
- Jezik: Slovenščina
- Ton: Prijazen

---

## 4. Preverjanje baze

Po generiranju contenta preveri, da se podatki shranijo (npr. BlogPost tabela, onboarding v bazi). `npm run db:push` posodobi shemo; za preverjanje podatkov uporabi Prisma Studio ali SQL client.

---

## 5. KORAK 9: Test Deploy na Vercel

### 5.1 Commit in push

```bash
git add .
git commit -m "feat: add tourism layer for hotels & DMOs"
git push origin feature/tourism-layer
```

### 5.2 Deploy na Vercel

- Odpri https://vercel.com/dashboard
- Izberi agentflow-pro projekt
- Deployaj branch: feature/tourism-layer
- Dobiš preview URL (npr. agentflow-pro-git-feature-tourism-layer.vercel.app)

### 5.3 Lokalni production build test

```bash
npm run build
npm run start
```

Preveri, da app deluje na http://localhost:3000 v production modu.

### 5.4 Environment variables na Vercel

Preveri v Vercel dashboard (Settings → Environment Variables):

| Variable | Status |
|----------|--------|
| DATABASE_URL | Obvezno |
| OPENAI_API_KEY | Obvezno za AI generiranje |
| NEXTAUTH_SECRET | Obvezno |
| NEXTAUTH_URL | Production URL |
| STRIPE_SECRET_KEY | Test mode za preview |

Za celoten seznam glej [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md).

---

## 6. Test Checklist Pred Launchem

| Test | Status |
|------|--------|
| Homepage prikazuje tourism kot prvo industrijo | - [ ] |
| Onboarding ima Tourism / Hospitality opcijo | - [ ] |
| Prompti se prikažejo v dropdownu | - [ ] |
| Generiranje dela za booking-description prompt | - [ ] |
| Content se shrani v bazo (BlogPost tabela) | - [ ] |
| Case study se prikaže na homepage | - [ ] |
| Build uspešen brez napak | - [ ] |
| Vercel preview deploy deluje | - [ ] |

---

## 7. Kaj Pričakovati Po Implementaciji

| Metrika | Pred | Po |
|---------|------|-----|
| Industrije v onboarding | 8 | 10 (tourism, travel-agency prvi) |
| Prompt template-i | ~10 | ~15 (+5 tourism) |
| Target market jasnost | Splošno | Turizem fokus |
| Case studies | Tech fokus | + Hospitality (Alpine Retreat) |
