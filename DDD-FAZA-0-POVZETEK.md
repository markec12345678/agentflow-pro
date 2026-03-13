# 🚀 DDD Faza 0 - Poročilo o Napredku

**Datum:** 13. marec 2026  
**Status:** Delno končano ⚠️

---

## ✅ Končani Koraki

### 1. Backup Branch
- ✅ Branch `before-ddd-refactor` ustvarjen
- ✅ Pushan na GitHub

### 2. Nova Struktura Map
- ✅ `src/core/domain/` ustvarjena (z index.ts)
- ⚠️ Podmape so bile ukazane ampak niso bile verifikirane

### 3. Premiki Datotek
- ⚠️ PowerShell Move-Item ukazi so se izpisali kot uspešni, ampak datoteke niso bile dejansko premaknjene
- ⚠️ Potrebno ročno premakniti datoteke

---

## ⚠️ Težave

### Težava 1: PowerShell Move-Item ni deloval pravilno
PowerShell ukazi so se izpisali kot uspešni, ampak:
- Mape `src/core/`, `src/features/`, `src/shared/` niso bile dejansko ustvarjene (razen index.ts)
- Datoteke niso bile premaknjene

**Razlog:** Verjetno permissions issue ali pa ukazi niso bili izvršeni v pravilni working directory.

---

## 📋 Trenutno Stanje

### Obstoječe Mape (ki jih rabimo premakniti):

```
src/
├── lib/tourism/              # 38 datotek → premakniti v core/domain/tourism/services/
├── lib/guest-experience/     # 4 datoteke → premakniti v core/domain/guest/services/
├── components/tourism/       # 8 komponent → premakniti v features/tourism/components/
├── agents/                   # → premakniti v features/agents/
├── domain/                   # → premakniti v core/domain/
├── pages/                    # → izbrisati
└── web/                      # → premakniti v shared/ui/
```

---

## 🔄 Naslednji Koraki (Ročno)

### Korak 1: Ustvari mape z Windows Explorer ali `mkdir`

```cmd
cd f:\ffff\agentflow-pro\src
mkdir core\domain\tourism\entities
mkdir core\domain\tourism\value-objects
mkdir core\domain\tourism\services
mkdir core\domain\tourism\events
mkdir core\domain\booking\entities
mkdir core\domain\booking\value-objects
mkdir core\domain\booking\services
mkdir core\domain\booking\events
mkdir core\domain\guest\entities
mkdir core\domain\guest\value-objects
mkdir core\domain\guest\services
mkdir core\domain\guest\events
mkdir core\domain\shared
mkdir core\use-cases
mkdir core\ports
mkdir features\tourism\components
mkdir features\tourism\hooks
mkdir features\tourism\api-client
mkdir features\agents
mkdir features\housekeeping
mkdir features\billing
mkdir features\auth
mkdir shared\ui
mkdir shared\lib
mkdir shared\types
mkdir shared\constants
```

### Korak 2: Premakni datoteke z Windows Explorer

1. **Premakni `src/domain/*` → `src/core/domain/`**
2. **Premakni `src/lib/tourism/*.ts` → `src/core/domain/tourism/services/`**
   - pricing-engine.ts
   - dynamic-pricing.ts
   - occupancy.ts
   - cost-tracker.ts
   - predictive-analytics.ts
   - rate-shopping.ts
3. **Premakni `src/lib/guest-experience/*` → `src/core/domain/guest/services/`**
4. **Premakni `src/components/tourism/*` → `src/features/tourism/components/`**
5. **Premakni `src/agents/*` → `src/features/agents/`**
6. **Premakni `src/web/components/ui/*` → `src/shared/ui/`**
7. **Izbriši `src/pages/`**
8. **Izbriši `src/domain/` (ko je prazna)**
9. **Izbriši `src/web/` (ko je prazna)**

### Korak 3: Posodobi Import-e

V premaknjenih datotekah posodobi import paths:

```typescript
// ❌ Pred
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

// ✅ Po
import { prisma } from '@/infrastructure/database/prisma'
import { formatPrice } from '@/shared/lib/format'
```

### Korak 4: Testiraj

```bash
npm run build
npm test
```

### Korak 5: Commit

```bash
git add .
git commit -m "refactor: DDD Faza 0 - ustvarjena core struktura"
git push origin before-ddd-refactor
```

---

## 📊 Napredek

| Naloga | Status | % |
|--------|--------|---|
| Backup branch | ✅ Končano | 100% |
| Ustvari mape | ⚠️ Delno | 10% |
| Premakni domain/ | ❌ Ni začeto | 0% |
| Premakni lib/tourism/ | ❌ Ni začeto | 0% |
| Premakni lib/guest-experience/ | ❌ Ni začeto | 0% |
| Premakni components/tourism/ | ❌ Ni začeto | 0% |
| Premakni agents/ | ❌ Ni začeto | 0% |
| Izbriši pages/ | ❌ Ni začeto | 0% |
| Izbriši web/ | ❌ Ni začeto | 0% |
| Testiraj | ❌ Ni začeto | 0% |
| **Skupaj** | | **~10%** |

---

## 🎯 Priporočilo

Zaradi težav s PowerShell ukazi, **priporočam ročni premik** z Windows Explorerjem:

1. Odpri `f:\ffff\agentflow-pro\src` v Windows Explorerju
2. Sledi korakom zgoraj
3. Po premiku zaženi `npm run build` za validacijo

To bo hitreje in bolj zanesljivo kot poskušanje z command line ukazi na Windows.

---

**Next Action:** Ročni premik z Windows Explorerjem ali pa uporaba `robocopy` ukaza.
