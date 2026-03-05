# 🧪 Functional Validation Suite - Hitri Vodnik

**Script:** `scripts/validate-functional.ps1`  
**Datum:** 5. Marec 2026  
**Status:** ✅ Ready to use

---

## 🚀 Hitri Ukazi

### 1. **KOMPLETEN TEST** (vsi koraki)
```powershell
.\scripts\validate-functional.ps1
```
**Trajanje:** 1-5 minut  
**Testov:** 8 korakov, 15+ preverjanj

---

### 2. **HITER API CHECK** (samo API-ji)
```powershell
.\scripts\validate-functional.ps1 -Step 2
```
**Trajanje:** 10-30 sekund  
**Testi:**
- ✅ /api/health
- ✅ /api/mcp/available
- ✅ /api/skills

---

### 3. **PRODUCTION BUILD TEST**
```powershell
.\scripts\validate-functional.ps1 -Step 7
```
**Trajanje:** 2-5 minut (če builda)  
**Testi:**
- ✅ .next folder exists
- ✅ Build successful

---

### 4. **DEBUG MODE** (verbose output)
```powershell
.\scripts\validate-functional.ps1 -Verbose
```
**Trajanje:** 1-5 minut  
**Output:** Podrobni logi za debugging

---

## 📋 Vsi Koraki (1-8)

| # | Korak | Opis | Trajanje |
|---|-------|------|----------|
| **1** | Preveri dev server | Check if port 3002 active | 5s |
| **2** | Testiraj API-je | Health, MCP, Skills | 10s |
| **3** | Authentication | NextAuth config, env vars | 5s |
| **4** | Database | Prisma client, connection | 10s |
| **5** | WebSocket | socket.io files, dependency | 5s |
| **6** | User Flow | Receptor dashboard APIs | 10s |
| **7** | Production Build | npm run build | 2-5 min |
| **8** | Smoke Test | Production server test | 15s |

---

## 🎯 Primeri Uporabe

### Pred Deployem (lokalno testiranje)
```powershell
# 1. Zaženi dev server
npm run dev

# 2. V drugem terminalu zaženi teste
.\scripts\validate-functional.ps1

# 3. Če vsi testi uspejo -> deploy
npx vercel --prod
```

### Po Deployu (production verification)
```powershell
# Testiraj production build
.\scripts\validate-functional.ps1 -Step 7,8

# Ali samo API check
.\scripts\validate-functional.ps1 -Step 2
```

### Debugging Session
```powershell
# Verbose output za iskanje napak
.\scripts\validate-functional.ps1 -Verbose

# Samo specifičen korak ki faila
.\scripts\validate-functional.ps1 -Step 4  # Database test
```

---

## 📊 Rezultati Testov

### Output Format
```
AgentFlow Pro - Functional Validation Suite
   Base URL: http://localhost:3002 | Steps: ALL
======================================================================

KORAK 1: Preveri ali dev server teče
======================================================================
  [OK] Port 3002 je v uporabi
     -> PID: 12345
  [OK] Next.js proces je aktiven
     -> Node v24.13.0

...

======================================================================
FUNCTIONAL VALIDATION REPORT
======================================================================
  Duration: 54.8s
  Passed: 14
  Failed: 1
  Pass Rate: 93.3%

CRITICAL ISSUES (must fix before launch):
  - Dev server teče: Zaženi: npm run dev

======================================================================
VSI FUNKCIONALNI TESTI USPEŠNI! Sistem dejansko DELUJE.
```

---

## 🔧 Troubleshooting

### Problem: "Dev server not running"
**Rešitev:**
```powershell
# Zaženi dev server
npm run dev

# Počakaj 10-15 sekund
# Ponovno zaženi test
.\scripts\validate-functional.ps1
```

### Problem: "Prisma client not generated"
**Rešitev:**
```powershell
# Generiraj Prisma client
npx prisma generate

# Ponovno zaženi test
.\scripts\validate-functional.ps1 -Step 4
```

### Problem: "Build failed"
**Rešitev:**
```powershell
# Preveri build loge
Get-Content $env:TEMP\build-error.txt

# Poskusi popraviti
npm install
npm run build

# Ponovno testiraj
.\scripts\validate-functional.ps1 -Step 7
```

---

## ✅ Success Criteria

**Test je uspešen ko:**
- ✅ Pass Rate: 100% (ali >90%)
- ✅ 0 CRITICAL ISSUES
- ✅ Production build successful
- ✅ API endpoints responsive

**Potem lahko:**
1. ✅ Deployaš na Vercel
2. ✅ Testiraš z realnimi userji
3. ✅ Launchaš v production

---

## 📞 Povezave

- **Script:** `scripts/validate-functional.ps1`
- **Launch Checklist:** `docs/production-launch-checklist.md`
- **Deployment Fix:** `DEPLOYMENT-FIX.md`
- **Quick Deploy:** `QUICK-DEPLOY.md`

---

**Zadnji update:** 5. Marec 2026  
**Version:** 1.0  
**Author:** AgentFlow Pro Team
