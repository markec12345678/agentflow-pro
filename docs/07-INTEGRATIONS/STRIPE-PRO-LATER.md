# Stripe Pro – nastavitev kasneje

AgentFlow Pro deluje brez Stripe. Ko želiš omogočiti plačljive Pro/Business načrte, sledi tem korakom.

## 1. Stripe Dashboard

1. [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Ustvari produkt **Pro** (mesečna naročnina)
3. Kopiraj **Price ID** (oblike `price_xxx`)

## 2. Environment spremenljivke

Dodaj v `.env.local` in Vercel (Settings → Environment Variables):

| Spremenljivka | Opis |
|---------------|------|
| `STRIPE_SECRET_KEY` | `sk_live_xxx` (ali `sk_test_xxx` za testiranje) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` |
| `STRIPE_PRICE_PRO` | Price ID za Pro plan (npr. `price_xxx`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` iz Stripe Webhooks |

## 3. Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://tvojadomena.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Signing secret → `STRIPE_WEBHOOK_SECRET`

## 4. Za ostale načrte (Starter, Enterprise)

- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_ENTERPRISE`

Definirani so v `src/stripe/plans.ts`. Brez njih checkout za te načrte vrne "Pro plans coming soon".
