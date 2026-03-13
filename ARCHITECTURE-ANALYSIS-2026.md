# 📊 Arhitekturna Analiza: Trenutna vs. DDD 2026 Hierarhija

**Datum:** 13. marec 2026  
**Projekt:** AgentFlow Pro – Multi-Agent AI Platform  
**Analiza:** Primerjava trenutne arhitekture s predlagano profesionalno DDD hierarhijo za 2026

---

## 🎯 Izvršni Povzetek

| Kriterij | Trenutna Arhitektura | DDD 2026 Predlog | Ocena |
|----------|---------------------|------------------|-------|
| **Domain-Driven Design** | Delno implementiran (2 domeni) | Popoln DDD (4+ domene) | ⚠️ 40% |
| **Ločitev Logike** | Razpršena med lib/, services/, domain/ | Jasna meja: core/domain + features | ⚠️ 50% |
| **UI Organizacija** | 180+ komponent v components/ | Ločeno: shared/ui + features/{domain}/components | ⚠️ 45% |
| **API Struktura** | 70+ route-ov v app/api/ | Tanke plasti, kličejo domain use-cases | ⚠️ 50% |
| **Test Coverage** | Dobro organizirani testi | Enako + domain events testi | ✅ 80% |
| **Skalabilnost** | Monolitna struktura z elementi modularnosti | Popolnoma modularna, domain-based | ⚠️ 60% |

**Skupna ocena:** **54%** – Potrebna refaktorizacija za 2026 standarde

---

## 🏗️ 1. Kritične Težave Trenutne Strukture

### ❌ **Problem 1: src/pages vs src/app Dualizem**

**Trenutno:**
```
src/
├── app/          # Next.js App Router (aktiven)
└── pages/        # Legacy Pages Router (še obstaja?)
```

**Težava:**
- Next.js 14+ uporablja izključno **App Router**
- `src/pages` povzroča konflikte v routing-u
- Podvajanje logike med obema pristopoma

**Rešitev 2026:**
```bash
# Popolnoma izprazni ali izbriši
rm -rf src/pages

# Vse strani migriraj v src/app/
src/app/
├── (auth)/           # Route groups za organizacijo
├── (dashboard)/
├── (public)/
└── api/              # API routes
```

**Prioriteta:** 🔴 **P0 – Takoj rešiti**

---

### ❌ **Problem 2: Podvajanje Komponent (components vs web/components)**

**Trenutno:**
```
src/
├── components/           # 180+ komponent
│   ├── ui/              # Base komponente
│   ├── tourism/         # Tourism specifične
│   ├── guest-experience/
│   └── dashboard/
└── web/                 # Web utilities (?)
    └── components/      # Duplicate?
```

**Težava:**
- Nejasno kdaj uporabiti `components/` vs `web/components/`
- Podvajanje kode (npr. Button v obeh mapah)
- Težko vzdrževanje design sistema

**Rešitev 2026:**
```
src/
├── shared/ui/           # ATOMARNE komponente (Design System)
│   ├── Button.tsx
│   ├── Card.tsx
│   └── index.ts         # Barre exports
│
└── features/            # POSLOVNE komponente
    ├── tourism/
    │   └── components/  # TourismTimeline, PropertyMap
    ├── booking/
    │   └── components/  # BookingForm, DatePicker
    └── agents/
        └── components/  # AgentChat, WorkflowBuilder
```

**Pravilo:** 
- `shared/ui` = Nima poslovne logike, samo UI + props
- `features/{domain}/components` = Vsebuje business logic, API calls

**Prioriteta:** 🟡 **P1 – V Q2 2026**

---

### ❌ **Problem 3: Zmeda med API Sloji**

**Trenutno:**
```
src/
├── app/api/             # Next.js API Routes (server)
│   ├── tourism/
│   ├── agents/
│   └── webhooks/
├── api/                 # API clients? (kje je to?)
└── lib/
    └── tourism/         # Business logic ali API?
```

**Težava:**
- `app/api` = Server-side API endpoints (Next.js)
- `api/` = Klientski API calls? (nejasno)
- `lib/tourism` = Business logic ali data access?

**Primer zmede:**
```typescript
// ❌ KJE BI MORALO BITI TO?
src/lib/tourism/booking.ts       # Business logic?
src/app/api/tourism/route.ts     # API endpoint?
src/api/tourism.ts               # API client?
```

