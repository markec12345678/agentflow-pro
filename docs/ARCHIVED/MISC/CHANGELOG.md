# Changelog

All notable changes to AgentFlow Pro are documented here.

---

## Unreleased

### 7-Day Tourism Sprint (Feb 2026)

**Day 1 – UI/UX Polish**
- Overview: error state + toast ob napakah fetch stats/templates
- Properties: pravilni loading states (skeleton med fetch), toast ob napaki
- SEO: toast ob napaki fetch metrik (namesto tihega fallback)
- Templates: toast ob napaki nalaganja

**Day 2 – Prompt Optimization**
- booking-description: enotna `{ton}`, vodič za `kljucne_besede`
- airbnb-story: dodani `tip`, `osebe`, `ton` v variables
- destination-guide: popravek oštevilčenja (6. Zaključni)
- seasonal-campaign: primeri za `ponudba`, dodan `ton`
- prompts.test.ts: validacija novih variables

**Day 3 – Testing Suite**
- API: Properties, LandingPages, SEO metrics (tests/api/tourism/)
- E2E: tourism-templates.spec.ts, Landing 3-step flow v tourism.spec.ts

**Day 4 – Documentation**
- TOURISM-API: Properties API, User templates API
- api.md: referenca na Properties in User templates
- TOURISM-USER-GUIDE: Nastanitve (Properties) sekcija
- COMPLETE-LOCAL-TEST-CHECKLIST: Properties CRUD

**Day 5 – Mobile Audit**
- Properties edit form: dark mode, responsive inputs, min-h-44px
- UI-UX-CHECKLIST: Mobile Audit tabela, Lighthouse strani

**Day 6 – Performance**
- PERFORMANCE-AUDIT.md: Lighthouse template in cilji
- SEO: dinamični import Recharts (SeoKeywordChart) za manjši bundle

**Day 7 – QA**
- SEO modal: htmlFor, aria-label za dostopnost
- Regression: 160 testov pass, build uspešen

### Tourism Hub (Phase 3)

- Landing Page Generator UI (`/dashboard/tourism/landing`) – 3-step flow, export JSON/Markdown/HTML, Shrani v bazo
- LandingPage CRUD API – `GET/POST /api/tourism/landing-pages`, `GET/PATCH/DELETE /api/tourism/landing-pages/[id]`
- Toni (`{ton}`) v vseh 5 tourism promptih – profesionalen, prijazen, luksuzen, družinski
- UserTemplate API unit testi – `tests/api/user-templates.test.ts`

### Tourism Hub (Phase 1)

- Overview page (`/dashboard/tourism`) – stats, Hitri Začetek, Nedavni Template-i
- Content Generator (`/dashboard/tourism/generate`) – 5 tourism promptov (Booking.com, Airbnb, Vodič, Sezonska, Instagram)
- Templates (`/dashboard/tourism/templates`) – shranjevanje in ponovna uporaba template-ov
- Onboarding industry filter – Tourism / Travel Agency prikaže Tourism Hub v sidebaru

### Tourism Hub (Phase 2)

- Landing Page Generator (`/dashboard/tourism/landing`) – 3-step flow, predloge: Standard, Luksuz, Družinski
- Email Workflow (`/dashboard/tourism/email`) – Welcome, Follow-up, Sezonska; Kopiraj, Pošlji prek Gmaila
- SEO Dashboard (`/dashboard/tourism/seo`) – keyword tracking, priority badges, filter/sort, Recharts graf, Optimiziraj z AI
- Multi-Language Translator (`/dashboard/tourism/translate`) – batch prevod v SL, EN, DE, IT, HR

### Publish Helpers

- `formatForBooking(content)` – odstrani HTML/markdown, omejitev ~4900 znakov
- `formatForAirbnb(content)` – max 2 zaporedna preloma vrstic
- `generateHashtags(location, type)` – do 10 hashtagov iz lokacije in tipa

### API

- `POST /api/tourism/generate-content` – turistična vsebina (topic/prompt)
- `POST /api/tourism/generate-email` – gostinski emaili (prompt, variables)
- `POST /api/tourism/batch-translate` – batch prevod v več jezikov
- `POST /api/tourism/generate-landing` – landing page vsebina (template, formData, languages)
- `GET/POST /api/tourism/landing-pages` – seznam, ustvarjanje landing strani
- `GET/PATCH/DELETE /api/tourism/landing-pages/[id]` – posamezna landing stran
- `GET /api/tourism/seo-metrics` – SEO metrike za uporabnika

### Testing

- Unit: `tests/tourism/prompts.test.ts`, `tests/lib/tourism/publish-helpers.test.ts`
- API: `tests/api/user-templates.test.ts` – UserTemplate CRUD
- API: `tests/api/tourism/generate-email.test.ts`, `generate-content.test.ts`, `generate-landing.test.ts`, `tests/api/batch-translate.test.ts`
- E2E: `tests/e2e/tourism-email.spec.ts`, `tests/e2e/tourism-journey.spec.ts`, `tests/e2e/copy-buttons.spec.ts`

### NPM Scripts

- `npm run test:api` – API tests
- `npm run test:tourism` – tourism unit + API tests
- `npm run test:e2e:tourism` – tourism E2E subset
