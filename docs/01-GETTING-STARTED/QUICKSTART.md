# 🚀 QUICK START GUIDE - AgentFlow Pro

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Copy example env file
cp .env.example .env.local

# Generate NextAuth secret
openssl rand -base64 32 >> .env.local
```

### 3. Configure Database

```bash
# Use SQLite for local development (fastest)
DATABASE_URL="file:./dev.db"

# Or PostgreSQL (recommended)
DATABASE_URL="postgresql://user:password@localhost:5432/agentflow"

# Run migrations
npx prisma migrate dev
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3002**

---

## 📦 Essential Configuration

### Minimum Required Variables

```env
# Required
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3002"

# Optional (features won't work without these)
# RESEND_API_KEY=
# STRIPE_SECRET_KEY=
# OPENROUTER_API_KEY=
# CRON_SECRET=
```

### Recommended for Full Features

```env
# Email Notifications
RESEND_API_KEY="re_xxxxxxxxxxxxxx"
EMAIL_FROM="AgentFlow <noreply@yourdomain.com>"

# Stripe (Refunds & Subscriptions)
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxx"

# AI Recommendations
OPENROUTER_API_KEY="sk_or_xxxxxxxxxxxxxx"

# Cron Jobs
CRON_SECRET="your-cron-secret"
DRY_RUN=false
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# UseCaseFactory tests
npm test -- use-case-factory

# API tests
npm test -- api/refunds
npm test -- api/cron
```

### Test with Postman

1. Import `docs/POSTMAN_COLLECTION.json`
2. Set environment variables:
   - `base_url`: `http://localhost:3002`
   - `session_token`: (login to get)
   - `property_id`: Your test property
3. Run requests

---

## 🔑 First Steps After Setup

### 1. Create Admin User

```bash
# Via API
curl -X POST http://localhost:3002/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agentflow.pro",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

### 2. Create Test Property

```bash
curl -X POST http://localhost:3002/api/tourism/properties \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Test Property",
    "type": "hotel",
    "address": {
      "street": "Test 123",
      "city": "Ljubljana",
      "country": "Slovenia"
    }
  }'
```

### 3. Test Email (if configured)

```bash
# Trigger email cron
curl -X POST http://localhost:3002/api/cron/send-guest-emails \
  -H "Authorization: Bearer your-cron-secret"
```

### 4. Test AI Recommendations (if configured)

```bash
curl "http://localhost:3002/api/ai/recommendations?propertyId=prop_123&category=pricing" \
  -H "Cookie: next-auth.session-token=..."
```

---

## 🛠️ Common Tasks

### Database Operations

```bash
# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Build & Deploy

```bash
# Build for production
npm run build

# Run production build
npm run start

# Type check
npm run type-check

# Lint
npm run lint
```

### Cron Jobs (Local Testing)

```bash
# Manually trigger email sending
curl http://localhost:3002/api/cron/send-guest-emails \
  -X POST \
  -H "Authorization: Bearer test-secret"

# Allow manual cron in development
echo "ALLOW_MANUAL_CRON=true" >> .env.local
```

---

## 📁 Project Structure

```
agentflow-pro/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API endpoints
│   │   └── (routes)      # UI routes
│   ├── core/             # Domain logic
│   │   ├── use-cases/    # Business logic
│   │   └── domain/       # Entities
│   ├── infrastructure/   # External services
│   │   └── database/     # Repositories
│   ├── lib/              # Utilities
│   └── services/         # Services
├── tests/                # Test files
├── docs/                 # Documentation
└── prisma/               # Database schema
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check DATABASE_URL format
# SQLite: file:./dev.db
# PostgreSQL: postgresql://user:pass@host:5432/db

# Run migrations
npx prisma migrate dev
```

### NextAuth Error

```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="your-new-secret"
```

### Port Already in Use

```bash
# Kill process on port 3002
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

---

## 📚 Documentation

- **API Documentation:** `docs/API-IMPLEMENTATION-SUMMARY.md`
- **Deployment Guide:** `docs/DEPLOYMENT-CHECKLIST.md`
- **Postman Collection:** `docs/POSTMAN_COLLECTION.json`
- **Environment Setup:** `.env.example`

---

## 🆘 Getting Help

### Check Logs

```bash
# Development logs
npm run dev 2>&1 | tee dev.log

# Production logs
npm run start 2>&1 | tee prod.log
```

### Debug Mode

```bash
# Enable verbose logging
echo "DEBUG=agentflow:*" >> .env.local
```

### Health Check

```bash
# Check all services
curl http://localhost:3002/api/health

# Expected: { database: true, email: true, stripe: true, ai: true }
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Server starts on http://localhost:3002
- [ ] Database migrations ran successfully
- [ ] Can access login page
- [ ] Can create account
- [ ] Can create property
- [ ] API endpoints respond (check Postman)
- [ ] Tests pass (`npm test`)

---

## 🎯 Next Steps

1. **Read API Documentation** - `docs/API-IMPLEMENTATION-SUMMARY.md`
2. **Import Postman Collection** - Test all endpoints
3. **Run Test Suite** - Ensure everything works
4. **Configure Production** - Follow `docs/DEPLOYMENT-CHECKLIST.md`
5. **Deploy to Vercel** - One-click deployment

---

**Happy Coding!** 🚀

For questions or issues, check documentation or contact support.
