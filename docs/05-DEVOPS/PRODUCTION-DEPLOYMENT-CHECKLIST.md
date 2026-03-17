# 🚀 Production Deployment Checklist - AgentFlow Pro

**Datum:** 2026-03-10  
**Version:** 1.0.0 MVP  
**Status:** Ready for Production

---

## ✅ P0 - Critical (Pred Launchom)

### 1. Production Database Setup
- [ ] Ustvari projekt na [Supabase](https://supabase.com) ali [Neon](https://neon.tech)
- [ ] Skopiraj connection string (pooler za Vercel)
- [ ] Vercel → Settings → Environment Variables: `DATABASE_URL` (Production)
- [ ] Lokalno: nastavi `DATABASE_URL` v `.env.local`
- [ ] Zaženi: `npx prisma migrate deploy`
- [ ] Opcijsko: `npx prisma db seed` (e2e user)

**Verification:**
```bash
npx prisma db push --force-reset
npm run db:check
```

---

### 2. Stripe Live Keys
- [ ] Stripe Dashboard → [API Keys](https://dashboard.stripe.com/apikeys) (Production mode)
- [ ] Skopiraj `sk_live_...` in `pk_live_...`
- [ ] Vercel: `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] Ustvari Pro product + price v Stripe Production
- [ ] Vercel: `STRIPE_PRICE_PRO` = `price_xxx`
- [ ] Redeploy

**Verification:**
```bash
npm run verify:production-env
```

---

### 3. Stripe Webhooks - Production
- [ ] Stripe Dashboard → Developers → Webhooks → Add endpoint
- [ ] URL: `https://agentflow-pro-seven.vercel.app/api/webhooks/stripe`
- [ ] Events:
  - ✅ `payment_intent.succeeded`
  - ✅ `payment_intent.payment_failed`
  - ✅ `charge.refunded`
  - ✅ `customer.created`
- [ ] Skopiraj Signing Secret (`whsec_...`)
- [ ] Vercel: `STRIPE_WEBHOOK_SECRET` = ta secret (Production)
- [ ] Redeploy
- [ ] Test: Stripe CLI `stripe trigger checkout.session.completed`

**Verification:**
```bash
stripe listen --forward-to localhost:3002/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

---

### 4. Channel Manager API Keys
- [ ] Booking.com Partner API credentials
  - [ ] `BOOKING_WEBHOOK_SECRET`
  - [ ] `BOOKING_API_KEY`
- [ ] Airbnb API credentials
  - [ ] `AIRBNB_WEBHOOK_SECRET`
  - [ ] `AIRBNB_ACCESS_TOKEN`
- [ ] Vercel: Add all environment variables

---

### 5. Vercel Environment Variables
Complete list:

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://agentflow-pro-seven.vercel.app

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...

# Channel Manager
BOOKING_WEBHOOK_SECRET=...
AIRBNB_WEBHOOK_SECRET=...

# Email (Optional - Phase E)
RESEND_API_KEY=re_...
EMAIL_FROM=AgentFlow Pro <notifications@agentflow.pro>

# Sentry (Error Tracking)
SENTRY_DSN=https://...
SENTRY_ORG=...
SENTRY_PROJECT=...

# Cron Jobs
CRON_SECRET=your-cron-secret
```

**Verification:**
```bash
npm run verify:production-env
```

---

## ✅ P1 - Testing (Pred Redeployom)

### 6. Pre-deploy Checks
```bash
# Run predeploy script
npm run predeploy

# This runs:
# - npm audit --audit-level=high
# - verify:production-env
# - check-links
# - test:e2e:smoke
```

**Manual Overrides (if needed):**
```bash
npm run predeploy -- --skip-audit --skip-links --skip-e2e
```

---

### 7. E2E Smoke Tests
```bash
# Install Playwright browsers
npm run playwright:install

# Run smoke tests
npm run test:e2e:smoke

# Full E2E suite
npm run test:e2e:tourism
```

**Test Coverage:**
- ✅ Homepage loads
- ✅ Dashboard accessible
- ✅ Pricing page displays
- ✅ Auth flows work
- ✅ Payment flow (test mode)
- ✅ Invoice generation

---

### 8. Security Audit
- [ ] `npm audit` - no critical/high vulnerabilities
- [ ] Env vars not committed to git
- [ ] `.env` in `.gitignore`
- [ ] HTTPS enforced (Vercel default)
- [ ] NextAuth secret set
- [ ] Rate limiting enabled

**Verification:**
```bash
npm audit
git ls-files | grep -i env # Should return nothing
```

---

## ✅ P2 - Launch (Redeploy)

### 9. Redeploy to Production
```bash
# Build locally first
npm run build

# Deploy to Vercel
vercel --prod

# Or use GitHub Actions
git push origin main
```

**Post-deploy verification:**
```bash
# Check health endpoint
curl https://agentflow-pro-seven.vercel.app/api/health

# Check API
curl https://agentflow-pro-seven.vercel.app/api/tourism/properties
```

---

### 10. Post-Launch Testing
**Manual Test Flow:**
1. [ ] Register new user
2. [ ] Create property
3. [ ] Create room
4. [ ] Make reservation (direct booking)
5. [ ] Process payment (Stripe test mode)
6. [ ] Generate invoice
7. [ ] Sync with Booking.com (if connected)
8. [ ] Check email notifications

**Monitoring:**
- [ ] Sentry dashboard - no errors
- [ ] Vercel Analytics - traffic normal
- [ ] Database connections - healthy
- [ ] Stripe dashboard - payments processing

---

## 📊 Rollback Plan

### If Something Goes Wrong:

**1. Quick Rollback:**
```bash
vercel rollback
```

**2. Database Rollback:**
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

**3. Emergency Contacts:**
- Admin: @admin
- Support: support@agentflow.pro
- Status Page: status.agentflow.pro

---

## 📈 Success Metrics

**First 24 Hours:**
- ✅ 0 critical errors (Sentry)
- ✅ <2s average response time
- ✅ >99% uptime
- ✅ Payment success rate >95%

**First Week:**
- ✅ 10+ test bookings
- ✅ 5+ invoices generated
- ✅ 2+ channel manager syncs
- ✅ User feedback collected

---

## 🎉 Launch Announcement

**Template:**
```
🚀 AgentFlow Pro is LIVE!

We're excited to announce the MVP launch of AgentFlow Pro - 
AI-powered PMS for boutique hotels and tourism businesses.

Features:
✅ Property & Room Management
✅ Direct Booking Engine
✅ Stripe Payment Processing
✅ Invoice Generation
✅ Channel Manager (Booking.com, Airbnb)
✅ Housekeeping Mobile App
✅ Revenue Analytics

Try it now: https://agentflow-pro-seven.vercel.app

#PMS #HotelTech #AI #Tourism
```

---

## ✅ Final Checklist

- [ ] All P0 items complete
- [ ] All P1 tests passing
- [ ] Production deploy successful
- [ ] Post-launch tests complete
- [ ] Monitoring active
- [ ] Team notified
- [ ] Launch announcement sent

---

**LAUNCH STATUS:** 🟡 READY (Waiting for P0 completion)

**Next Step:** Complete P0 items 1-5, then run `npm run predeploy`
