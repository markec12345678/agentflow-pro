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
- [ ] File uploads (if any): type/size limits – verify if used

## Dependencies

- [ ] `npm audit` – critical/high vulnerabilities resolved (run before launch)
- [ ] Dependencies up to date (security patches)

## Deployment

- [ ] HTTPS only (Vercel default)
- [x] CORS configured appropriately
- [ ] Rate limiting on public APIs – consider for /api/tourism/faq
- [x] Sentry/error tracking (no sensitive data in logs)

---

Run before launch: `npm audit` and resolve critical issues.
