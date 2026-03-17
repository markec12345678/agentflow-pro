# Go Live – Quick Reference

Kratki pregled ročnih korakov za MVP launch. Za podrobnosti glej [production-launch-checklist.md](./production-launch-checklist.md).

## Koraki (po vrsti)

1. **Production database** – Supabase ali Neon, `DATABASE_URL` v Vercel, `npx prisma migrate deploy`
2. **Stripe live keys** – `sk_live_`, `pk_live_`, `STRIPE_PRICE_PRO` v Vercel
3. **Stripe webhooks** – endpoint na `/api/webhooks/stripe`, `STRIPE_WEBHOOK_SECRET` v Vercel
4. **Vercel env vars** – vse P0 spremenljivke (glej VERCEL-ENV-CHECKLIST.md)
5. **GitHub Secrets** – za ročni deploy: VERCEL_*, DATABASE_URL, STRIPE_*, NEXTAUTH_*
6. **Predeploy** – `npm run predeploy` (verify + E2E smoke; ali `--skip-e2e` za hitrejši prehod)
7. **Redeploy** – GitHub Actions workflow_dispatch ali Vercel dashboard
8. **Verifikacija** – test flow (Register → Subscribe → Generate), preveri `/api/health`

## Povezave

- [production-launch-checklist.md](./production-launch-checklist.md) – polna checklista
- [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md) – env spremenljivke
- [deployment.md](./deployment.md) – deploy workflow
