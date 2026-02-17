# Deployment (Vercel)

## Setup

1. Connect the repo to Vercel.
2. Add environment variables in the Vercel dashboard (see `.env.example` for a list).

## CI/CD deploy workflow

The deploy workflow (`.github/workflows/deploy.yml`) runs on push to `main` and deploys to Vercel.

### Required secrets

Add these in **Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN` – From [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` – From project settings → General
- `VERCEL_PROJECT_ID` – From project settings → General
- `DATABASE_URL`, `STRIPE_*`, `NEXTAUTH_*`, etc. – Same as Vercel env vars

## Post-deploy verification

After deploy, the workflow runs `scripts/post-deploy.sh` against the deployment URL. It checks `/api/health`, which returns `{ ok: true }`.