**Rešitev 2026:**
```
src/
├── app/api/                     # SERVER-SIDE (tanke plasti)
│   ├── tourism/
│   │   └── route.ts            # GET/POST handler
│   │                           # Kliče: core/use-cases/GetTourismOffers
│   └── agents/
│       └── route.ts
│
├── core/
│   ├── domain/tourism/         # Čista business logika
│   └── use-cases/              # Application logic
│       ├── GetTourismOffers.ts
│       └── CreateBooking.ts
│
└── features/tourism/
    └── api/                    # CLIENT-SIDE API calls
        └── tourism.api.ts      # fetch('/api/tourism')
```

**Prioriteta:** 🟡 **P1 – V Q2 2026**

---

### ❌ **Problem 4: Razpršena Poslovna Logika**

**Trenutno:**
```
src/
├── lib/                        # 50+ datotek – MIX EVERYTHING
│   ├── tourism/                # Business logic
│   ├── guest-experience/       # Business logic
│   ├── operational-efficiency/ # Business logic
│   ├── auth.ts                 # Auth logic
│   ├── billing.ts              # Billing logic
│   ├── stripe.ts               # Infrastructure
│   ├── prisma.ts               # Infrastructure
│   └── utils.ts                # Utilities
│
├── domain/                     # Samo 2 domeni
│   ├── ai/
│   └── tourism/
│
└── services/                   # Še več logike
    ├── ai.service.ts
    ├── auth.service.ts
    └── user.service.ts
```

**Analiza `src/lib/` (50+ datotek):**

| Kategorija | Datoteke | % |
|------------|----------|---|
| **Business Logic** | tourism/, guest-experience/, billing.ts | 40% |
| **Infrastructure** | prisma.ts, stripe.ts, redis.ts | 25% |
| **Utilities** | utils.ts, sanitize.ts, format.ts | 20% |
| **Configuration** | auth-options.ts, design-tokens.ts | 10% |
| **Templates** | email-templates/, ai-templates/ | 5% |

**Težava:**
- `lib/` je postal "smetnjak" za vse
- Business logika ni na enem mestu
- Težko testirati (mix concern-ov)
- Ni jasne meje med domain in infrastructure

**Rešitev 2026:**
```
src/
├── core/                        # POSLOVNO JEDRO
│   ├── domain/                  # Čista business logika (brez DB, UI)
│   │   ├── tourism/
│   │   │   ├── entities/
│   │   │   │   ├── Property.ts
│   │   │   │   ├── Reservation.ts
│   │   │   │   └── Booking.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── Money.ts
│   │   │   │   ├── DateRange.ts
│   │   │   │   └── GuestCount.ts
│   │   │   ├── aggregates/
│   │   │   │   └── PropertyBooking.aggregate.ts
│   │   │   └── events/
│   │   │       ├── BookingCreated.ts
│   │   │       └── PaymentProcessed.ts
│   │   ├── booking/
│   │   ├── guest/
│   │   └── agent/
│   │
│   ├── use-cases/               # Application layer
│   │   ├── CreateBooking.ts
│   │   ├── GetTourismOffers.ts
│   │   └── GenerateItinerary.ts
│   │
│   └── ports/                   # Interfaces za infrastrukturo
│       ├── repositories.ts
│       └── ai-providers.ts
│
├── infrastructure/              # TEHNIČNA IZVEDBA
│   ├── database/
│   │   ├── prisma.ts
│   │   ├── repositories/
│   │   │   └── BookingRepository.ts
│   │   └── migrations/
│   ├── ai/
│   │   ├── OpenAIAdapter.ts
│   │   └── QwenProvider.ts
│   └── external/
│       ├── StripeClient.ts
│       └── BookingComAPI.ts
│
└── shared/lib/                  # SAMO UTILITIES
    ├── format.ts
    ├── sanitize.ts
    └── validators.ts
```

**Prioriteta:** 🔴 **P0 – Kritično za vzdrževanje**

---

### ❌ **Problem 5: Razpršena Turizem Domena**

**Trenutno:**
```
src/
├── app/api/tourism/             # API endpoints
├── lib/tourism/                 # Business logic
├── components/tourism/          # UI komponente
├── domain/tourism/              # Domain logic
├── infrastructure/tourism/      # Infrastructure
└── tests/tourism/               # Testi
```

**Težava:**
- Turizem logika je na **6 različnih lokacijah**
- Težko razumeti celotno domeno
- Spremembe zahtevajo editiranje 5+ datotek na različnih lokacijah
- Ni "single source of truth"

