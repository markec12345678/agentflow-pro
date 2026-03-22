# Vercel Environment Variables – DANES (Kritično)

**Odpri:** [Vercel Dashboard](https://vercel.com/dashboard) → Izberi projekt **agentflow-pro** → **Settings** → **Environment Variables**

---

## GitHub povezava (avtomatski deploy ob push)

**Preveri:** [agentflow-pro → Settings → Git](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro/settings/git)

1. Prijavi se na Vercel.
2. Odpri projekt **agentflow-pro** → **Settings** → **Git**.
3. Če vidiš **Connected to GitHub** in repo `markec12345678/agentflow-pro` → povezava je OK.
4. Če **ni** povezan:
   - Klikni **Connect Git Repository**
   - Izberi **GitHub**
   - Izberi **markec12345678/agentflow-pro**
   - Branch: **master**
   - Klikni **Connect**

Po povezavi: vsak `git push` na `master` sproži nov deploy.

**Opomba:** To moraš nastaviti ročno v Vercel Dashboard – avtomatsko deploy ne deluje, dokler repo ni povezan.

**Nastavi za Environment:** Production (in Preview če želiš)

---

## Obvezno – dodaj vse

| Variable | Opis | Kje dobiti |
|----------|------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Vercel Postgres / Neon / Supabase |
| `STRIPE_SECRET_KEY` | Live secret key (`sk_live_...`) | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live publishable key (`pk_live_...`) | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) | Stripe → Developers → Webhooks |
| `STRIPE_PRICE_PRO` | Price ID za Pro plan | Stripe Dashboard → Products → Pro |
| `NEXTAUTH_URL` | `https://agentflow-pro-seven.vercel.app` | Production URL |
| `NEXTAUTH_SECRET` | Random string | `openssl rand -base64 32` |
| `SENTRY_DSN` | Sentry DSN | [sentry.io](https://sentry.io) → Project Settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Enako (za client-side error tracking) | Sentry Project Settings |
| `SENTRY_ORG` | Sentry org slug | Sentry URL |
| `SENTRY_PROJECT` | Sentry project slug | Sentry URL |
| `GA_MEASUREMENT_ID` | Google Analytics (G-XXXXXXX) | [GA4](https://analytics.google.com) |
| `GITHUB_TOKEN` | GitHub PAT za Code Agent | GitHub → Settings → Developer settings |
| `FIRECRAWL_API_KEY` | Firecrawl API key | [firecrawl.dev](https://firecrawl.dev) |
| `CONTEXT7_API_KEY` | Context7 API key | context7.com |
| `CRON_SECRET` | Zaščita cron endpointov (db-cleanup, pms-sync-all, email-scheduler, smart-alerts, smart-alerts-errors) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` – **brez presledkov ali novo vrstic** pri vnašanju v Vercel |

**Preveri:** `npm run verify:production-env` (ob vsakem dodajanju env spremenljivk v .env.local)

---

## Opcijsko (Google OAuth – "Sign in with Google")

| Variable | Opis | Kje dobiti |
|----------|------|------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Credentials → Create → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Enako – prikazan po ustvarjanju Client ID |

**Nastavitev:**

1. Google Cloud Console → APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs: `{NEXTAUTH_URL}/api/auth/callback/google` (npr. `https://agentflow-pro-seven.vercel.app/api/auth/callback/google`)
5. Kopiraj Client ID in Client Secret v Vercel env

Brez teh spremenljivk: prikazuje se samo email/password prijava.

---

## Opcijsko (Email – Phase E)

| Variable | Opis |
|----------|------|
| `RESEND_API_KEY` | Resend API key – za email verifikacijo, reset gesla, team povabila |
| `EMAIL_FROM` | Od naslov (npr. `AgentFlow Pro <notifications@agentflow.pro>`) |

Brez teh spremenljivk: registracija/reset/povabila delujejo, vendar uporabnik ne prejme emailov (link se lahko ročno skopira iz logov).

## Opcijsko (Stripe pricing)

| Variable | Opis |
|----------|------|
| `STRIPE_PRICE_STARTER` | Price ID za Starter plan |
| `STRIPE_PRICE_ENTERPRISE` | Price ID za Enterprise plan |

## Opcijsko (LangSmith – Blok C #11)

| Variable | Opis |
|----------|------|
| `LANGSMITH_TRACING` | `true` za trace agentov |
| `LANGSMITH_API_KEY` | API ključ iz smith.langchain.com |
| `LANGSMITH_PROJECT` | Ime projekta (npr. agentflow-pro) |

## Opcijsko (Smart Alerts)

| Variable | Opis |
|----------|------|
| `SMART_ALERT_RECEPTIONIST_EMAIL` | Email za payment_failed alert (fallback: ESCALATION_NOTIFY_EMAIL) |
| `SLACK_ALERTS_WEBHOOK_URL` | Slack za system_error (fallback: SLACK_ESCALATION_WEBHOOK_URL) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS za occupancy (opcijsko) |

Brez teh spremenljivk Smart Alerts ne pošiljajo obvestil; aplikacija deluje normalno.

## Opcijsko (Dry Run)

| Variable | Opis |
|----------|------|
| `DRY_RUN` | `true` za simulacijo email/Slack/SMS brez dejanskega pošiljanja (testiranje) |

Brez te spremenljivke ali z `false`: aplikacija pošilja emaile in obvestila normalno.

## Po dodajanju

1. Klikni **Save**
2. Redeploy: Deployments → ... → Redeploy
3. Preveri: https://agentflow-pro-seven.vercel.app/api/health
