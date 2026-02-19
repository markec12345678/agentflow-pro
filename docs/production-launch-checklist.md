# Production Launch Checklist

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

- [ ] Stripe Dashboard → [API Keys](https://dashboard.stripe.com/apikeys) (Production mode)
- [ ] Skopiraj `sk_live_...` in `pk_live_...`
- [ ] Vercel: `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] Ustvari Pro product + price v Stripe Production
- [ ] Vercel: `STRIPE_PRICE_PRO` = `price_xxx`
- [ ] Redeploy

---

### 3. Stripe Webhooks – Production (30 min)

- [ ] Stripe Dashboard → Developers → Webhooks → Add endpoint
- [ ] URL: `https://<production-domain>/api/webhooks/stripe`
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
- [ ] Migracija: `npx prisma migrate deploy` (vključuje BlogPost)

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

## Po konfiguraciji

1. Pred redeployem: `npm run predeploy` (ali `npm run predeploy -- --skip-e2e` za hitrejši prehod)
2. Redeploy
3. Test flow: Register → Trial → Subscribe (Pro) → Generate (preveri limit)
4. Preveri `/api/health`