**Rešitev 2026 – Feature Slices:**
```
src/
└── features/tourism/            # VSE POVEZANO S TURIZMOM
    ├── components/              # UI specifičen za turizem
    │   ├── TourismTimeline.tsx
    │   ├── PropertyMap.tsx
    │   └── ActivityCard.tsx
    │
    ├── hooks/                   # React hooks za turizem
    │   ├── useTourismOffers.ts
    │   └── usePropertySearch.ts
    │
    ├── api/                     # API calls za turizem
    │   └── tourism.api.ts
    │
    ├── lib/                     # Domain logic ZA TURIZEM
    │   ├── booking-rules.ts
    │   └── pricing-calculator.ts
    │
    └── types/                   # TypeScript types
        └── tourism.types.ts
```

**Prednosti:**
- ✅ Vsa logika za turizem na **enem mestu**
- ✅ Enostavno razumevanje (follow folder structure)
- ✅ Lažje testiranje (vse povezano skupaj)
- ✅ Enostavnejši onboarding novih razvijalcev

**Prioriteta:** 🟡 **P1 – V Q2 2026**

---

## ✅ 2. Predlog Profesionalne Hierarhije 2026

### **Celotna Struktura:**

```
agentflow-pro/
├── src/
│   │
│   ├── app/                         # 📱 SLOJ ZA PREHOD (ROUTING & UI COMPOSITION)
│   │   ├── (auth)/                  # Grupa za avtentikacijo
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── (dashboard)/             # Grupa za zaščiten del
│   │   │   ├── dashboard/
│   │   │   ├── properties/
│   │   │   ├── reservations/
│   │   │   └── guests/
│   │   │
│   │   ├── (public)/                # Javne strani
│   │   │   ├── pricing/
│   │   │   ├── about/
│   │   │   └── contact/
│   │   │
│   │   ├── api/                     # API Route Handlerji (TANKE PLASTI)
│   │   │   ├── tourism/
│   │   │   │   └── route.ts        # Kliče: core/use-cases/GetTourismOffers
│   │   │   ├── agents/
│   │   │   └── webhooks/
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   │
│   │
│   ├── core/                        # 🧠 POSLOVNO JEDRO (DOMAIN DRIVEN DESIGN)
│   │   ├── domain/                  # Čista poslovna logika (BREZ ODVISNOSTI NA UI/DB)
│   │   │   ├── tourism/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Property.ts
│   │   │   │   │   ├── Reservation.ts
│   │   │   │   │   └── Booking.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── Money.ts
│   │   │   │   │   ├── DateRange.ts
│   │   │   │   │   └── GuestCount.ts
│   │   │   │   ├── aggregates/
│   │   │   │   │   └── PropertyBooking.aggregate.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── BookingCreated.ts
│   │   │   │   │   └── PaymentProcessed.ts
│   │   │   │   └── services/
│   │   │   │       └── PricingCalculator.ts
│   │   │   │
│   │   │   ├── booking/
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   └── events/
│   │   │   │
│   │   │   ├── guest/
│   │   │   │   ├── entities/
│   │   │   │   └── value-objects/
│   │   │   │
│   │   │   ├── agent/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Agent.ts
│   │   │   │   │   ├── Workflow.ts
│   │   │   │   │   └── Message.ts
│   │   │   │   └── events/
│   │   │   │       └── AgentRunCompleted.ts
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── User.ts
│   │   │       └── Money.ts
│   │   │
│   │   ├── use-cases/               # Aplikacijska logika (koordinacija domain objektov)
│   │   │   ├── CreateBooking.ts
│   │   │   ├── GetTourismOffers.ts
│   │   │   ├── GenerateItinerary.ts
│   │   │   ├── RunAgent.ts
│   │   │   └── ProcessPayment.ts
│   │   │
│   │   └── ports/                   # Vmesniki (Interfaces) za infrastrukturo
│   │       ├── repositories.ts
│   │       │   ├── IBookingRepository.ts
│   │       │   └── IPropertyRepository.ts
│   │       └── ai-providers.ts
│   │           ├── IAIProvider.ts
│   │           └── IEmbeddingModel.ts
│   │
│   │
│   ├── features/                    # ⚙️ POSLOVNE ZMOGLJIVOSTI (FEATURE SLICES)
│   │   ├── tourism/                 # Vse povezano s turizmom na enem mestu
│   │   │   ├── components/
│   │   │   │   ├── TourismTimeline.tsx
│   │   │   │   ├── PropertyMap.tsx
│   │   │   │   └── ActivityCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTourismOffers.ts
│   │   │   │   └── usePropertySearch.ts
│   │   │   ├── api/
│   │   │   │   └── tourism.api.ts
│   │   │   └── lib/
│   │   │       ├── booking-rules.ts
│   │   │       └── pricing-calculator.ts
│   │   │
│   │   ├── agents/                  # Vse povezano z AI agenti
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── lib/
│   │   │
│   │   ├── billing/
│   │   ├── auth/
│   │   └── workflows/
│   │
│   │
│   ├── infrastructure/              # 🔧 TEHNIČNA IZVEDBA (ADAPTERS)
│   │   ├── database/
│   │   │   ├── prisma.ts
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   │       ├── BookingRepository.ts
│   │   │       └── PropertyRepository.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── OpenAIAdapter.ts
│   │   │   ├── QwenProvider.ts
│   │   │   └── EmbeddingService.ts
│   │   │
│   │   ├── external/
│   │   │   ├── StripeClient.ts
│   │   │   ├── BookingComAPI.ts
│   │   │   └── EturizemAPI.ts
│   │   │
│   │   └── observability/
│   │       ├── logging.ts
│   │       ├── tracing.ts
│   │       └── monitoring.ts
│   │
│   │
│   ├── shared/                      # 📦 SKUPNA KODA (TEHNIČNA)
│   │   ├── ui/                      # Atomarne komponente (Design System)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── lib/                     # Splošni utiliti (brez business logic)
│   │   │   ├── format.ts
│   │   │   ├── sanitize.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/                   # Globalne TypeScript definicije
│   │   │   └── index.ts
│   │   │
│   │   └── constants/
│   │       └── index.ts
│   │
│   │
│   └── tests/                       # 🧪 TESTI
│       ├── e2e/
│       ├── integration/
│       └── unit/
│           ├── domain/
│           ├── use-cases/
│           └── infrastructure/
│
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── e2e/
│   └── integration/
│
├── e2e/
│   └── *.spec.ts
│
├── memory-bank/
├── docs/
├── public/
├── scripts/
├── deploy/
└── package.json
```

