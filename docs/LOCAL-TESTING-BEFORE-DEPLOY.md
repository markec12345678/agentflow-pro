# Lokalno testiranje – pred deployem

Pred deployem vse preveri lokalno. Delaj zaporedno po spodnjih korakih.

---

## 1. Priprava okolja

```bash
cd projects/fullstack/agentflow-pro
npm install
```

**Ustvari / preveri `.env.local`** (kopiraj iz `.env.example`):

| Variable | Opis | Kje dobiti |
|----------|------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Lokalno PG ali [Supabase](https://supabase.com) free |
| `NEXTAUTH_SECRET` | Secret za JWT | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe Test secret | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) – Test mode: `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe CLI output – glej korak 4F |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Test publishable | Stripe Dashboard: `pk_test_...` |
| `STRIPE_PRICE_PRO` | Pro plan price ID | Stripe Dashboard → Products → Ustvari Pro product → Price ID `price_xxx` |
| `GOOGLE_CLIENT_ID` | Google OAuth | Opcijsko |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Opcijsko |
| `MOCK_MODE` | Mock agenti brez API keys | `true` če nimaš agent API keyov |

Minimalno za dev: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Za billing: Stripe vars.

---

## 2. Baza in migracije

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

**Preveri:** `npx prisma studio` – vidiš tabele User, Subscription, Workflow, BlogPost, Onboarding.

---

## 3. Build in dev server

```bash
npm run build
```

Če build uspe:

```bash
npm run dev
```

Odpri http://localhost:3000

---

## 4. Lokalni test flow

### A. Registracija in prijava

1. `/register` – vnesi email in geslo, registriraj
2. V Prisma Studio preveri: User obstaja, `trialEndsAt` ≈ `now + 7 dni`
3. `/login` – prijavi se z istim emailom/geslom
4. Po prijavi redirect na `/dashboard`

### B. Zaščitene strani

- Odpri `/dashboard`, `/generate`, `/workflows`, `/profile`, `/settings` – vse dostopne
- Odjavi se
- Poskusi direktno `/dashboard` – redirect na `/login`

### C. Trial expired (poskus)

1. V Prisma Studio: nastavi `trialEndsAt` na včeraj za test userja
2. Prijavi se
3. Poskusi `/dashboard` – redirect na `/pricing`

### D. Generiranje (content limits)

1. Prijavi se, odpri `/generate`
2. Vnesi topic, klikni "Generate 10 Blog Posts"
3. Preveri: posti se prikažejo
4. V Prisma Studio: `BlogPost` tabela vsebuje zapise
5. Ustvari 10 postov (trial/Pro limit = 10)
6. Pri naslednji generaciji: 403, sporočilo "You have used X/10 blog posts this month"

### E. Stripe checkout (test mode)

1. Prijavi se, odpri `/pricing`
2. Klikni "Start Free 7-Day Trial" (Pro)
3. Redirect na Stripe Checkout
4. Uporabi test kartico: `4242 4242 4242 4242`, poljuben datum, CVC
5. Po zaključku: redirect na `/dashboard?success=true`

### F. Stripe webhook (lokalno)

V **drugem** terminalu:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Skopiraj `whsec_...` (Signing secret) v `.env.local` kot `STRIPE_WEBHOOK_SECRET`, ponovno zaženi `npm run dev`.

Po uspešnem checkoutu v Prisma Studio preveri: `Subscription` z ustreznim `userId` in `planId`.

---

## 5. E2E testi

```bash
npm run test:e2e
```

ali samo kritične:

```bash
npx playwright test auth billing-checkout --project=chromium
```

Vsi morajo uspeti (zahteva DATABASE_URL in seed).

---

## 6. Checklist pred deployem

- [ ] `npm run build` uspe
- [ ] `npm run dev` teče, stran deluje
- [ ] Registracija ustvari User z `trialEndsAt`
- [ ] Login deluje
- [ ] Zaščitene strani zahtevajo prijavo
- [ ] Brez triala/subscription → redirect na `/pricing`
- [ ] Generate content deluje in beleži v `BlogPost`
- [ ] Limit 10 postov se uveljavlja (403 ko presežeš)
- [ ] Stripe checkout redirect deluje (test kartica)
- [ ] Webhook posodobi Subscription v DB
- [ ] E2E testi uspejo

**Če vse drži, lahko greš v deploy.**

---

## Glej tudi

- [database-setup.md](./database-setup.md) – Supabase nastavitev
- [STRIPE-SETUP.md](./STRIPE-SETUP.md) – Stripe produkti in cene
- [production-launch-checklist.md](./production-launch-checklist.md) – Production konfiguracija
