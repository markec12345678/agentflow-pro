# 🔧 Vercel Environment Variables Setup

## Problem
Na Vercelu se ne prikazuje pravi vmesnik ker manjkajo environment variables!

**Trenutni status:**
- ✅ Deployment Ready
- ❌ Manjkajo environment variables
- ❌ Build ne deluje pravilno
- ❌ Strani se ne nalagajo pravilno

---

## 🚨 Nujno Dodati Environment Variables

### 1. Pojdi na Vercel Dashboard:
👉 https://vercel.com/markec12345678/agentflow-pro/settings/environment-variables

### 2. Dodaj naslednje spremenljivke:

#### **Production Environment:**

```
NEXTAUTH_URL=https://agentflow-pro-seven.vercel.app
NEXTAUTH_SECRET=production-auth-secret-32-chars-long-minimum
JWT_SECRET=production-jwt-secret-key-32-chars-min

DATABASE_URL=postgres://b7a41b81c9e5e820c32f5dc3cd8a33ee353337302335d377c9612b3d9de5a830:sk_OkP4Zm_mT_ZXd69wcAn32@db.prisma.io:5432/postgres?sslmode=require

MOCK_MODE=true
NODE_ENV=production

ADMIN_EMAILS=robertpezdirc@gmail.com

STRIPE_SECRET_KEY=sk_test_51S3GQn1FAT7uc4L5Lho5ld2AQ932ASBa9PWeRT4XiNXmIggpgo8ZCaqFHfTBI5DagkuCPKCR8WkbDTP4f1V33n1N002aZEzQqX
STRIPE_PUBLISHABLE_KEY=pk_test_51S3GQn1FAT7uc4L5fwnLpVhLLr0zyUyRqiXiowS61jHqHKSrl0YzBM6TrBHXoqV1jiZCq15GUPxQ7UwB9V03Tj9Y00Yfi3P96B
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S3GQn1FAT7uc4L5fwnLpVhLLr0zyUyRqiXiowS61jHqHKSrl0YzBM6TrBHXoqV1jiZCq15GUPxQ7UwB9V03Tj9Y00Yfi3P96B
STRIPE_WEBHOOK_SECRET=whsec_test_...

OPENAI_API_KEY=sk-... (ali pusti prazno za MOCK_MODE)
GEMINI_API_KEY=AIzaSyBFnzT9x4XFzs1T1FFZr3HyfOiAV-f3QA4
ALIBABA_QWEN_API_KEY=sk-d713426b835c45f4b0a87f8b5c9c954e
FIRECRAWL_API_KEY=fc-332e6a6853f74be5b768e02aac553938
SERPAPI_API_KEY=cebdc3523fc6a0d6bda9b46292551c545e56eceeac46276f48188095179c6d26
CONTEXT7_API_KEY=ctx7sk-9f01fe80-1c60-41e5-aef5-5e16c162528e

GITHUB_TOKEN=ghp_...

SENTRY_DSN=https://test@o0.ingest.sentry.io/0

CRON_SECRET=cron_secret_32_chars_minimum_for_production_1234

PUSHER_APP_ID=...
PUSHER_KEY=p97nDdo0ET2Lh9jlTJQ7pUs3Ax71Ax06W8mRwy2adXc
PUSHER_SECRET=ELAdykvSnuKWYTcm3p2RY
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=p97nDdo0ET2Lh9jlTJQ7pUs3Ax71Ax06W8mRwy2adXc
NEXT_PUBLIC_PUSHER_CLUSTER=eu

QDRANT_URL=https://302d1c5a-0ffe-4a02-9192-8855477c2c60.us-east-1-1.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.rae9Aoh2UyRL9N1se1vprhw3qgwWpg7QBKcZiQ8aWCU
```

---

## 📋 Koraki:

### 1. Odpri Vercel Dashboard:
https://vercel.com/markec12345678/agentflow-pro/settings/environment-variables

### 2. Klikni "Add New":
Dodaj vsako spremenljivko posebej

### 3. Izberi Environment:
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. Save & Deploy:
Po dodajanju vseh spremenljivk klikni "Redeploy"

---

## ✅ Preveri:

### 1. Deployment Status:
https://vercel.com/markec12345678/agentflow-pro/activity

### 2. Live Site:
https://agentflow-pro-seven.vercel.app

### 3. Build Logs:
Preveri če so vse environment variables naložene

---

## 🔍 Troubleshooting

### Težava: Stran še vedno ne deluje

**Rešitev:**
1. Preveri če so vse environment variables dodane
2. Klikni "Redeploy" v Vercel dashboardu
3. Preveri build logse za napake

### Težava: Build fails

**Rešitev:**
```bash
# Lokalno testiraj build
npm run build:vercel

# Preveri .env.local
cat .env.local

# Generiraj Prisma client
npx prisma generate
```

### Težava: Manjkajoče strani

**Rešitev:**
Preveri `next.config.ts`:
```typescript
export default withSentryConfig(
  {
    // Preveri če so vse strani vključene
  }
);
```

---

## 📊 Status:

| Spremenljivka | Status |
|---------------|--------|
| NEXTAUTH_URL | ⚠️ Dodati |
| NEXTAUTH_SECRET | ⚠️ Dodati |
| DATABASE_URL | ⚠️ Dodati |
| STRIPE_* | ⚠️ Dodati |
| API Keys | ⚠️ Dodati |
| MOCK_MODE | ✅ V vercel.json |

---

**Zadnja posodobitev:** March 4, 2026  
**Commit:** vercel.json posodobljen