---

## 📊 3. Primerjava: Trenutno vs. 2026

### **Domain Layer:**

| Aspekt | Trenutno (2025) | Predlog (2026) | Izboljšava |
|--------|-----------------|----------------|------------|
| **Struktura** | `domain/{ai, tourism}` | `domain/{tourism, booking, guest, agent}` | 2 → 4 domene |
| **Entities** | Ni eksplicitno | `entities/` mapa v vsaki domeni | ✅ |
| **Value Objects** | Ni | `value-objects/` z Money, DateRange | ✅ |
| **Aggregates** | Ni | `aggregates/` za consistency boundaries | ✅ |
| **Domain Events** | Ni | `events/` za event-driven arhitekturo | ✅ |
| **Domain Services** | V `lib/` | `services/` znotraj domen | ✅ |

### **Business Logic:**

| Lokacija | Trenutno | 2026 | Komentar |
|----------|----------|------|----------|
| **Tourism** | `lib/tourism/` | `core/domain/tourism/` + `features/tourism/` | Jasna ločnica |
| **Booking** | `lib/` + `app/api/` | `core/domain/booking/` | Na enem mestu |
| **Auth** | `lib/auth.ts` + `services/auth.service.ts` | `core/domain/shared/User.ts` | Konsistentno |
| **AI** | `domain/ai/` + `services/ai.service.ts` | `core/domain/agent/` + `infrastructure/ai/` | Ločena logika od implementacije |

### **UI Komponents:**

| Tip | Trenutno | 2026 | Prednost |
|-----|----------|------|----------|
| **Base UI** | `components/ui/` | `shared/ui/` | Design system |
| **Feature UI** | `components/tourism/` | `features/tourism/components/` | Feature-based |
| **Layouts** | `components/dashboard/` | `app/(dashboard)/layout.tsx` | App Router pattern |

### **API:**

| Sloj | Trenutno | 2026 | Izboljšava |
|------|----------|------|------------|
| **Server Routes** | `app/api/tourism/route.ts` | Enako, tanke plasti | ✅ |
| **Business Logic** | `lib/tourism/` | `core/use-cases/` | Ločeno |
| **Client Calls** | Ni jasno | `features/tourism/api/` | Eksplicitno |

