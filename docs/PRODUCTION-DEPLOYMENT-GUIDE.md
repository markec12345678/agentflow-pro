# AgentFlow Pro - Production Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 17. marec 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Build & Deploy](#build--deploy)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

| Service | Purpose | Provider Options |
|---------|---------|-----------------|
| **PostgreSQL 14+** | Primary database | Supabase, Neon, RDS |
| **Redis** | Caching, sessions, budget tracking | Upstash, Redis Cloud |
| **OpenAI API** | LLM operations, embeddings | OpenAI Platform |
| **Vercel** | Hosting (optional) | Vercel, AWS, GCP |

### Required Accounts

- [ ] OpenAI API key ([platform.openai.com](https://platform.openai.com))
- [ ] Database (Supabase/Neon recommended)
- [ ] Redis (Upstash recommended for serverless)
- [ ] Vercel account (for Vercel deployment)

---

## Environment Setup

### 1. Copy Environment Template

```bash
cp .env.example .env.production
```

### 2. Configure Required Variables

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5"

# Redis (REQUIRED for cost tracking & caching)
UPSTASH_REDIS_REST_URL="https://xxx.us-east-1-1.aws.cloud.upstash.io"

# OpenAI (REQUIRED)
OPENAI_API_KEY="sk-..."

# NextAuth (REQUIRED)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://your-domain.com"

# Stripe (REQUIRED for production)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Budget Settings (RECOMMENDED)
BUDGET_MONTHLY_LIMIT="100"
BUDGET_WARNING_THRESHOLD="0.8"
BUDGET_CRITICAL_THRESHOLD="0.95"

# Cache Settings (RECOMMENDED)
CACHE_SIMILARITY_THRESHOLD="0.95"
CACHE_TTL_SECONDS="86400"
```

### 3. Generate Secrets

```bash
# NEXTAUTH_SECRET (min 32 characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### Option A: Supabase (Recommended)

```bash
# 1. Create project at supabase.com
# 2. Get DATABASE_URL from Settings → Database
# 3. Enable pgvector extension:

# In Supabase Dashboard → Database → Extensions
CREATE EXTENSION IF NOT EXISTS vector;

# 4. Run migrations
npx prisma migrate deploy
```

### Option B: Neon

```bash
# 1. Create project at neon.tech
# 2. Get DATABASE_URL from Connection Details
# 3. Enable pgvector:

psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Run migrations
npx prisma migrate deploy
```

### Option C: Self-Hosted PostgreSQL

```bash
# 1. Install pgvector extension
# Ubuntu/Debian:
apt install postgresql-14-pgvector

# 2. Enable in database
psql -U postgres -d agentflow_pro -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. Run migrations
npx prisma migrate deploy
```

---

## Redis Setup

### Option A: Upstash (Recommended for Serverless)

```bash
# 1. Create database at upstash.com
# 2. Copy REST URL
# 3. Set in .env.production:
UPSTASH_REDIS_REST_URL="https://xxx...:yyy@yyy.us-east-1-1.aws.cloud.upstash.io"
```

### Option B: Redis Cloud

```bash
# 1. Create database at redis.com/cloud
# 2. Get connection URL
# 3. Set in .env.production:
REDIS_URL="redis://user:pass@host:port"
```

### Option C: Self-Hosted Redis

```bash
# Install Redis
# Ubuntu/Debian:
apt install redis-server

# Start Redis
systemctl start redis

# Set in .env.production:
REDIS_URL="redis://localhost:6379"
```

---

## Build & Deploy

### Option A: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add DATABASE_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add OPENAI_API_KEY
vercel env add NEXTAUTH_SECRET
# ... repeat for all required vars

# 5. Deploy to production
vercel --prod
```

### Option B: Docker

```bash
# 1. Build image
docker build -t agentflow-pro .

# 2. Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=... \
  -e UPSTASH_REDIS_REST_URL=... \
  -e OPENAI_API_KEY=... \
  agentflow-pro
```

### Option C: Traditional Server

```bash
# 1. Install dependencies
npm ci --production

# 2. Build
npm run build

# 3. Start (use PM2 for production)
pm2 start npm --name "agentflow-pro" -- start

# Or with Node.js directly
NODE_ENV=production npm start
```

---

## Post-Deployment

### 1. Run Database Migrations

```bash
npx prisma migrate deploy
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Seed Initial Data (Optional)

```bash
npm run db:seed
```

### 4. Verify Deployment

```bash
# Health check endpoint
curl https://your-domain.com/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### 5. Configure Webhooks

```bash
# Stripe Webhooks
# 1. Go to Stripe Dashboard → Developers → Webhooks
# 2. Add endpoint: https://your-domain.com/api/stripe/webhook
# 3. Select events: invoice.paid, customer.subscription.*
# 4. Copy signing key to STRIPE_WEBHOOK_SECRET
```

---

## Monitoring

### Health Checks

| Endpoint | Purpose | Expected Response |
|----------|---------|------------------|
| `/api/health` | Overall health | `{"status":"ok"}` |
| `/api/health/db` | Database health | `{"status":"ok"}` |
| `/api/health/redis` | Redis health | `{"status":"ok"}` |
| `/api/health/openai` | OpenAI API health | `{"status":"ok"}` |

### Cost Monitoring

Access the cost dashboard at: `https://your-domain.com/costs`

Key metrics to monitor:
- **Budget utilization** (target: <80%)
- **Cache hit rate** (target: >50%)
- **Daily spend** (target: within recommended)
- **Model distribution** (target: appropriate for use case)

### Alerting

Configure webhook alerts in `.env.production`:

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
ALERT_EMAIL="admin@your-domain.com"
```

Alerts are sent when:
- Budget reaches 80% (warning)
- Budget reaches 95% (critical)
- Budget is exceeded

---

## Troubleshooting

### Common Issues

#### Database Connection Error

```
Error: Can't reach database server at `host:port`
```

**Solution:**
1. Check DATABASE_URL format
2. Verify database is accessible from deployment region
3. Check firewall rules
4. For Supabase: enable "External connections"

#### Redis Connection Error

```
Error: UPSTASH_REDIS_REST_URL not set
```

**Solution:**
1. Verify UPSTASH_REDIS_REST_URL in environment
2. Check Redis database is active
3. Verify network access

#### OpenAI API Error

```
Error: OpenAI API key not set
```

**Solution:**
1. Set OPENAI_API_KEY in environment
2. Verify API key is valid
3. Check API quota/billing

#### Migration Error

```
Error: Database schema is out of sync
```

**Solution:**
```bash
# Run migrations
npx prisma migrate deploy

# If that fails, reset (WARNING: deletes data)
npx prisma migrate reset
```

#### Build Error

```
Error: Build failed due to TypeScript errors
```

**Solution:**
```bash
# Check TypeScript errors
npm run type-check

# Fix errors and rebuild
npm run build
```

---

## Performance Optimization

### Database

- Enable connection pooling (default: 5 connections)
- Add `?connection_limit=5&connect_timeout=15` to DATABASE_URL
- Use prepared statements (Prisma does this automatically)

### Redis

- Use Upstash for serverless (auto-scaling)
- Set appropriate TTLs (default: 24h for cache)
- Monitor memory usage

### Caching

- Enable semantic cache (default: 95% similarity threshold)
- Monitor cache hit rate (target: >50%)
- Adjust threshold based on use case

### CDN

- Enable Vercel Edge Network (automatic)
- Cache static assets (configured in next.config.js)
- Use ISR for static pages

---

## Security Checklist

- [ ] All environment variables set
- [ ] Database SSL enabled
- [ ] Redis password protected
- [ ] API keys rotated regularly
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Error logging enabled (Sentry recommended)

---

## Support

### Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Reference](./API-DOCS-README.md)
- [Development Guide](./docs/DEVELOPMENT.md)

### Contact

- GitHub Issues: [Report a bug](https://github.com/your-org/agentflow-pro/issues)
- Email: support@agentflow.pro

---

**Deployment Status:** ✅ Production Ready  
**Last Verified:** 17. marec 2026  
**Next Review:** 1. april 2026
