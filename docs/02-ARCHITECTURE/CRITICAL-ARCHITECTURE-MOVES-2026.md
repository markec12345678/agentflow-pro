# 🚀 Kritični Arhitekturni Premiki 2026

**Datum:** 13. marec 2026  
**Projekt:** AgentFlow Pro  
**Prioriteta:** P0 – Takoj začeti

---

## 📋 1. Preslikava: Trenutno → Cilj

| Trenutna Lokacija | Nova Lokacija | Razlog | Prioriteta |
|-------------------|---------------|--------|------------|
| `src/lib/tourism/*` | `src/core/domain/tourism/*` | **Poslovna logika** ni utility | 🔴 P0 |
| `src/lib/guest-experience/*` | `src/core/domain/guest/*` | Gost logika je **domena** | 🔴 P0 |
| `src/components/tourism/*` | `src/features/tourism/components/*` | Komponente blizu **svoje logike** | 🟡 P1 |
| `src/web/components/*` | `src/shared/ui/*` ali `src/features/*` | **Odpravi mapo** `web/` | 🟡 P1 |
| `src/app/api/tourism/*` | `src/app/api/tourism/*` | **Tanke plasti** – kličejo use-cases | 🟡 P1 |
| `src/domain/*` | `src/core/domain/*` | Okrepi **core** domeno | 🔴 P0 |
| `src/agents/*` | `src/features/agents/*` | Agenti so **funkcionalnost** | 🟡 P1 |
| `src/pages/*` | **IZBRIŠI** | Popoln prehod na **App Router** | 🔴 P0 |
| `src/infrastructure/ai/*` | `src/infrastructure/ai/*` | Pusti, a poveži s **ports** | 🟢 P2 |

---

## 🔴 2. Kritični Premiki (Takoj)

### **Premik 1: src/lib/tourism → core/domain/tourism**

**Trenutno:**
```
src/lib/tourism/
├── booking-rules.ts        # Business logic
├── pricing-calculator.ts   # Business logic
└── availability.ts         # Business logic
```

**Problem:**
- `lib/` naj bi bili **splošni utility-ji** (formatiranje, validacije)
- Tourism logika je **poslovno pravilo**, ne utility
- Težko testirati brez database

**Rešitev:**
```
src/core/domain/tourism/
├── entities/
│   ├── Property.ts
│   └── Reservation.ts
├── value-objects/
│   ├── Money.ts
│   └── DateRange.ts
├── services/
│   ├── PricingCalculator.ts
│   └── AvailabilityChecker.ts
└── events/
    └── BookingCreated.ts
```

**Akcija:**
```bash
# 1. Ustvari strukturo
mkdir -p src/core/domain/tourism/{entities,value-objects,services,events}

# 2. Premakni datoteke
mv src/lib/tourism/booking-rules.ts src/core/domain/tourism/services/
mv src/lib/tourism/pricing-calculator.ts src/core/domain/tourism/services/
mv src/lib/tourism/availability.ts src/core/domain/tourism/services/

# 3. Refaktoriraj v Domain Entities
# (glej DDD-IMPLEMENTATION-PLAN-2026.md za primere)
```

---

### **Premik 2: src/lib/guest-experience → core/domain/guest**

**Trenutno:**
```
src/lib/guest-experience/
├── communication.ts        # Guest communication logic
├── preferences.ts          # Guest preferences logic
└── history.ts              # Guest history logic
```

**Rešitev:**
```
src/core/domain/guest/
├── entities/
│   └── Guest.ts
├── value-objects/
│   └── GuestPreferences.ts
└── services/
    └── GuestCommunication.ts
```

**Akcija:**
```bash
mkdir -p src/core/domain/guest/{entities,value-objects,services}
mv src/lib/guest-experience/* src/core/domain/guest/services/
```

---

### **Premik 3: src/pages → IZBRIŠI**

**Trenutno:**
```
src/
├── app/          # App Router (aktiven)
└── pages/        # Pages Router (legacy)
```

**Problem:**
- Next.js 14+ uporablja **izključno App Router**
- `pages/` povzroča konflikte
- Podvajanje routing logike

