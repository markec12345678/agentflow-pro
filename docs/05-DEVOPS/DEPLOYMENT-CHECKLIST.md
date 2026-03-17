# 🚀 DEPLOYMENT CHECKLIST - AgentFlow Pro

## ✅ Pre-Deployment Checklist

### Environment Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Random 32-character string
- [ ] `NEXTAUTH_URL` - Production URL (https://your-domain.com)
- [ ] `RESEND_API_KEY` - Resend API key for emails
- [ ] `EMAIL_FROM` - From address (e.g., `AgentFlow Pro <noreply@your-domain.com>`)
- [ ] `STRIPE_SECRET_KEY` - Stripe live key (sk_live_...)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (whsec_...)
- [ ] `OPENROUTER_API_KEY` - OpenRouter API key for AI
- [ ] `CRON_SECRET` - Random secret for cron jobs

### Database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed database (if needed): `npx prisma db seed`
- [ ] Verify connection: Check Neon/PostgreSQL dashboard
- [ ] Create indexes for performance

### Vercel Configuration
- [ ] Connect GitHub repository
- [ ] Add all environment variables
- [ ] Configure build settings:
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
- [ ] Enable cron jobs (vercel.json)
- [ ] Set production branch: `main`

### Stripe Setup
- [ ] Switch to live mode
- [ ] Create products and prices
- [ ] Configure webhook endpoints:
  - `/api/webhooks/stripe`
  - `/api/webhooks/stripe-refunds`
- [ ] Test webhook signatures
- [ ] Verify refund permissions

### Resend Setup
- [ ] Verify domain
- [ ] Configure DNS records
- [ ] Test email sending
- [ ] Set up email templates

### OpenRouter/AI Setup
- [ ] Add API key
- [ ] Test AI recommendations endpoint
- [ ] Monitor token usage
- [ ] Set usage limits

---

## 📝 Deployment Steps

### 1. Pre-Deployment Testing
```bash
# Run all tests
npm test

# Run type check
npm run type-check

# Build locally
npm run build

# Test production build
npm run start
```

### 2. Database Migration
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

### 3. Vercel Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod
```

### 4. Post-Deployment Verification
- [ ] Check deployment logs
- [ ] Verify all endpoints respond
- [ ] Test authentication flow
- [ ] Test email sending
- [ ] Test refund processing
- [ ] Test AI recommendations
- [ ] Verify cron jobs are running

---

## 🔧 Post-Deployment Tasks

### Monitoring Setup
- [ ] Add Sentry DSN
- [ ] Configure error tracking
- [ ] Set up alerts for critical errors
- [ ] Monitor database performance
- [ ] Track API response times

### Security Hardening
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Configure CORS
- [ ] Set up rate limiting
- [ ] Review security headers
- [ ] Enable DDoS protection

### Performance Optimization
- [ ] Enable Next.js caching
- [ ] Configure CDN
- [ ] Optimize images
- [ ] Minimize bundle size
- [ ] Enable compression

### Documentation
- [ ] Update API documentation
- [ ] Create runbook for operations
- [ ] Document known issues
- [ ] Add troubleshooting guide

---

## 🧪 Testing Checklist

### Critical Flows
- [ ] User registration
- [ ] User login (email + Google)
- [ ] Property creation
- [ ] Reservation creation
- [ ] Payment processing
- [ ] Email notifications
- [ ] Refund processing
- [ ] AI recommendations

### API Endpoints
- [ ] `/api/auth/*` - Authentication
- [ ] `/api/tourism/*` - Tourism endpoints
- [ ] `/api/availability/*` - Availability
- [ ] `/api/invoices/*` - Invoices
- [ ] `/api/refunds/*` - Refunds
- [ ] `/api/ai/*` - AI recommendations
- [ ] `/api/cron/*` - Cron jobs
- [ ] `/api/webhooks/*` - Webhooks

### Integrations
- [ ] Stripe payments
- [ ] Resend emails
- [ ] AI recommendations
- [ ] Database queries
- [ ] Cron jobs

---

## 📊 Monitoring Dashboard

### Key Metrics to Track
- **API Response Time:** < 500ms (p95)
- **Error Rate:** < 1%
- **Database Query Time:** < 100ms (p95)
- **Email Delivery Rate:** > 95%
- **Refund Success Rate:** > 99%
- **AI Response Time:** < 5s

### Alert Thresholds
- Error rate > 5% in 5 minutes
- Response time > 2s for 10 minutes
- Database connection failures
- Email delivery failures > 10%
- Stripe webhook failures

---

## 🔐 Security Checklist

### Authentication
- [ ] JWT tokens expire correctly
- [ ] Session management secure
- [ ] Password hashing (bcrypt)
- [ ] OAuth providers configured
- [ ] CSRF protection enabled

### Authorization
- [ ] Property access validation
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Webhook signature verification
- [ ] Input validation

### Data Protection
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted
- [ ] GDPR compliance (guest data)
- [ ] Data retention policies
- [ ] Backup strategy

---

## 📞 Rollback Plan

### If Deployment Fails
1. **Immediate Action:**
   - Check Vercel deployment logs
   - Review error messages
   - Verify environment variables

2. **Database Issues:**
   - Restore from backup
   - Revert migrations
   - Check schema compatibility

3. **Code Issues:**
   - Revert to previous commit
   - Redeploy stable version
   - Notify stakeholders

4. **Communication:**
   - Update status page
   - Notify users if downtime
   - Document incident

---

## ✅ Go-Live Approval

### Sign-off Required
- [ ] Technical lead approval
- [ ] QA testing complete
- [ ] Security review complete
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Support team trained

### Launch Announcement
- [ ] Update landing page
- [ ] Send email to users
- [ ] Post on social media
- [ ] Update documentation
- [ ] Monitor feedback

---

## 🎉 Post-Launch

### Week 1
- Monitor all metrics daily
- Review error logs
- Collect user feedback
- Address critical issues
- Optimize performance

### Week 2-4
- Analyze usage patterns
- Plan improvements
- Implement feature requests
- Optimize costs
- Scale infrastructure

---

**Last Updated:** March 13, 2026  
**Version:** 1.0.0  
**Status:** Ready for Production
