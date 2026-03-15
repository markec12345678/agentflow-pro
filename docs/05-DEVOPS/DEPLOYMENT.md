# Deployment (Vercel)

## Setup

1. Connect the repo to Vercel.
2. Add environment variables in the Vercel dashboard – see [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md).

## Deploy workflow

The deploy workflow (`.github/workflows/deploy.yml`) runs **manually** (workflow_dispatch), not on push.

**Koraki:** Verify production env → Build → Deploy to Vercel → Post-deploy health check.

**Pred ročnim deployem (lokalno):** Zaženi `npm run predeploy` (ali `npm run predeploy -- --skip-e2e` za hitrejši prehod). Deploy workflow vključuje korak "Verify production env" – zahteva vse required secrets.

## Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

**Vercel:**
- `VERCEL_TOKEN` – From [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` – From project settings → General
- `VERCEL_PROJECT_ID` – From project settings → General

**App:**
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_PRO`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Post-deploy verification

After deploy, the workflow runs `scripts/post-deploy.sh` against the deployment URL. It checks `/api/health`, which returns `{ ok: true }`.

Za popolno production konfiguracijo glej [production-launch-checklist.md](./production-launch-checklist.md) in [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md).
