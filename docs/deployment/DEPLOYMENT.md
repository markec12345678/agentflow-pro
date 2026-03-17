# 🚀 AgentFlow Pro - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Build & Deploy](#build--deploy)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] Vercel account (vcel.com)
- [ ] PostgreSQL database (Neon, Supabase, or AWS RDS)
- [ ] Upstash Redis (upstash.com)
- [ ] Stripe account (stripe.com)
- [ ] Resend email (resend.com)
- [ ] Sentry account (sentry.io)

### Required Tools
```bash
# Install Node.js 18+
node --version  # Should be >= 18.17.0

# Install npm
npm --version  # Should be >= 9.0.0

# Install Vercel CLI
npm install -g vercel

# Install Prisma
npm install -g prisma
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/agentflow-pro/agentflow-pro.git
cd agentflow-pro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
# Copy example file
cp .env.example .env.local

# Edit with your values
code .env.local
```

### Required Variables
```env
# Core
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"

# Redis (optional but recommended)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."

# Email
RESEND_API_KEY="re_..."

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI (optional)
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."

# Monitoring
SENTRY_DSN="https://..."
```

### 4. Verify Environment
```bash
npm run verify:production-env
```

---

## Database Setup

### Option 1: Neon (Recommended)
```bash
# Create account at neon.tech
# Create new project
# Copy connection string to DATABASE_URL
```

### Option 2: Supabase
```bash
# Create account at supabase.com
# Create new project
# Go to Settings > Database
# Copy connection string to DATABASE_URL
```

### Option 3: AWS RDS
```bash
# Create RDS PostgreSQL instance
# Configure security groups
# Copy endpoint to DATABASE_URL
```

### Run Migrations
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate:prod

# Seed database (optional)
npm run db:seed
```

---

## Build & Deploy

### Option 1: Vercel (Recommended)

#### Via CLI
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Via Git Integration
1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Configure environment variables
5. Deploy

### Option 2: Self-Hosted

#### Build
```bash
npm run build
```

#### Start Production Server
```bash
npm start
```

#### With PM2
```bash
npm install -g pm2

pm2 start npm --name "agentflow-pro" -- start
pm2 save
pm2 startup
```

#### With Docker
```bash
# Build image
docker build -t agentflow-pro .

# Run container
docker run -p 3000:3000 --env-file .env.local agentflow-pro
```

---

## Post-Deployment

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 2. Run Smoke Tests
```bash
# E2E tests
npm run test:e2e

# Check for broken links
npm run check-links
```

### 3. Configure Custom Domain
```bash
# In Vercel dashboard:
# Settings > Domains > Add Domain
# Update DNS records as instructed
```

### 4. Setup Monitoring
```bash
# Sentry is already configured
# Check dashboard at sentry.io
```

### 5. Configure Webhooks
```bash
# Stripe Webhook
# Go to Stripe Dashboard > Developers > Webhooks
# Add endpoint: https://your-domain.com/api/webhooks/stripe
```

---

## Monitoring

### Application Monitoring
- **Sentry:** Error tracking
- **Vercel Analytics:** Performance metrics
- **Upstash:** Redis metrics

### Database Monitoring
- **Prisma Studio:** `npm run db:studio`
- **Database logs:** Check your provider's dashboard

### Business Metrics
- **Dashboard:** `/dashboard`
- **Analytics:** `/analytics`
- **Reports:** `/reports`

---

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .next node_modules/.cache

# Reinstall dependencies
rm -rf node_modules
npm install

# Try build again
npm run build
```

### Database Connection Error
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Check SSL mode
# Add ?sslmode=require to connection string
```

### Environment Variables Not Working
```bash
# Verify .env.local exists
ls -la .env.local

# Check variable names
cat .env.local | grep VARIABLE_NAME

# Restart development server
npm run dev
```

### Rate Limiting Issues
```bash
# Check Redis connection
npm run verify:production-env

# Clear rate limit cache
# (If using Redis)
redis-cli FLUSHDB
```

---

## Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-name]
```

### Self-Hosted
```bash
# Git checkout previous version
git checkout <commit-hash>

# Rebuild
npm run build

# Restart
pm2 restart agentflow-pro
```

---

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL dump
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Automated Backups
- Configure daily backups in your database provider
- Store backups in S3 or similar
- Test restore procedure monthly

---

## Security Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database SSL enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Secrets rotated

### Post-Deployment
- [ ] Security scan completed
- [ ] Penetration testing done
- [ ] Monitoring configured
- [ ] Alert rules set up
- [ ] Backup strategy tested
- [ ] Incident response plan ready

---

## Performance Optimization

### Bundle Size
```bash
npm run analyze
```

### Database Queries
```bash
# Enable query logging
DATABASE_URL="postgresql://...?log_queries=true"

# Check slow queries
npm run db:studio
```

### Caching
- Enable Redis caching
- Configure CDN (Vercel Edge Network)
- Set appropriate cache headers

---

## Support

**Documentation:** https://docs.agentflow.pro  
**API Reference:** https://api.agentflow.pro/docs  
**GitHub Issues:** https://github.com/agentflow-pro/agentflow-pro/issues  
**Discord:** https://discord.gg/agentflow-pro  
**Email:** support@agentflow.pro  

---

## Deployment Checklist

### Development
- [ ] Code complete
- [ ] Tests passing
- [ ] Linting clean
- [ ] Documentation updated

### Staging
- [ ] Deployed to staging
- [ ] E2E tests passing
- [ ] Performance acceptable
- [ ] Security scan passed

### Production
- [ ] Approved by team
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Rollback plan ready

---

**Last Updated:** 2026-03-15  
**Version:** 1.0.0
