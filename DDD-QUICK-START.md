# 🚀 DDD Refactor – Quick Start Checklist

**Datum:** 13. marec 2026  
**Projekt:** AgentFlow Pro  
**Cilj:** Danes začeti s Fazo 0

---

## ✅ Faza 0: Priprava (1 dan)

### **Korak 1: Backup (5 minut)**

```bash
# Preveri trenutni status
git status

# Ustvari backup branch
git checkout -b before-ddd-refactor

# Pushaj na GitHub
git push -u origin before-ddd-refactor
```

**Check:**
- [ ] Backup branch ustvarjen
- [ ] Pushan na GitHub
- [ ] Team obveščen

---

### **Korak 2: Ustvari Novo Strukturo (15 minut)**

```bash
# Core domain
mkdir -p src/core/domain/{tourism,booking,guest,shared}
mkdir -p src/core/domain/tourism/{entities,value-objects,services,events}
mkdir -p src/core/domain/booking/{entities,value-objects,services,events}
mkdir -p src/core/domain/guest/{entities,value-objects,services,events}
mkdir -p src/core/domain/shared/{entities,value-objects}

# Core use-cases & ports
mkdir -p src/core/use-cases
mkdir -p src/core/ports

# Features
mkdir -p src/features/{tourism,agents,housekeeping,billing,auth}
mkdir -p src/features/tourism/{components,hooks,api-client,types}
mkdir -p src/features/agents/{components,hooks,api-client,types}
mkdir -p src/features/housekeeping/{components,hooks,api-client,types}
mkdir -p src/features/billing/{components,hooks,api-client,types}
mkdir -p src/features/auth/{components,hooks,api-client,types}

# Shared
mkdir -p src/shared/{ui,lib,types,constants}

# Tests (če še ne obstajajo)
mkdir -p src/tests/unit/{domain,use-cases,infrastructure}
```

**Check:**
- [ ] Vse mape ustvarjene
- [ ] Struktura vidna v file explorerju

---

### **Korak 3: Premakni Prvo Datoteko (30 minut) – Proof of Concept**

**Izberi eno datoteko za test:**

```bash
# Option A: Pricing logic (najbolj kritična)
ls src/lib/tourism/

# Izberi najpomembnejšo datoteko
# npr. pricing-engine.ts ali pricing-calculator.ts

# Premakni
mv src/lib/tourism/pricing-engine.ts src/core/domain/tourism/services/PricingCalculator.ts
```

**Posodobi import-e v premaknjeni datoteki:**

```typescript
// ❌ Pred
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

// ✅ Po
import { prisma } from '@/infrastructure/database/prisma'
import { formatPrice } from '@/shared/lib/format'
```

**Check:**
- [ ] Datoteka premaknjena
- [ ] Import-i posodobljeni
- [ ] Build deluje: `npm run build`

---

### **Korak 4: Izbriši src/pages (če obstaja) (15 minut)**

```bash
# Preveri kaj je v pages/
ls src/pages/

# Če je prazno ali samo legacy strani:
rm -rf src/pages/

# Če so strani ki jih rabiš:
# 1. Migriraj v app/
mv src/pages/about.tsx src/app/(public)/about/page.tsx

# 2. Potem izbriši
rm -rf src/pages/
```

**Check:**
- [ ] `src/pages/` ne obstaja več
- [ ] Vse strani delujejo v `app/`
- [ ] Build deluje

---

### **Korak 5: Premakni Domain (15 minut)**

```bash
# Premakni celoten domain
mv src/domain/* src/core/domain/

# Preveri
ls src/core/domain/
# Mora pokazati: tourism/ booking/ guest/ shared/
```

**Check:**
- [ ] `src/domain/` je prazna ali ne obstaja
- [ ] `src/core/domain/` vsebuje vse domene
- [ ] Build deluje

---

### **Korak 6: Testiraj (30 minut)**

```bash
# 1. Build
npm run build

# 2. Unit testi
npm test

# 3. E2E testi (če so hitri)
npm run test:e2e

# 4. Odpri app v browserju
npm run dev
# Obišči: http://localhost:3002
# Testiraj glavne funkcionalnosti
```

**Check:**
- [ ] Build uspešen
- [ ] Testi passing
- [ ] App deluje v browserju
- [ ] Ključne funkcionalnosti delujejo

---

### **Korak 7: Commit (5 minut)**

