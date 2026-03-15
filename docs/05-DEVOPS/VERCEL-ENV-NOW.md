# TAKOJ – Vercel Environment Variables

**Odpri:** https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro/settings/environment-variables

**Dodaj (Production):**

```
DATABASE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_STARTER
STRIPE_PRICE_PRO
STRIPE_PRICE_ENTERPRISE
NEXTAUTH_SECRET
NEXTAUTH_URL=https://agentflow-pro-seven.vercel.app
SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
GITHUB_TOKEN
CONTEXT7_API_KEY
FIRECRAWL_API_KEY
```

**Opcijsko:** OPENAI_API_KEY, BRAVE_API_KEY, GA_MEASUREMENT_ID

**STRIPE_PRICE_* reminder:** Ustvari 3 produkte v Stripe (Starter $29, Pro $99, Enterprise $499), skopiraj Price ID (`price_xxxxx`). See [STRIPE-SETUP.md](STRIPE-SETUP.md).

**Po Save:** Redeploy z `vercel --prod`