**Rešitev:**
```bash
# 1. Preveri če pages/ sploh rabimo
ls src/pages/

# 2. Migriraj strani v app/ (če so še uporabne)
mv src/pages/about.tsx src/app/(public)/about/page.tsx

# 3. Izbriši
rm -rf src/pages/

# 4. Posodobi next.config.js
# Odstrani pages router konfiguracijo
```

---

### **Premik 4: src/domain → core/domain**

**Trenutno:**
```
src/domain/
├── ai/
└── tourism/
```

**Problem:**
- `domain/` v root-u src/ je **premalo jasen**
- Ni ločen od tehničnih slojev
- Težko najti "kje je domain"

**Rešitev:**
```bash
# 1. Ustvari core/
mkdir src/core

# 2. Premakni
mv src/domain/* src/core/domain/

# 3. Razširi z novimi domenami
mkdir -p src/core/domain/{booking,guest,shared}
```

**Struktura:**
```
src/core/
└── domain/
    ├── tourism/    # Property, Reservation, Pricing
    ├── booking/    # Booking flow, Availability
    ├── guest/      # Guest profile, Preferences
    └── shared/     # Money, DateRange, Address (VO)
```

---

## 🟡 3. Pomembni Premiki (Q2 2026)

### **Premik 5: src/components/tourism → features/tourism/components**

**Trenutno:**
```
src/components/
├── tourism/
│   ├── TourismTimeline.tsx
│   ├── PropertyMap.tsx
│   └── ActivityCard.tsx
└── ... (še 180+ komponent)
```

**Rešitev:**
```bash
# 1. Ustvari feature slice
mkdir -p src/features/tourism/{components,hooks,api-client}

# 2. Premakni komponente
mv src/components/tourism/* src/features/tourism/components/

# 3. Ustvari hooks
touch src/features/tourism/hooks/{useTourismOffers,usePropertySearch}.ts
```

**Prednost:**
- Vsa tourism logika na **enem mestu**
- Lažje razumevanje za nove razvijalce
- Enostavnejše testiranje

---

### **Premik 6: src/web/components → shared/ui + features**

**Trenutno:**
```
src/
├── components/
└── web/
    └── components/   # Duplicate?
```

**Rešitev:**
```bash
# 1. Analiziraj kaj je v web/components/
ls src/web/components/

# 2. Razdeli:
# - Atomarne komponente → shared/ui/
# - Feature specifične → features/{domain}/components/

mv src/web/components/Button.tsx src/shared/ui/
mv src/web/components/TourismWidget.tsx src/features/tourism/components/

# 3. Izbriši prazno mapo
rm -rf src/web/
```

---

### **Premik 7: src/agents → features/agents**

**Trenutno:**
```
src/agents/
├── research-agent.ts
├── concierge-agent.ts
└── workflow-agent.ts
```

**Rešitev:**
```bash
mkdir -p src/features/agents/{components,hooks,lib}
mv src/agents/* src/features/agents/lib/
```

**Prednost:**
- Agenti so **funkcionalnost**, ne infrastruktura
- Bliže UI komponentam ki jih uporabljajo

---

### **Premik 8: API Route-e naredi "tanjše"**

**Trenutno:**
```typescript
// src/app/api/tourism/route.ts
export async function GET() {
  // ❌ 100+ vrstic business logic
  const properties = await prisma.property.findMany({...})
  // Pricing calculations
  // Availability checks
  return Response.json(properties)
}
```

**Rešitev:**
```typescript
// src/app/api/tourism/route.ts
import { GetTourismOffers } from '@/core/use-cases/GetTourismOffers'

export async function GET() {
  // ✅ Samo preusmerjanje
  const useCase = new GetTourismOffers()
  const result = await useCase.execute()
  return Response.json(result)
}
```

**Akcija:**
```bash
# 1. Za vsak API route identificiraj business logiko
# 2. Premakni logiko v core/use-cases/
# 3. Pusti samo tanke handlerje
```

---

## 🟢 4. Ohrani in Poveži

### **infrastructure/ai – Poveži s ports**

**Trenutno:**
```
src/infrastructure/ai/
├── OpenAIAdapter.ts
└── QwenProvider.ts
```

