# Kako testirati lokalno

Navodila za lokalni zagon AgentFlow Pro v Cursorju.

---

## 1. Odpri projekt v Cursorju

```bash
cd C:\Users\admin\projects\fullstack\agentflow-pro
cursor .
```

---

## 2. Namesti dependencies

```bash
npm install
```

---

## 3. Nastavi .env.local

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**Unix/Mac:**
```bash
cp .env.example .env.local
```

Uredi `.env.local` z ustreznimi keys:

| Variable | Opis |
|----------|------|
| `DATABASE_URL` | PostgreSQL connection string (obvezno) |
| `NEXTAUTH_SECRET` | Random string za auth (obvezno) |
| `NEXTAUTH_URL` | `http://localhost:3000` (obvezno) |
| `STRIPE_SECRET_KEY` | Stripe test key (`sk_test_...`) – za billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook – za billing |
| `GITHUB_TOKEN` | GitHub PAT – za Code Agent |
| `FIRECRAWL_API_KEY` | Firecrawl – za Research Agent |
| `CONTEXT7_API_KEY` | Context7 – za Content Agent |

Minimalni zagon zahteva vsaj: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

---

## 4. Zaženi development server

```bash
npm run dev
```

Odpri http://localhost:3000

---

## 5. Testiraj ključne strani

| URL | Kaj testirati |
|-----|---------------|
| `/` | Homepage loads |
| `/pricing` | Pricing table, Stripe checkout |
| `/workflows` | Visual workflow editor |
| `/memory` | Knowledge Graph UI |
| `/login` | Prijava |
| `/register` | Registracija |
| `/billing` | Billing dashboard (API: `/api/billing`) |
| `/terms` | Terms of Service (če obstaja) |
| `/privacy` | Privacy Policy (če obstaja) |

---

## 6. Zaženi teste

```bash
# Unit testi
npm test

# E2E testi (Playwright) – najprej: npm run playwright:install
npm run test:e2e
```

**Production E2E** (če je skripta na voljo):
```bash
BASE_URL=http://localhost:3000 ./scripts/run-e2e-production.sh
```

**Windows:** Uporabi `npm run test:e2e` z zagnanim dev serverjem – Playwright sam zagnal app.

---

## 7. Build test

```bash
npm run build
```

Preveri, da build uspe brez napak.

---

## Kaj lahko narediš zdaj?

| Opcija | Ukrep |
|--------|-------|
| **A** | Odpri v Cursorju in poglej kodo |
| **B** | Zaženi `npm run dev` in testiraj lokalno |
| **C** | Odpri [production URL](https://agentflow-pro-seven.vercel.app) in testiraj live |
| **D** | Zaženi teste (`npm test`) |
| **E** | Poglej dokumentacijo (`docs/`) |
| **F** | Preglej memory-bank (knowledge graph) |

---

## Opcijsko

- **Lint:** `npm run lint`
