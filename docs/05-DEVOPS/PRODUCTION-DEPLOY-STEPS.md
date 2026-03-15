# Production Deploy – Korak za korakom

## Pred poglobljenim deployem

1. Preberi [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md)
2. Preberi [production-launch-checklist.md](./production-launch-checklist.md)
3. Preberi [STRIPE-PRODUCTION-WEBHOOK.md](./STRIPE-PRODUCTION-WEBHOOK.md)

---

## 1. Lokalno preverjanje

```bash
# Preveri env vars (moraš imeti .env.local z vsemi vrednostmi)
npm run verify:production-env

# Predeploy: verify + E2E smoke (per production-launch-checklist 8.3.5)
npm run predeploy
# ali brez E2E (hitrejše – ročno zaženi npm run test:e2e:smoke pred launchom):
npm run predeploy -- --skip-e2e
```

## 2. Vercel Environment Variables

V [Vercel Dashboard](https://vercel.com/dashboard) → project → Settings → Environment Variables dodaj vse iz [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md).

Za **Environment** izberi **Production** (in opcijsko Preview).

## 3. Deploy

### Možnost A: Git push (če je repo povezan z Vercel)

```bash
git push origin master
```

### Možnost B: Ročni deploy prek GitHub Actions

Če uporabljaš `workflow_dispatch`:
1. GitHub → Actions → Deploy workflow → Run workflow
2. Preveri GitHub Secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, app secrets)

### Možnost C: Vercel CLI

```bash
npx vercel --prod
```

## 4. Po deployu

1. Odpri `https://agentflow-pro-seven.vercel.app/api/health` – pričakovano: `{ "ok": true }`
2. Test flow: Register → Subscribe (Stripe) → Generate content

## 5. Troubleshooting

- **Build fail:** Preveri env vars v Vercel, `npm run build` lokalno
- **Health check fail:** Preveri DATABASE_URL, NEXTAUTH_URL
- **Stripe ne deluje:** Preveri STRIPE_WEBHOOK_SECRET, webhook URL v Stripe Dashboard