**Rešitev:**
```typescript
// 1. Definiraj port (interface)
// src/core/ports/ai-providers.ts
export interface AIProvider {
  generateText(prompt: string): Promise<string>
  generateImage(prompt: string): Promise<Buffer>
  embed(text: string): Promise<number[]>
}

// 2. Implementiraj v infrastructure
// src/infrastructure/ai/OpenAIAdapter.ts
import { AIProvider } from '@/core/ports/ai-providers'

export class OpenAIAdapter implements AIProvider {
  async generateText(prompt: string): Promise<string> {
    // Implementacija
  }
}
```

---

## 📊 5. Zakaj je ta hierarhija boljša?

### **1. Modularnost (Scalability)**

**Pred:**
```
src/lib/
├── tourism/       # Tourism logika
├── guest-exp/     # Guest logika
├── billing/       # Billing logika
└── ...            # Še 20+ map
```

**Po:**
```
src/features/
├── tourism/       # Vse za turizem
├── guests/        # Vse za goste
├── billing/       # Vse za billing
└── ...            # Jasno ločeno
```

**Prednost:**
- Dodaj novo funkcijo = ustvari novo `features/{name}/`
- Ne "onesnažiš" globalnih map

---

### **2. Testabilnost**

**Pred:**
```typescript
// Težko testirati - odvisno od Prisma, Next.js, UI
import { prisma } from '@/lib/prisma'
import { calculatePrice } from '@/lib/tourism'

test('price calculation', async () => {
  // Rabiš database mock
  // Rabiš Next.js context
})
```

**Po:**
```typescript
// Čista domain logika - brez odvisnosti
import { Property } from '@/core/domain/tourism/entities/Property'

test('price calculation', () => {
  const property = new Property(...)
  const price = property.calculatePrice(dateRange)
  expect(price.amount).toBe(100)
})
```

**Prednost:**
- Hitrejši testi (brez database)
- Lažji mock-i
- Večja coverage

---

### **3. Onboarding**

**Pred:**
```
Kje je logika za turizem?
- src/lib/tourism/?
- src/domain/tourism/?
- src/app/api/tourism/?
- src/components/tourism/?
```

**Po:**
```
Kje je logika za turizem?
- src/core/domain/tourism/ ← Poslovna logika
- src/features/tourism/    ← UI + hooks
```

**Prednost:**
- Nov razvijalec najde vse na **2 lokacijah**
- Ne rabi iskati po celem projektu

---

### **4. AI Integracija**

**Pred:**
```
src/
├── agents/         # Agenti z lastno logiko
└── lib/tourism/    # Tourism logika
```

**Po:**
```
src/
├── core/domain/    # Tourism logika (entities)
└── features/agents/# Agenti uporabljajo domeno
```

**Prednost:**
- Agenti so **porabniki** domene
- Ni podvajanja logike
- Jasna smer: Agents → Domain

---

### **5. Clean Architecture**

```
┌──────────────────────────────────────┐
│           App Layer                  │  # Next.js pages, layouts
│           (src/app/)                 │
├──────────────────────────────────────┤
│         Features Layer               │  # Business capabilities
│      (src/features/{domain}/)        │
├──────────────────────────────────────┤
│          Core Layer                  │  # Pure business logic
│   (src/core/domain/, use-cases/)     │
├──────────────────────────────────────┤
│      Infrastructure Layer            │  # DB, External APIs
│    (src/infrastructure/)             │
└──────────────────────────────────────┘
```

**Pravilo:**
- Zunanji sloji **poznajo** notranje
- Notranji sloji **ne poznajo** zunanjih
- Core je **neodvisen** od framework-ov

---

## 🚀 6. Izvedbeni Načrt

### **Faza 1: Čiščenje (1-2 dni)**

```bash
# 1. Izbriši src/pages/
rm -rf src/pages/

# 2. Združi UI komponente
mkdir -p src/shared/ui
mv src/components/ui/* src/shared/ui/
mv src/web/components/*.tsx src/shared/ui/  # Če obstaja

# 3. Počisti
rm -rf src/web/
```

