# Security Audit Checklist

Pre-launch security review for AgentFlow Pro.

## Authentication & Authorization

- [x] NextAuth session config (NEXTAUTH_SECRET, secure cookies)
- [x] API routes protected (getServerSession, getUserId)
- [x] Admin routes (ADMIN_EMAILS, isAdminEmail in lib/is-admin.ts)
- [x] RLS / tenant isolation for multi-tenant data (withRlsContext in canvas, Prisma RLS)
- [x] API key auth (bearer token) for public API

## Data & Secrets

- [x] No secrets in client code or public bundles
- [x] .env.local in .gitignore, env vars in Vercel only
- [x] Stripe webhook signature verification (stripe.webhooks.constructEvent)
- [ ] Database connection string (pooler, TLS) – verify in production

## Input Validation

- [x] Request body validation (Zod in tourism routes)
- [x] SQL injection (Prisma parameterized queries)
- [x] XSS: user content sanitized or escaped (React escaping, CSP)
- [x] File uploads: type/size limits – SEO metrics import (CSV only, 1 MB max, 10k rows)

## Dependencies

- [ ] `npm audit` – critical/high vulnerabilities resolved (run before launch)
- [ ] Dependencies up to date (security patches)

**Note (2026-02):** `npm audit fix` brez `--force` ne odpravi nobene ranljivosti. Vsi fixi zahtevajo breaking changes: Sentry 7.x (nekompatibilno z Next.js 15), Prisma 6.x (projekt na 7.x), Vercel 32.x. Do odpravitve: `npm run predeploy -- --skip-audit`. Glej [production-launch-checklist.md](production-launch-checklist.md).

## Deployment

- [ ] HTTPS only (Vercel default)
- [x] CORS configured appropriately
- [x] Rate limiting on public APIs – /api/tourism/faq POST (60 req/min per IP)
- [x] Sentry/error tracking (no sensitive data in logs)

---

Run before launch: `npm audit` and resolve critical issues.