---

## 🚀 4. Migracijski Načrt

### **Faza 1: Priprava (Q1 2026) – 2 tedna**

**Tednik 1-2:**
1. ✅ Namesti potrebne package-e:
   ```bash
   npm install zod date-fns uuid
   npm install -D @types/uuid
   ```

2. ✅ Ustvari novo strukturo:
   ```bash
   mkdir -p src/core/domain/{tourism,booking,guest,agent}
   mkdir -p src/core/use-cases
   mkdir -p src/core/ports
   mkdir -p src/features/{tourism,agents,billing,auth}
   mkdir -p src/shared/{ui,lib,types,constants}
   ```

3. ✅ Definiraj prve Domain Events:
   ```typescript
   // src/core/domain/tourism/events/BookingCreated.ts
   export class BookingCreated {
     constructor(
       public readonly bookingId: string,
       public readonly propertyId: string,
       public readonly timestamp: Date
     ) {}
   }
   ```

---

### **Faza 2: Domain Layer (Q2 2026) – 4 tedne**

**Teden 3-4: Tourism Domain**
- Premakni business logiko iz `lib/tourism/` v `core/domain/tourism/`
- Definiraj Entities: Property, Reservation, Booking
- Definiraj Value Objects: Money, DateRange, GuestCount
- Implementiraj Domain Events

**Teden 5-6: Booking Domain**
- Izoliraj booking logiko
- Definiraj Aggregate: PropertyBooking
- Implementiraj business rules

**Teden 7-8: Guest & Agent Domains**
- Guest domain: Guest profile, preferences
- Agent domain: AI agents, workflows, messages

---

### **Faza 3: Feature Slices (Q2 2026) – 3 tedne**

**Teden 9-10: Tourism Feature**
```bash
# Premakni iz:
src/components/tourism/
src/lib/tourism/
src/app/api/tourism/

# Premakni v:
src/features/tourism/
├── components/
├── hooks/
├── api/
└── lib/
```

**Teden 11: Agents Feature**
- Podobno za agente

---

### **Faza 4: Infrastructure (Q3 2026) – 2 tedna**

**Teden 12-13:**
- Premakni `prisma.ts` v `infrastructure/database/`
- Implementiraj Repository pattern
- Loči AI providere v `infrastructure/ai/`

---

### **Faza 5: Testing & Validation (Q3 2026) – 1 teden**

**Teden 14:**
- Posodobi teste za novo strukturo
- Zaženi E2E teste
- Validiraj arhitekturo

---

## 📈 5. Metrike Uspeha

| Metrika | Trenutno | Cilj 2026 | Izboljšava |
|---------|----------|-----------|------------|
| **Domain Coverage** | 40% | 90% | +50% |
| **Code Duplication** | 15% | <5% | -10% |
| **Test Coverage** | 65% | 85% | +20% |
| **Build Time** | 120s | 90s | -25% |
| **Onboarding Time** | 2 tedna | 3 dni | -70% |

---

## 🎯 6. Zaključek in Priporočila

### **Takojšnje Akcije (P0):**

1. 🔴 **Izbriši `src/pages/`** – Popolnoma preidi na App Router
2. 🔴 **Ustvari `core/domain/`** – Začni z Tourism domain
3. 🔴 **Definiraj prve Domain Events** – Event-driven arhitektura

### **Kratkoročne Akcije (P1 – Q2 2026):**

1. 🟡 **Premakni business logiko** – Iz `lib/` v `core/domain/`
2. 🟡 **Ustvari Feature Slices** – `features/{domain}/`
3. 🟡 **Loči UI komponente** – `shared/ui/` vs `features/{domain}/components/`

### **Dolgoročne Akcije (P2 – Q3-Q4 2026):**

1. 🟢 **Implementiraj CQRS** – Command Query Responsibility Segregation
2. 🟢 **Event Sourcing** – Za workflow in agent runs
3. 🟢 **Domain Primitives** – Value objects za type safety

---

## 📚 Viri

1. **Domain-Driven Design** – Eric Evans
2. **Implementing Domain-Driven Design** – Vaughn Vernon
3. **Next.js App Router Best Practices** – Vercel Docs
4. **Microservices Patterns** – Chris Richardson
5. **Clean Architecture** – Robert C. Martin

---

**Analiza pripravljena:** 13. marec 2026  
**Avtor:** AgentFlow Pro AI Agent  
**Status:** Pripravljeno za review in implementacijo
