# Kompleten Lokalni Test Checklist

Checklist za sistematično lokalno preverjanje Tourism Hub in povezanih funkcij. Označi postavke ob testiranju.

**Predpogoj:** `npm run dev`, `DATABASE_URL` v `.env`, onboarding z industrio Tourism ali Travel Agency.

---

## AI Generation

- [ ] **Vsi 5 tourism promptov generirajo smiseln content**
  - Booking.com Opis, Airbnb Storytelling, Vodič po Destinaciji, Sezonska Kampanja, Instagram Travel Caption
  - Test: [Generate](/dashboard/tourism/generate) – izberi vsak prompt, izpolni spremenljivke, generiraj
  - MOCK_MODE: brez OPENAI_API_KEY vrne `[MOCK]` vsebino
- [ ] **Multi-language (SL, EN, DE, IT, HR) deluje**
  - VariableForm prikazuje jezik dropdown; batch-translate podpira vseh 5
  - Test: [Translate](/dashboard/tourism/translate) – izberi 2+ ciljne jezike, prevedi
- [ ] **Toni (profesionalen, prijazen, luksuzen, družinski) so razločni**
  - Ton je vključen v vseh 5 promptih – [src/data/prompts.ts](src/data/prompts.ts)
  - Test: izberi različne tone pri generiranju, preveri izhod
- [ ] **Output je brez HTML/markdown napak**
  - Publish helpers: `formatForBooking` odstrani HTML/markdown – [publish-helpers.ts](src/lib/tourism/publish-helpers.ts)

---

## Database

- [ ] **UserTemplate CRUD deluje**
  - API: [api/user/templates](src/app/api/user/templates/route.ts), [api/user/templates/[id]](src/app/api/user/templates/[id]/route.ts)
  - Test: Generate → Shrani kot Template → Templates → Uporabi / Uredi / Izbriši
- [ ] **LandingPage save/load deluje**
  - API: [api/tourism/landing-pages](src/app/api/tourism/landing-pages/route.ts)
  - Test: Landing Page → Step 3 → Shrani; nato "Naloži shranjene strani" → izberi stran
- [ ] **TranslationJob status updates deluje**
  - API: batch-translate ustvari job in ga posodobi – [batch-translate/route.ts](src/app/api/tourism/batch-translate/route.ts)
  - Test: prevedi vsebino → Preveri v Prisma Studio ali z direktnim klicem
- [ ] **Prisma Studio prikazuje vse modele**
  - `npx prisma studio` – preveri UserTemplate, LandingPage, TranslationJob, Property, SeoMetric

---

## UI/UX

- [ ] **Loading states prikazujejo skeleton-e**
  - [Skeleton.tsx](src/web/components/Skeleton.tsx) – Generate, Email, Translate, Overview
- [ ] **Error messages so user-friendly**
  - toast ob napakah, ni `alert()` – [providers.tsx](src/app/providers.tsx) (Sonner)
- [ ] **Toast notifications se prikažejo ob akcijah**
  - Kopiraj, Shrani, Export – vsaka akcija prikaže toast
- [ ] **Dark mode deluje na vseh tourism straneh**
  - `dark:` classes na vseh tourism stranih
- [ ] **Mobile responsive (<768px) je usable**
  - grid-cols-1 sm:grid-cols-2, min-h-[44px] tap targets
  - Test: DevTools → Toggle device toolbar → 375px
- [ ] **Keyboard navigation deluje**
  - focus-visible:ring-2 na gumbih, Escape zapre modal (Save as Template)
  - Tab order smiseln
- [ ] **Vsi gumbi imajo hover/focus stanja**
  - hover:bg-*, focus-visible:ring-2

---

## Features

- [ ] **Landing Page generator (3-step flow)**
  - [Landing Page](/dashboard/tourism/landing) – Step 1 predloga, Step 2 form, Step 3 preview + export
- [ ] **Email workflow (welcome, follow-up, seasonal)**
  - [Email](/dashboard/tourism/email) – izberi tip, izpolni, generiraj, Kopiraj, Pošlji prek Gmaila
- [ ] **Batch translate (2+ jeziki hkrati)**
  - [Multi-Language](/dashboard/tourism/translate) – vstavi besedilo, izberi 2+ ciljne jezike
- [ ] **SEO dashboard (mock data prikaz)**
  - [SEO](/dashboard/tourism/seo) – keyword table, filter/sort, Recharts, Optimiziraj
- [ ] **Publish helpers (Booking/Airbnb format)**
  - Generate → po generiranju: Kopiraj za Booking.com, Airbnb, hashtags
  - [publish-helpers.ts](src/lib/tourism/publish-helpers.ts)
- [ ] **Export functions (JSON, Markdown, HTML)**
  - Landing Page Step 3: Export JSON, Export Markdown, Export HTML
  - Shrani – shrani v LandingPage DB
- [ ] **Templates save/load**
  - [Templates](/dashboard/tourism/templates) – shrani iz Generate, uporabi z predizpolnjenimi vrednostmi, Uporabi → Izbriši
- [ ] **Properties CRUD**
  - [Nastanitve](/dashboard/tourism/properties) – Dodaj nastanitev, Uredi, Izbriši

---

## Testing

- [ ] **Unit testi za tourism helperje**
  - `npm run test -- tests/tourism tests/lib/tourism`
  - [prompts.test.ts](tests/tourism/prompts.test.ts), [publish-helpers.test.ts](tests/lib/tourism/publish-helpers.test.ts)
- [ ] **E2E test za tourism user journey**
  - `npx playwright test tourism --project=chromium`
  - Zahteva: DATABASE_URL, e2e user iz seed – glej [TOURISM-LOCAL-TESTING.md](TOURISM-LOCAL-TESTING.md)
- [ ] **Lighthouse score >90 za vse kategorije**
  - Ročno: Chrome DevTools → Lighthouse → Run audit
  - Glej [UI-UX-CHECKLIST.md](UI-UX-CHECKLIST.md)
- [ ] **No console errors v production build**
  - `npm run build && npm run start` – odpri stran, preveri Console v DevTools

---

## Documentation

- [ ] **TOURISM-USER-GUIDE.md kompletan**
  - [docs/TOURISM-USER-GUIDE.md](TOURISM-USER-GUIDE.md) – vse funkcije opisane
- [ ] **API dokumentacija posodobljena**
  - [api.md](api.md) – referenca na Tourism API
  - [TOURISM-API.md](TOURISM-API.md) – tourism endpointe
- [ ] **CHANGELOG.md z vsemi Phase 1+2 funkcijami**
  - [CHANGELOG.md](CHANGELOG.md) – Phase 1, 2, 3 z vsemi funkcijami

---

## Quick Smoke (3 koraki)

1. `npm run dev` → http://localhost:3000
2. Login / Onboarding → Tourism ali Travel Agency
3. Tourism Hub → Generate → izberi Booking.com → vnesi lokacija, tip, jezik → Generiraj

---

## Opombe

- **MOCK_MODE:** Če ni OPENAI_API_KEY, AI generiranje vrne mock vsebino – uporabno za lokalno testiranje brez API ključa.
- **Prisma:** `npx prisma generate` zahteva zaprt dev server (EPERM na Windows).
- **E2E:** Za Playwright E2E potreben DATABASE_URL in seed z e2e uporabnikom.
