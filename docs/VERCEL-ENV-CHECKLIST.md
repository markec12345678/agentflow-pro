# Vercel Environment Variables – DANES (Kritično)

**Odpri:** [Vercel Dashboard](https://vercel.com/dashboard) → Izberi projekt **agentflow-pro** → **Settings** → **Environment Variables**

**Nastavi za Environment:** Production (in Preview če želiš)

---

## Obvezno – dodaj vse

| Variable | Opis | Kje dobiti |
|----------|------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Vercel Postgres / Neon / Supabase |
| `STRIPE_SECRET_KEY` | Live secret key (`sk_live_...`) | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Live publishable key (`pk_live_...`) | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Enako kot zgoraj | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) | Stripe → Developers → Webhooks |
| `NEXTAUTH_URL` | `https://agentflow-pro-seven.vercel.app` | Production URL |
| `NEXTAUTH_SECRET` | Random string | `openssl rand -base64 32` |
| `SENTRY_DSN` | Sentry DSN | [sentry.io](https://sentry.io) → Project Settings |
| `SENTRY_ORG` | Sentry org slug | Sentry URL |
| `SENTRY_PROJECT` | Sentry project slug | Sentry URL |
| `GA_MEASUREMENT_ID` | Google Analytics (G-XXXXXXX) | [GA4](https://analytics.google.com) |
| `GITHUB_TOKEN` | GitHub PAT za Code Agent | GitHub → Settings → Developer settings |
| `FIRECRAWL_API_KEY` | Firecrawl API key | [firecrawl.dev](https://firecrawl.dev) |
| `CONTEXT7_API_KEY` | Context7 API key | context7.com |

---

## Opcijsko (Stripe pricing)

| Variable | Opis |
|----------|------|
| `STRIPE_PRICE_STARTER` | Price ID za Starter plan |
| `STRIPE_PRICE_PRO` | Price ID za Pro plan |
| `STRIPE_PRICE_ENTERPRISE` | Price ID za Enterprise plan |

---

## Po dodajanju

1. Klikni **Save**
2. Redeploy: Deployments → ... → Redeploy
3. Preveri: https://agentflow-pro-seven.vercel.app/api/health