```bash
# Preveri spremembe
git status

# Dodaj vse
git add .

# Commit
git commit -m "refactor: DDD Faza 0 - ustvarjena core struktura

- Ustvarjen src/core/domain/ z tourism, booking, guest, shared
- Ustvarjen src/core/use-cases/ in src/core/ports/
- Ustvarjen src/features/ za tourism, agents, billing, auth, housekeeping
- Ustvarjen src/shared/ za UI komponente in utility-je
- Izbrisan src/pages/ (popoln prehod na App Router)
- Premaknjena pricing-engine.ts v core/domain/tourism/

Proof-of-concept za DDD refactor."

# Push
git push origin before-ddd-refactor
```

**Check:**
- [ ] Commit narejen
- [ ] Pushan na GitHub
- [ ] Team obveščen o napredku

---

## 📊 Faza 0 Checklist Povzetek

| Korak | Trajanje | Status |
|-------|----------|--------|
| 1. Backup | 5 min | ⬜ |
| 2. Ustvari mape | 15 min | ⬜ |
| 3. Premakni prvo datoteko | 30 min | ⬜ |
| 4. Izbriši pages | 15 min | ⬜ |
| 5. Premakni domain | 15 min | ⬜ |
| 6. Testiraj | 30 min | ⬜ |
| 7. Commit | 5 min | ⬜ |
| **Skupaj** | **~2 uri** | |

---

## 🎯 Dokončana Faza 0 – Rezultati

Ko končaš Fazo 0, boš imel:

```
src/
├── ✅ core/
│   ├── domain/
│   │   ├── tourism/
│   │   ├── booking/
│   │   ├── guest/
│   │   └── shared/
│   ├── use-cases/
│   └── ports/
│
├── ✅ features/
│   ├── tourism/
│   ├── agents/
│   ├── housekeeping/
│   ├── billing/
│   └── auth/
│
├── ✅ shared/
│   ├── ui/
│   ├── lib/
│   ├── types/
│   └── constants/
│
└── ✅ app/ (brez pages/)
```

**Dosežki:**
- ✅ Struktura pripravljena
- ✅ Prva datoteka premaknjena (proof-of-concept)
- ✅ `src/pages/` izbrisan
- ✅ Domain v `core/`
- ✅ Build in testi passing

---

## 🚀 Naprej – Faza 1 (Naslednji dan)

**Cilj:** Premakniti vso business logiko iz `lib/` v `core/domain/`

```bash
# 1. Premakni tourism logiko
mv src/lib/tourism/* src/core/domain/tourism/services/

# 2. Premakni guest-experience logiko
mv src/lib/guest-experience/* src/core/domain/guest/services/

# 3. Posodobi import-e vseh datotek
# (Uporabi find & replace v IDE-ju)

# 4. Testiraj
npm run build && npm test
```

---

## 📈 Metrike Po Fazi 0

| Metrika | Pred | Po Fazi 0 |
|---------|------|-----------|
| **Domain v core/** | 0% | 100% ✅ |
| **Pages Router** | Obstoječi | Izbrisan ✅ |
| **Feature Slices** | 0 | 5 ustvarjenih ✅ |
| **Proof-of-Concept** | Ne | Da (pricing) ✅ |

---

## ⚠️ Če Kaj Ne Deluje

### **Build ne deluje:**

```bash
# 1. Preveri import-e
# Ali so poti pravilne?

# 2. Preveri TypeScript errors
npx tsc --noEmit

# 3. Počisti cache
rm -rf .next/
npm run build
```

### **Testi ne delujejo:**

```bash
# 1. Preveri import paths v testih
# Posodobi na nove poti

# 2. Run tests z verbose output
npm test -- --verbose

# 3. Fix failing tests
```

### **App ne deluje:**

```bash
# 1. Preveri console za errors
npm run dev

# 2. Preveri browser console (F12)

# 3. Testiraj posamezne strani
```

---

## 🎯 Nasveti za Uspeh

✅ **Delaj v majhnih korakih** – Commitaj vsakih 30 minut  
✅ **Testiraj pogosto** – Po vsakem premiku  
✅ **Ne boj se revert-at** – Zato imamo backup branch  
✅ **Komuniciraj** – Team naj ve kaj delaš  
✅ **Dokumentiraj** – Piši kaj si spremenil  

---

**Ready? Go! 🚀**

```bash
# Začni zdaj
git checkout -b before-ddd-refactor
mkdir -p src/core/domain/{tourism,booking,guest,shared}
```

---

**Dokument pripravljen:** 13. marec 2026  
**Avtor:** AgentFlow Pro AI Agent  
**Status:** Ready for execution – **START TODAY**
