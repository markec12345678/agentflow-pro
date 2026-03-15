# Stripe Setup – Korak 3

## Production webhook

Glej [STRIPE-PRODUCTION-WEBHOOK.md](./STRIPE-PRODUCTION-WEBHOOK.md) za nastavitev webhooka v Production.

---

## 1. Odpri Stripe Dashboard

[Stripe Dashboard – Products](https://dashboard.stripe.com/products)

Preveri, da si v **Production** mode (ne Test).

---

## 2. Kreiraj 3 products

| Product | Price | Agent Runs | Notes |
|---------|-------|------------|-------|
| Starter | $29/mo | 100 | Recurring monthly |
| Pro | $99/mo | 500 | Recurring monthly |
| Enterprise | $499/mo | 5000 | Recurring monthly |

Za vsak product:
1. Add product
2. Add Price → Recurring → Monthly
3. Kopiraj **Price ID** (format `price_xxxxx`)

---

## 3. Vercel env vars

[Vercel → agentflow-pro → Settings → Environment Variables](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro/settings/environment-variables)

Dodaj za **Production**:

```
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

Plus obvezno (če še nimaš):
- STRIPE_SECRET_KEY (sk_live_...)
- STRIPE_WEBHOOK_SECRET (whsec_...)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)

---

## 4. Redeploy

```bash
npx vercel --prod --scope robertpezdirc-4080s-projects --yes
```

---

## 5. Test checkout

1. Odpri: https://agentflow-pro-seven.vercel.app/pricing
2. Klikni **Get Started** na kateremkoli planu
3. Preveri redirect na Stripe Checkout
4. (Opcijno) Zaključi test naročilo z test kartico `4242 4242 4242 4242`

---

## Checklist

- [ ] 3 products ustvarjenih v Stripe (Production)
- [ ] 3 Price IDs skopiranih
- [ ] STRIPE_PRICE_* dodani v Vercel
- [ ] Redeploy izveden
- [ ] Checkout testiran