**Checklist:**
- [ ] `src/pages/` izbrisan
- [ ] Vse UI komponente v `shared/ui/`
- [ ] Build deluje
- [ ] Testi passing

---

### **Faza 2: Core (3-5 dni)**

```bash
# 1. Ustvari core/
mkdir -p src/core/domain/{tourism,booking,guest,shared}
mkdir -p src/core/use-cases
mkdir -p src/core/ports

# 2. Premakni domain
mv src/domain/* src/core/domain/

# 3. Premakni business logiko iz lib/
mv src/lib/tourism/* src/core/domain/tourism/services/
mv src/lib/guest-experience/* src/core/domain/guest/services/
```

**Checklist:**
- [ ] `core/domain/` ustvarjen
- [ ] Tourism domena premaknjena
- [ ] Guest domena premaknjena
- [ ] Build deluje
- [ ] Domain testi passing

---

### **Faza 3: Features (3-4 dni)**

```bash
# 1. Ustvari feature slices
mkdir -p src/features/{tourism,agents,housekeeping,billing,auth}
mkdir -p src/features/tourism/{components,hooks,api-client}

# 2. Premakni komponente
mv src/components/tourism/* src/features/tourism/components/
mv src/agents/* src/features/agents/lib/

# 3. Ustvari hooks
touch src/features/tourism/hooks/useTourismOffers.ts
```

**Checklist:**
- [ ] Tourism feature slice ustvarjen
- [ ] Agents feature slice ustvarjen
- [ ] Komponente delujejo
- [ ] Hooki delujejo

---

### **Faza 4: Infrastructure (2-3 dni)**

```bash
# 1. Poveži infrastructure s ports
touch src/core/ports/repositories.ts
touch src/core/ports/ai-providers.ts

# 2. Implementiraj v infrastructure
touch src/infrastructure/database/repositories/PropertyRepository.ts
touch src/infrastructure/ai/OpenAIAdapter.ts
```

**Checklist:**
- [ ] Porti definirani
- [ ] Infrastructure implementira porte
- [ ] Dependency injection deluje

---

## 📈 7. Metrike Uspeha

| Metrika | Pred | Po Fazi 1 | Po Fazi 2 | Po Fazi 3 | Cilj |
|---------|------|-----------|-----------|-----------|------|
| **Domain Coverage** | 40% | 40% | 70% | 85% | 95% |
| **Code Duplication** | 15% | 12% | 8% | 5% | <3% |
| **Test Coverage** | 65% | 65% | 75% | 80% | 90% |
| **Build Time** | 120s | 110s | 100s | 95s | <80s |
| **Onboarding Time** | 14 dni | 12 dni | 7 dni | 5 dni | 3 dni |

---

## ⚠️ 8. Opozorila

### **Ne delaj:**

❌ Vsega naenkrat – Sledi fazam  
❌ Brez backup-a – Naredi git branch  
❌ Brez testov – Validiraj po vsaki fazi  

### **Delaj:**

✅ Majhne korake – Commitaj pogosto  
✅ Testiraj – Po vsakem premiku  
✅ Dokumentiraj – Piši kaj si spremenil  
✅ Komuniciraj – Team naj ve za spremembe  

---

## 🎯 9. Naslednji Koraki

1. **Review** tega dokumenta s teamom
2. **Backup** trenutne kode (`git checkout -b before-refactor`)
3. **Start** s Fazo 1 (Čiščenje)
4. **Validiraj** po vsaki fazi
5. **Continue** do Faze 4

---

**Dokument pripravljen:** 13. marec 2026  
**Avtor:** AgentFlow Pro AI Agent  
**Status:** Ready for execution

---

## 📚 Related Documents

- [ARCHITECTURE-ANALYSIS-2026.md](./ARCHITECTURE-ANALYSIS-2026.md) – Popolna analiza
- [DDD-IMPLEMENTATION-PLAN-2026.md](./DDD-IMPLEMENTATION-PLAN-2026.md) – Detajlni primeri s kodo
- [PDF-ANALYSIS-MODULAR-ARCHITECTURE-2026.md](./PDF-ANALYSIS-MODULAR-ARCHITECTURE-2026.md) – Analiza PDF dokumenta
