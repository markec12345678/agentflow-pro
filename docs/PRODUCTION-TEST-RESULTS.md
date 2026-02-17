# Production Test Results

**URL:** https://agentflow-pro-seven.vercel.app  
**Date:** 2026-02-17

---

## Checklist

| Test | Status | Notes |
|------|--------|-------|
| Homepage se naloži | OK | Nav (AgentFlow Pro, Workflows, Pricing, Memory), heading "Multi-Agent AI Platform za business avtomatizacijo" |
| /pricing stran deluje | OK | Starter $29, Pro $99, Enterprise $499, Get Started buttons |
| /workflows stran deluje | OK | Workflow Builder, Save, Execute, React Flow controls |
| Stripe checkout (test mode) | PENDING | Get Started shows Loading... – preveri Vercel env vars (STRIPE_*). Checkout lahko zahteva prijavo. |
| Agent execution test | PENDING | Execute button na workflows – zahteva dodane node-e in prijavo |
| /api/health | OK | `{"ok":true}` |

---

## Naslednji koraki

1. **Stripe:** Dodaj STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_* v Vercel → Redeploy
2. **Stripe checkout:** Prijava (Register/Login) bo verjetno potrebna pred checkout
3. **Agent execution:** Prijava + workflow z node-i (npr. Trigger + Agent) → Execute
