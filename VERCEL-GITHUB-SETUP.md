# 🔗 Vercel-GitHub Integration Setup

## Problem
Vercel se ne usklajuje samodejno z GitHubom. To je zato ker GitHub-Vercel integracija ni pravilno nastavljena.

## Rešitev - 2 Možnosti

### Možnost 1: GitHub Actions (Priporočeno) ✅

Pravkar smo dodali `.github/workflows/vercel-deploy.yml` ki avtomatsko deploya na Vercel ob pushu.

#### Koraki:

1. **Dodaj GitHub Secrets:**
   Pojdi na: `https://github.com/markec12345678/agentflow-pro/settings/secrets/actions`

   Dodaj naslednje secrete:
   ```
   VERCEL_TOKEN = <tvoj Vercel token>
   VERCEL_ORG_ID = <tvoj Vercel org ID>
   VERCEL_PROJECT_ID = <tvoj Vercel project ID>
   ```

2. **Pridobi Vercel Token:**
   - Pojdi na: https://vercel.com/account/tokens
   - Klikni "Create Token"
   - Kopiraj token in ga shrani kot `VERCEL_TOKEN`

3. **Pridobi Org ID in Project ID:**
   - Org ID: `.vercel/project.json` → `orgId`
   - Project ID: `.vercel/project.json` → `projectId`

   Tvoj `.vercel/project.json`:
   ```json
   {
     "projectId": "prj_aqbMqYRL7eQIr4DpYzNbZdN3UjXp",
     "orgId": "team_uofezFPiCWAFXGd41Ar3b9TH",
     "projectName": "agentflow-pro"
   }
   ```

4. **Pushaj na GitHub:**
   ```bash
   git push origin main
   ```

5. **GitHub Actions se bo samodejno sprožil:**
   - Pojdi na: https://github.com/markec12345678/agentflow-pro/actions
   - Videl boš "Deploy to Vercel" workflow
   - Ko se konča, je deploy uspešen

---

### Možnost 2: Vercel Dashboard Integracija

Če želiš direktno Vercel-GitHub integracijo:

1. **Pojdi na Vercel Dashboard:**
   https://vercel.com/dashboard

2. **Izberi Project:**
   Klikni na "agentflow-pro"

3. **Settings → Git:**
   - Klikni "Connect Git Repository"
   - Izberi GitHub
   - Avtoriziraj Vercel
   - Izberi repozitorij: `markec12345678/agentflow-pro`
   - Branch: `main`

4. **Root Directory:**
   Pusti prazno (saj ni monorepo)

5. **Build and Output Settings:**
   ```
   Framework Preset: Next.js
   Build Command: npm run build:vercel
   Output Directory: .next
   Install Command: npm install
   ```

6. **Environment Variables:**
   Dodaj vse iz `.env.local` v Vercel:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - OPENAI_API_KEY
   - itd.

7. **Save in Deploy:**
   Klikni "Save" in Vercel bo samodejno deployal ob vsakem pushu na main

---

## Ročni Deploy (Če ne želiš avtomatizacije)

### 1. Preko Vercel CLI:
```bash
cd F:\ffff\agentflow-pro
npx vercel --prod
```

### 2. Preko Vercel Dashboard:
- Pojdi na https://vercel.com/markec12345678/agentflow-pro
- Klikni "Redeploy" na zadnji deployment

---

## Preveri Deployment

### GitHub Actions Status:
https://github.com/markec12345678/agentflow-pro/actions

### Vercel Deployment Status:
https://vercel.com/markec12345678/agentflow-pro

### Live URL:
https://agentflow-pro-seven.vercel.app

---

## Troubleshooting

### "No files matching the criteria were found"

To se zgodi ko:
1. Build command ne deluje
2. Prisma client ni generiran
3. Environment variables manjkajo

**Rešitev:**
```bash
# Lokalno testiraj build
npm run build:vercel

# Generiraj Prisma client
npx prisma generate

# Preveri .env spremenljivke
cat .env.local
```

### Vercel Build Fails

Preveri logs na:
https://vercel.com/markec12345678/agentflow-pro/activity

Pogoste napake:
- Missing environment variables → Dodaj v Vercel Dashboard
- Prisma migration errors → Uporabi `prisma db push` namesto `prisma migrate`
- Node version mismatch → Nastavi na Node 20 v `vercel.json`

---

## Current Status

✅ GitHub Actions workflow dodan (`.github/workflows/vercel-deploy.yml`)
✅ Vercel project linked (`.vercel/project.json` exists)
✅ Tests passing (344/344)
✅ Code pushed to GitHub

⚠️ **Missing:** GitHub Secrets za avtomatski deploy

---

## Next Steps

1. **Dodaj GitHub Secrets** (zgoraj navodila)
2. **Testaj deployment:**
   ```bash
   git commit --allow-empty -m "🚀 Test deployment"
   git push origin main
   ```
3. **Preveri GitHub Actions** ali se je sprožil
4. **Preveri Vercel** ali je deploy uspešen

---

**Zadnja sprememba:** March 4, 2026
**Commit:** 6ba4f09 - 🚀 Add Vercel deployment workflow
