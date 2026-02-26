# Stripe Production Webhook Setup

## Koraki

### 1. Stripe Dashboard → Production Mode

Preveri, da si v **Production** (ne Test mode). Top right: toggle na "Live".

### 2. Developers → Webhooks → Add endpoint

**Endpoint URL:**
```
https://agentflow-pro-seven.vercel.app/api/webhooks/stripe
```
(ali tvoj production domain)

**Events to send:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 3. Signing Secret

Po ustvarjanju webhooka skopiraj **Signing secret** (`whsec_...`).

### 4. Vercel Environment Variables

Vercel Dashboard → agentflow-pro → Settings → Environment Variables → Add:

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (iz koraka 3) | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_PRICE_PRO` | `price_xxx` (Pro plan) | Production |

### 5. Redeploy

Vercel → Deployments → ... → Redeploy

### 6. Test

1. Stripe Dashboard → Payments → Create test payment (v Live mode uporabi realno kartico ali Stripe test ključe za test)
2. Ali lokalno: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (za Test mode)

---

## Checklist (Blok B #4 – Stripe Live preverjanje)

- [ ] Webhook endpoint ustvarjen v Stripe (Production)
- [ ] Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- [ ] STRIPE_WEBHOOK_SECRET dodan v Vercel (Production)
- [ ] STRIPE_SECRET_KEY (sk_live_) in NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_) v Vercel
- [ ] STRIPE_PRICE_* (Starter, Pro, Enterprise) nastavljeni v Vercel
- [ ] Redeploy izveden
- [ ] Test plačilo: Pricing → Checkout → plačilo z test kartico (v Live mode ali Test mode s test keys) → webhook prejel
