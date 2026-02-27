# Production Launch Checklist

Za urejen vodnik po korakih glej [LAUNCH-RUNBOOK.md](./LAUNCH-RUNBOOK.md). Za celovit pregled glej tudi [PRODUCTION-DEPLOY-STEPS.md](./PRODUCTION-DEPLOY-STEPS.md).

## P0 – Kritično (brez tega ne launchaj)

### 1. Production Database (1h)

- [ ] Ustvari projekt na [Supabase](https://supabase.com) ali [Neon](https://neon.tech)
- [ ] Skopiraj connection string (pooler za Vercel)
- [ ] Vercel → Settings → Environment Variables: `DATABASE_URL` (Production)
- [ ] Lokalno: nastavi `DATABASE_URL` v `.env.local` (prod connection string)
- [ ] Zaženi: `npx prisma migrate deploy`
- [ ] Opcijsko: `npx prisma db seed` (e2e user)

Glej [database-setup.md](./database-setup.md).

---

### 2. Stripe Live Keys (30 min)

Glej [STRIPE-PRODUCTION-WEBHOOK.md](./STRIPE-PRODUCTION-WEBHOOK.md).

- [ ] Stripe Dashboard → [API Keys](https://dashboard.stripe.com/apikeys) (Production mode)
- [ ] Skopiraj `sk_live_...` in `pk_live_...`
- [ ] Vercel: `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] Ustvari Pro product + price v Stripe Production
- [ ] Vercel: `STRIPE_PRICE_PRO` = `price_xxx`
- [ ] Redeploy

---

### 3. Stripe Webhooks – Production (30 min)

Glej [STRIPE-PRODUCTION-WEBHOOK.md](./STRIPE-PRODUCTION-WEBHOOK.md).

- [ ] Stripe Dashboard → Developers → Webhooks → Add endpoint
- [ ] URL: `https://agentflow-pro-seven.vercel.app/api/webhooks/stripe`
- [ ] Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Skopiraj Signing Secret (`whsec_...`)
- [ ] Vercel: `STRIPE_WEBHOOK_SECRET` = ta secret (Production)
- [ ] Redeploy
- [ ] Test: Stripe CLI `stripe trigger checkout.session.completed` ali real checkout

---

### 4. Content Limits (implementirano)

- [x] BlogPost model v Prisma
- [x] `blogPostsLimit` v plans (Starter=3, Pro=10, Enterprise=999)
- [x] Generate-content zahteva auth in preverja limit
- [x] Migracija: `vercel.json` vključuje `buildCommand: npm run build:vercel` – migracije se izvajajo avtomatsko ob vsakem deployu

---

### 5. Vercel Env Vars (1h)

- [ ] Vsi P0 spremenljivke nastavljeni (glej [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md))
- [ ] Preveri: `npm run verify:production-env` (naloži .env.local ali .env)

---

### 5a. GitHub Secrets (za ročni deploy)

Če uporabljaš GitHub Actions za deploy (workflow_dispatch):

- [ ] GitHub → Repo → Settings → Secrets and variables → Actions
- [ ] Dodaj: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Dodaj: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] Vrednosti enake kot v Vercel env vars (razen Vercel token/id)

Glej [deployment.md](./deployment.md) za podrobnosti.

---

## Phase 8.3 – MVP Launch (pred LAUNCH)

### 8.3.1 Security audit
- [x] Preglej [SECURITY-AUDIT-CHECKLIST.md](./SECURITY-AUDIT-CHECKLIST.md)
- [x] Env vars: ni secrets v kodi, .env v .gitignore
- [ ] Auth: next-auth secret, HTTPS only (verify in prod deploy)

### 8.3.2 Documentation review
- [x] README: quick start, env setup
- [x] [DOCS-REVIEW-CHECKLIST.md](./DOCS-REVIEW-CHECKLIST.md)
- [ ] Internal links valid (manual verification)

### 8.3.3 Landing page
- [x] Landing page live na production URL (src/app/page.tsx – Hero, CTA)
- [x] CTA (pricing, signup) deluje – /onboarding, /generate, /workflows, /pricing

### 8.3.4 Support channels
- [x] [support-channels.md](./support-channels.md) – email, sales
- [x] Contact / feedback forma (src/app/contact, api/contact)

### 8.3.5 LAUNCH
- [ ] Vsi P0 checklisti opravljeni
- [ ] E2E smoke: `npm run test:e2e:smoke` (ali `npm run predeploy` – vključuje smoke)
- [ ] Monitoring: Sentry DSN, error rate

---

## Po konfiguraciji

1. **Pred redeployem:** `npm run predeploy` (avtomatsko: verify env + E2E smoke)
   - Za hitrejši prehod: `npm run predeploy -- --skip-e2e` (po tem ročno zaženi `npm run test:e2e:smoke`)
2. Redeploy
3. Test flow: Register → Trial → Subscribe (Pro) → Generate (preveri limit)
4. Preveri `https://agentflow-pro-seven.vercel.app/api/health`
