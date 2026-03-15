# AgentFlow Pro – Korak-po-korak setup

## 1. Lokalni development

```bash
# 1. Kloniraj repozitorij
git clone https://github.com/markec12345678/agentflow-pro.git
cd agentflow-pro

# 2. Namesti odvisnosti
npm install

# 3. Ustvari .env.local iz .env.example
cp .env.example .env.local

# 4. Napolni obvezne spremenljivke
# DATABASE_URL=postgresql://... (iz Supabase Dashboard)
# DIRECT_URL=postgresql://... (direct connection za migracije)
# NEXTAUTH_SECRET=$(openssl rand -base64 32)  # obvezno, min 32 znakov
# NEXTAUTH_URL=http://localhost:3002          # mora ustrezati dev portu!
# MOCK_MODE=true (za lokalni dev brez API ključev)

# 5. Setup baze
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 6. Zaženi development
npm run dev

# Testna prijava (po db:seed):
# Email: e2e@test.com
# Geslo: e2e-secret
```

---

## 2. Vercel deploy konfiguracija

### A. Poveži GitHub → Vercel

1. Pojdi na https://vercel.com
2. Import Project → Izberi agentflow-pro repozitorij
3. Framework Preset: Next.js (avtomatsko detektiran)
4. Root Directory: `./` (če je repo agentflow-pro) ali `agentflow-pro` (če je v monorepo)

### B. Environment Variables v Vercel

| Variable | Vrednost | Environment |
|----------|----------|--------------|
| `DATABASE_URL` | Supabase pooler URL | Production |
| `DIRECT_URL` | Supabase direct URL | Production |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Production |
| `NEXTAUTH_URL` | `https://agentflow-pro-seven.vercel.app` | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_PRICE_PRO` | `price_...` | Production |
| `SENTRY_DSN` | Sentry DSN | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Client DSN | Production |
| `OPENAI_API_KEY` | `sk-...` | Production |
| `MOCK_MODE` | `false` | Production |
| `GOOGLE_CLIENT_ID` | Google OAuth (opcijsko) | Production |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (opcijsko) | Production |

**Kako nastaviti:** Vercel Dashboard → Project → Settings → Environment Variables → Add

### C. Build Settings

**Vercel Dashboard → Settings → Build & Development**

- **Build Command:** `npm run build:vercel`
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install`

> **Opomba:** Build Command se nastavi v Vercel Dashboard, ne v `vercel.json`.

---

## 3. vercel.json konfiguracija

Projekt uporablja `vercel.json` le za crons. Build nastavitve so v Dashboard.

```json
{
  "crons": [
    {
      "path": "/api/tourism/email-scheduler",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- `0 8 * * *` = vsak dan ob 8:00 UTC
- Za polnoč UTC uporabi `0 0 * * *`

---

## 4. Stripe production setup

```bash
# 1. Pridobi live keys iz Stripe Dashboard
# https://dashboard.stripe.com/apikeys

# 2. Nastavi webhook
# Stripe Dashboard → Developers → Webhooks → Add endpoint
# URL: https://agentflow-pro-seven.vercel.app/api/webhooks/stripe
# Events: checkout.session.completed, payment_intent.succeeded, ...

# 3. Kopiraj webhook secret v Vercel env vars
# STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 5. Database migracije na production

Ob vsakem deployu se izvede avtomatsko:

```
npm run build:vercel = prisma migrate deploy && next build
```

**Ročna migracija** (če je potrebno):

```bash
npx prisma migrate deploy --schema ./prisma/schema.prisma
```

**Pomembno:** Supabase connection pooling mora biti pravilno nastavljen za serverless (pooler URL v `DATABASE_URL`, direct v `DIRECT_URL`).

---

## 6. Health check & testing

```bash
# 1. Preveri deploy status
curl https://agentflow-pro-seven.vercel.app/api/health
# Pričakovani output: {"ok": true}

# 2. E2E smoke test
npm run test:e2e:smoke

# 3. Diagnostika konfiguracije (MOCK_MODE itd.)
curl https://agentflow-pro-seven.vercel.app/api/test/config
```

---

## 7. Ključne točke pred launchom

- [ ] Vsi obvezni env vars nastavljeni v Vercel
- [ ] `DATABASE_URL` kaže na production Supabase
- [ ] `NEXTAUTH_URL` se ujema z Vercel domeno
- [ ] Stripe live keys (ne test!)
- [ ] Webhook endpoint registriran v Stripe
- [ ] Prisma migracije uspešno izvedene
- [ ] Sentry DSN konfiguriran
- [ ] OpenAI API key nastavljen (`MOCK_MODE=false`)
- [ ] Google OAuth credentials za production (če uporabljaš)
- [ ] Custom domena verificirana (če uporabljaš)
- [ ] SSL certificate avtomatsko preko Vercel

---

## 8. Troubleshooting

| Problem | Rešitev |
|---------|---------|
| Build fails | Preveri `npm run build:vercel` lokalno |
| Database connection error | Preveri DATABASE_URL format + Supabase firewall |
| Auth ne deluje | NEXTAUTH_URL mora matchati domeno |
| Stripe webhook fails | Preveri webhook secret + endpoint URL |
| API routes 404 | Preveri strukturo `/src/app/api/...` |
| Prisma migration fails | Uporabi DIRECT_URL za migracije |

---

## 9. Deploy checklist

- [ ] 1. GitHub push na master branch
- [ ] 2. Vercel avtomatski build sprožen
- [ ] 3. Prisma migracije izvedene
- [ ] 4. Environment variables validirane
- [ ] 5. Health check endpoint OK
- [ ] 6. Login/Register testiran
- [ ] 7. Stripe checkout testiran
- [ ] 8. Workflow builder testiran
- [ ] 9. AI agenti testirani (če MOCK_MODE=false)
- [ ] 10. Error monitoring (Sentry) aktiven
