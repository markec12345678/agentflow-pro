# 🎯 DDD Arhitektura 2026: Konkretna Implementacija

**Datum:** 13. marec 2026  
**Projekt:** AgentFlow Pro  
**Tip:** Multi-Agent AI Platform za Business Avtomatizacijo  
**Cilj:** Refaktorizacija v Domain-Driven Design arhitekturo

---

## 📊 1. Trenutno Stanje vs. Ciljna Arhitektura

### **Trenutna Struktura (Marec 2026):**

```
src/
├── app/                    ✅ OHRANI (App Router)
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/                ⚠️ 70+ route-ov (preveč logike)
│   └── ...
│
├── components/             ❌ RAZPRŠENO (180+ komponent)
│   ├── ui/
│   ├── tourism/
│   ├── dashboard/
│   └── ...
│
├── lib/                    ❌ 50+ datotek (MIX EVERYTHING)
│   ├── tourism/            → Business logic
│   ├── guest-experience/   → Business logic
│   ├── stripe.ts           → Infrastructure
│   ├── prisma.ts           → Infrastructure
│   └── utils.ts            → Utilities
│
├── domain/                 ⚠️ PREMAJHEN (samo 2 domeni)
│   ├── ai/
│   └── tourism/
│
├── services/               ❌ RAZPRŠENA LOGIKA
│   ├── ai.service.ts
│   ├── auth.service.ts
│   └── user.service.ts
│
├── infrastructure/         ✅ DOBRO ORGANIZIRANO
│   ├── ai/
│   ├── security/
│   └── observability/
│
└── features/               ⚠️ DELNO IMPLEMENTIRANO
    ├── tourism/
    ├── agents/
    └── ...
```

---

### **Ciljna Struktura 2026:**

```
src/
├── 📂 app/                         # [PREHOD] Next.js App Router & API Routes
│   ├── (auth)/                     # Login, Register, Reset
│   ├── (dashboard)/                # Zaščiteni deli (Tourism, Guests, Settings)
│   ├── (public)/                   # Landing, Pricing, Solutions
│   ├── api/                        # API Route Handlerji (TANKA PLAST)
│   │   ├── tourism/                # Le preusmerjanje na core/use-cases
│   │   ├── agents/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── providers.tsx
│
├── 📂 core/                        # [POSLOVNO JEDRO] - Ni odvisno od UI/Frameworkov
│   ├── domain/                     # Čista poslovna logika (Entities, Rules)
│   │   ├── tourism/                # Property, Reservation, Guest, Pricing
│   │   ├── booking/                # Booking Flow, Availability
│   │   ├── guest/                  # Guest Profile, Preferences
│   │   └── shared/                 # Money, DateRange, Address (Value Objects)
│   ├── ports/                      # Vmesniki (Interfaces) za bazo/zunanje servise
│   │   ├── repositories.ts
│   │   └── ai-providers.ts
│   └── use-cases/                  # Aplikacijska logika (Koordinacija)
│       ├── CreateReservation.ts
│       ├── CalculateDynamicPrice.ts
│       └── SendGuestMessage.ts
│
├── 📂 features/                    # [ZMOGLJIVOSTI] - Povezuje UI in Logiko
│   ├── tourism/                    # Vse za turizem na enem mestu
│   │   ├── components/             # UI specifičen za turizem
│   │   ├── hooks/                  # useTourism, usePricing
│   │   └── api-client/             # Klici za to domeno
│   ├── agents/                     # AI Agenti (Concierge, Research)
│   ├── housekeeping/               # Hišni red
│   ├── billing/                    # Plačila in računi
│   └── auth/                       # Prijava in registracija
│
├── 📂 infrastructure/              # [TEHNIČNA IZVEDBA] - Implementacija portov
│   ├── database/                   # Prisma Schema, Repositories Implementations
│   ├── ai/                         # OpenAI, Qwen, Gemini Adapterji
│   ├── external/                   # Stripe, Booking.com, Eturizem, HubSpot
│   ├── security/                   # Audit, GDPR, Encryption
│   └── observability/              # Logging, Tracing, Metrics
│
├── 📂 shared/                      # [SKUPNA KODA] - Tehnični utility-ji
│   ├── ui/                         # Atomarne komponente (Button, Input, Card)
│   ├── lib/                        # Splošni helperji (formatDate, cn, validate)
│   ├── types/                      # Globalne TypeScript definicije
│   └── constants/                  # Sistemske konstante
│
└── 📂 tests/                       # [TESTI]
    ├── e2e/                        # Playwright
    ├── integration/                # API testi
    └── unit/                       # Domain testi
```

---

## 🔄 2. Mapping: Trenutno → 2026

### **app/ (App Router)**

| Trenutno | 2026 | Akcija |
|----------|------|--------|
| `app/(auth)/` | `app/(auth)/` | ✅ OHRANI |
| `app/(dashboard)/` | `app/(dashboard)/` | ✅ OHRANI |
| `app/api/tourism/route.ts` | `app/api/tourism/route.ts` | ⚠️ **TANJŠA PLAST** |
| `app/api/agents/route.ts` | `app/api/agents/route.ts` | ⚠️ **TANJŠA PLAST** |

**Primer tanke plasti (API Route):**

```typescript
// ❌ TRENUTNO (preveč logike)
src/app/api/tourism/route.ts
export async function GET(request: Request) {
  // 100+ vrstic business logic
  const properties = await prisma.property.findMany({...})
  // Pricing calculations
  // Availability checks
  // Guest communications
  return Response.json(properties)
}

// ✅ 2026 (tanka plast - samo preusmerjanje)
src/app/api/tourism/route.ts
import { GetTourismOffers } from '@/core/use-cases/GetTourismOffers'

export async function GET(request: Request) {
  const useCase = new GetTourismOffers()
  const result = await useCase.execute({ /* params */ })
  return Response.json(result)
}
```

---

### **core/ (Novo - Poslovno Jedro)**

#### **core/domain/ - Čista poslovna logika**

```typescript
// src/core/domain/tourism/entities/Property.ts
export class Property {
  constructor(
    public readonly id: string,
    public name: string,
    public location: Address,
    public rooms: Room[],
    public pricing: PricingStrategy
  ) {}

  isAvailable(dateRange: DateRange): boolean {
    return this.rooms.some(room => room.isAvailable(dateRange))
  }

  calculateTotalPrice(dateRange: DateRange, guests: number): Money {
    return this.pricing.calculate(dateRange, guests)
  }
}

// src/core/domain/tourism/value-objects/Money.ts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'EUR'
  ) {
    if (amount < 0) throw new Error('Amount cannot be negative')
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch')
    }
    return new Money(this.amount + other.amount, this.currency)
  }
}

// src/core/domain/tourism/value-objects/DateRange.ts
export class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {
    if (start >= end) {
      throw new Error('Start date must be before end date')
    }
  }

  overlaps(other: DateRange): boolean {
    return this.start < other.end && this.end > other.start
  }

  durationInDays(): number {
    const ms = this.end.getTime() - this.start.getTime()
    return Math.ceil(ms / (1000 * 60 * 60 * 24))
  }
}

// src/core/domain/tourism/events/BookingCreated.ts
export class BookingCreated {
  constructor(
    public readonly bookingId: string,
    public readonly propertyId: string,
    public readonly guestId: string,
    public readonly dateRange: DateRange,
    public readonly totalPrice: Money,
    public readonly timestamp: Date = new Date()
  ) {}
}
```

#### **core/use-cases/ - Aplikacijska logika**

```typescript
// src/core/use-cases/CreateReservation.ts
import { PropertyRepository } from '@/core/ports/repositories'
import { Property } from '@/core/domain/tourism/entities/Property'
import { DateRange } from '@/core/domain/tourism/value-objects/DateRange'
import { Money } from '@/core/domain/tourism/value-objects/Money'
import { BookingCreated } from '@/core/domain/tourism/events/BookingCreated'

interface Input {
  propertyId: string
  guestId: string
  startDate: Date
  endDate: Date
  guestCount: number
}

interface Output {
  reservationId: string
  totalPrice: Money
  confirmationCode: string
}

export class CreateReservation {
  constructor(
    private propertyRepo: PropertyRepository,
    private eventBus: EventBus
  ) {}

  async execute(input: Input): Promise<Output> {
    // 1. Naloži property
    const property = await this.propertyRepo.findById(input.propertyId)
    if (!property) {
      throw new Error('Property not found')
    }

    // 2. Preveri razpoložljivost
    const dateRange = new DateRange(input.startDate, input.endDate)
    if (!property.isAvailable(dateRange)) {
      throw new Error('Property not available for selected dates')
    }

    // 3. Izračunaj ceno
    const totalPrice = property.calculateTotalPrice(dateRange, input.guestCount)

    // 4. Ustvari rezervacijo
    const reservation = property.createReservation({
      guestId: input.guestId,
      dateRange,
      guestCount: input.guestCount,
      totalPrice
    })

    // 5. Shrani
    await this.propertyRepo.save(property)

    // 6. Objavi dogodek
    await this.eventBus.publish(new BookingCreated(
      reservation.id,
      property.id,
      input.guestId,
      dateRange,
      totalPrice
    ))

    return {
      reservationId: reservation.id,
      totalPrice,
      confirmationCode: reservation.confirmationCode
    }
  }
}
```

#### **core/ports/ - Vmesniki**

```typescript
// src/core/ports/repositories.ts
import { Property } from '@/core/domain/tourism/entities/Property'
import { Reservation } from '@/core/domain/booking/entities/Reservation'

export interface PropertyRepository {
  findById(id: string): Promise<Property | null>
  findAll(filters: PropertyFilters): Promise<Property[]>
  save(property: Property): Promise<void>
  delete(id: string): Promise<void>
}

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>
  findByGuest(guestId: string): Promise<Reservation[]>
  save(reservation: Reservation): Promise<void>
}

// src/core/ports/ai-providers.ts
export interface AIProvider {
  generateText(prompt: string): Promise<string>
  generateImage(prompt: string): Promise<Buffer>
  embed(text: string): Promise<number[]>
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(type: string, handler: (event: T) => void): void
}
```

---

### **features/ (Konsolidacija)**

#### **Trenutno → 2026 Mapping:**

```
# Premakni iz:
src/components/tourism/
src/lib/tourism/
src/app/api/tourism/

# V:
src/features/tourism/
├── components/
│   ├── TourismTimeline.tsx
│   ├── PropertyMap.tsx
│   └── ActivityCard.tsx
├── hooks/
│   ├── useTourismOffers.ts
│   └── usePropertySearch.ts
├── api-client/
│   └── tourism.api.ts
└── lib/
    ├── booking-rules.ts
    └── pricing-calculator.ts
```

#### **Primer Feature Slice:**

```typescript
// src/features/tourism/api-client/tourism.api.ts
export async function getTourismOffers(filters: TourismFilters) {
  const response = await fetch('/api/tourism?' + new URLSearchParams(filters))
  if (!response.ok) throw new Error('Failed to fetch tourism offers')
  return response.json()
}

// src/features/tourism/hooks/useTourismOffers.ts
export function useTourismOffers(filters: TourismFilters) {
  const [offers, setOffers] = useState<TourismOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTourismOffers(filters)
      .then(setOffers)
      .finally(() => setLoading(false))
  }, [filters])

  return { offers, loading }
}

// src/features/tourism/components/TourismTimeline.tsx
import { useTourismOffers } from '../hooks/useTourismOffers'

export function TourismTimeline({ propertyId }: { propertyId: string }) {
  const { offers, loading } = useTourismOffers({ propertyId })

  if (loading) return <Skeleton />
  if (!offers.length) return <EmptyState />

  return (
    <div className="timeline">
      {offers.map(offer => (
        <ActivityCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
```

---

### **shared/ (Preimenovanje iz components/ui)**

```
# Premakni iz:
src/components/ui/

# V:
src/shared/ui/
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── Select.tsx
├── Badge.tsx
└── index.ts

# Premakni iz:
src/lib/utils.ts, src/lib/format.ts, src/lib/sanitize.ts

# V:
src/shared/lib/
├── format.ts
├── sanitize.ts
├── validators.ts
└── cn.ts
```

---

### **infrastructure/ (Razširitev)**

```
# Obdrži in razširi:
src/infrastructure/
├── database/
│   ├── prisma.ts              # Iz lib/prisma.ts
│   ├── schema.prisma          # Iz prisma/
│   └── repositories/          # NOVO - Implementacije portov
│       ├── PropertyRepository.ts
│       └── ReservationRepository.ts
├── ai/
│   ├── OpenAIAdapter.ts       # Iz lib/qwen-ai.ts, lib/gemini-ai.ts
│   ├── QwenProvider.ts
│   └── EmbeddingService.ts
├── external/
│   ├── StripeClient.ts        # Iz lib/stripe.ts
│   ├── BookingComAPI.ts
│   └── EturizemAPI.ts
├── security/
│   ├── audit-trail.ts         # Iz infrastructure/security/
│   ├── gdpr-compliance.ts     # Iz lib/gdpr-compliance.ts
│   └── encryption.ts
└── observability/
    ├── logging.ts
    ├── tracing.ts
    └── monitoring.ts
```

#### **Primer Repository Implementacije:**

```typescript
// src/infrastructure/database/repositories/PropertyRepository.ts
import { Property } from '@/core/domain/tourism/entities/Property'
import { PropertyRepository as IPropertyRepository } from '@/core/ports/repositories'
import { prisma } from '../prisma'

export class PropertyRepository implements IPropertyRepository {
  async findById(id: string): Promise<Property | null> {
    const data = await prisma.property.findUnique({
      where: { id },
      include: {
        rooms: true,
        amenities: true,
        pricing: true
      }
    })

    if (!data) return null

    return new Property(
      data.id,
      data.name,
      new Address(data.address, data.city, data.country),
      data.rooms.map(room => new Room(...)),
      new PricingStrategy(data.pricing)
    )
  }

  async findAll(filters: PropertyFilters): Promise<Property[]> {
    const data = await prisma.property.findMany({
      where: filters.toPrisma(),
      include: { rooms: true, pricing: true }
    })

    return data.map(d => this.mapToDomain(d))
  }

  async save(property: Property): Promise<void> {
    await prisma.property.upsert({
      where: { id: property.id },
      update: property.toPrisma(),
      create: property.toPrisma()
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.property.delete({ where: { id } })
  }

  private mapToDomain(data: any): Property {
    return new Property(...)
  }
}
```

---

## 📋 3. Konkretni Koraki za Migracijo

### **Faza 0: Priprava (1 dan)**

```bash
# 1. Ustvari nove mape
mkdir -p src/core/domain/{tourism,booking,guest,shared}
mkdir -p src/core/use-cases
mkdir -p src/core/ports
mkdir -p src/features/{tourism,agents,housekeeping,billing,auth}
mkdir -p src/shared/{ui,lib,types,constants}

# 2. Namesti dodatne package-e (če jih rabiš)
npm install zod date-fns uuid
npm install -D @types/uuid
```

---

### **Faza 1: core/domain/ (3-5 dni)**

**Dan 1-2: Tourism Domain**

```bash
# Premakni business logiko iz lib/tourism/ v core/domain/tourism/
# 1. Ustvari Value Objects
touch src/core/domain/tourism/value-objects/{Money,DateRange,GuestCount}.ts

# 2. Ustvari Entities
touch src/core/domain/tourism/entities/{Property,Reservation,Room}.ts

# 3. Ustvari Domain Events
touch src/core/domain/tourism/events/{BookingCreated,PaymentProcessed}.ts
```

**Dan 3-4: Booking Domain**

```bash
# Podobno za booking
touch src/core/domain/booking/entities/{Booking,Availability}.ts
touch src/core/domain/booking/value-objects/{BookingStatus,PaymentStatus}.ts
```

**Dan 5: Guest & Shared Domains**

```bash
# Guest domain
touch src/core/domain/guest/entities/{Guest,GuestPreferences}.ts

# Shared Value Objects
touch src/core/domain/shared/{Address,Money,Email}.ts
```

---

### **Faza 2: core/use-cases/ (2-3 dni)**

```bash
# Identificiraj glavne use-case-e iz trenutne kode:
# Iz: lib/tourism/booking-rules.ts, lib/billing.ts, services/*.ts

# Ustardi:
touch src/core/use-cases/{
  CreateReservation,
  CalculateDynamicPrice,
  SendGuestMessage,
  GenerateItinerary,
  ProcessPayment
}.ts
```

**Primer:**

```typescript
// src/core/use-cases/CreateReservation.ts
import { UseCase } from './UseCase'
import { PropertyRepository } from '@/core/ports/repositories'
import { CreateReservationInput, CreateReservationOutput } from './dtos'

export class CreateReservation implements UseCase {
  constructor(private propertyRepo: PropertyRepository) {}

  async execute(input: CreateReservationInput): Promise<CreateReservationOutput> {
    // Implementacija
  }
}
```

---

### **Faza 3: core/ports/ (1 dan)**

```bash
# Definiraj interface-e
touch src/core/ports/{repositories,ai-providers,event-bus}.ts
```

---

### **Faza 4: infrastructure/ (2-3 dni)**

```bash
# 1. Premakni prisma.ts iz lib/ v infrastructure/database/
mv src/lib/prisma.ts src/infrastructure/database/prisma.ts

# 2. Ustvari repository implementacije
touch src/infrastructure/database/repositories/{Property,Reservation,Guest}Repository.ts

# 3. Premakni AI adapterje
mv src/lib/{qwen-ai,gemini-ai}.ts src/infrastructure/ai/

# 4. Premakni Stripe
mv src/lib/stripe.ts src/infrastructure/external/StripeClient.ts
```

---

### **Faza 5: features/ (3-4 dni)**

```bash
# 1. Tourism feature
mkdir -p src/features/tourism/{components,hooks,api-client,lib}

# Premakni komponente
mv src/components/tourism/* src/features/tourism/components/

# Premakni hooks (ustvari nove)
touch src/features/tourism/hooks/{useTourismOffers,usePropertySearch}.ts

# Premakni API client
touch src/features/tourism/api-client/tourism.api.ts

# 2. Agents feature
mkdir -p src/features/agents/{components,hooks,api-client}
mv src/components/agents/* src/features/agents/components/

# 3. Ostale feature
mkdir -p src/features/{housekeeping,billing,auth}/{components,hooks,api-client}
```

---

### **Faza 6: shared/ (1-2 dni)**

```bash
# 1. UI komponente
mv src/components/ui/* src/shared/ui/
mv src/components/{Button,Card,Input}.tsx src/shared/ui/

# 2. Utility-ji
mv src/lib/{utils,format,sanitize,validators}.ts src/shared/lib/

# 3. Types
mv src/types/* src/shared/types/
mv src/lib/design-tokens.ts src/shared/constants/
```

---

### **Faza 7: Posodobi API Route-e (2-3 dni)**

```bash
# Za vsak API route:
# 1. Odstrani business logiko
# 2. Ustvari use-case
# 3. Pokliči use-case iz route

# Primer:
# src/app/api/tourism/route.ts (pred)
# - 100+ vrstic logike

# src/app/api/tourism/route.ts (po)
import { GetTourismOffers } from '@/core/use-cases/GetTourismOffers'

export async function GET(request: Request) {
  const useCase = new GetTourismOffers()
  const result = await useCase.execute({ /* params */ })
  return Response.json(result)
}
```

---

### **Faza 8: Posodobi Test-e (2-3 dni)**

```bash
# 1. Domain testi
mkdir -p src/tests/unit/domain/{tourism,booking,guest}

# 2. Use-case testi
mkdir -p src/tests/unit/use-cases

# 3. Infrastructure testi
mkdir -p src/tests/unit/infrastructure

# 4. Posodobi obstoječe teste
# - Spremeni import paths
# - Posodobi mock-e
```

---

## 📊 4. Timeline Pregled

| Faza | Opis | Trajanje | Prioriteta |
|------|------|----------|------------|
| **0** | Priprava (ustvari mape) | 1 dan | 🔴 P0 |
| **1** | core/domain/ (Entities, VO, Events) | 3-5 dni | 🔴 P0 |
| **2** | core/use-cases/ (Application logic) | 2-3 dni | 🔴 P0 |
| **3** | core/ports/ (Interfaces) | 1 dan | 🟡 P1 |
| **4** | infrastructure/ (Implementacije) | 2-3 dni | 🟡 P1 |
| **5** | features/ (Feature slices) | 3-4 dni | 🟡 P1 |
| **6** | shared/ (UI + utils) | 1-2 dni | 🟢 P2 |
| **7** | Posodobi API route-e | 2-3 dni | 🟡 P1 |
| **8** | Posodobi teste | 2-3 dni | 🟢 P2 |

**Skupaj:** 17-25 delovnih dni (3.5-5 tednov)

---

## ✅ 5. Checklista za Uspeh

### **Pred začetkom:**

- [ ] Backup trenutne kode (git branch: `before-ddd-refactor`)
- [ ] Vsi testi passing (`npm test`)
- [ ] E2E testi passing (`npm run test:e2e`)
- [ ] Build deluje (`npm run build`)

### **Po vsaki fazi:**

- [ ] Build še vedno deluje
- [ ] Testi passing
- [ ] Ključne funkcionalnosti delujejo (manual test)

### **Po zaključku:**

- [ ] Vsi testi passing
- [ ] E2E scenariji delujejo
- [ ] Performance ni slabši (preveri Lighthouse)
- [ ] Team usposobljen za DDD pattern-e

---

## 🎯 6. Primeri Kode: Pred/Po

### **Primer 1: Pricing Logic**

**❌ TRENUTNO (lib/tourism/pricing.ts):**

```typescript
// Mix business logic in infrastructure
export async function calculatePrice(propertyId: string, dates: Date[]) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  
  let basePrice = property.basePrice
  const season = getSeason(dates)
  
  if (season === 'high') {
    basePrice *= 1.3
  } else if (season === 'low') {
    basePrice *= 0.8
  }
  
  // ... 50+ vrstic logike
  
  return basePrice
}
```

**✅ 2026 (core/domain/tourism/entities/Property.ts):**

```typescript
export class Property {
  constructor(
    public readonly id: string,
    public readonly pricing: PricingStrategy
  ) {}

  calculatePrice(dateRange: DateRange, guests: number): Money {
    const basePrice = this.pricing.getBasePrice(dateRange)
    const seasonalAdjustment = this.pricing.getSeasonalAdjustment(dateRange)
    const guestAdjustment = this.pricing.getGuestAdjustment(guests)

    return basePrice
      .multiply(seasonalAdjustment)
      .add(guestAdjustment)
  }
}
```

---

### **Primer 2: Booking Creation**

**❌ TRENUTNO (app/api/bookings/route.ts):**

```typescript
export async function POST(request: Request) {
  const body = await request.json()
  
  // 150 vrstic business logic v API route-u 😱
  const property = await prisma.property.findUnique({ ... })
  if (!property) return Response.error()
  
  // Check availability
  const bookings = await prisma.reservation.findMany({ ... })
  const isAvailable = checkAvailability(bookings, body.dates)
  if (!isAvailable) return Response.error()
  
  // Calculate price
  const price = calculatePrice(property.id, body.dates)
  
  // Create reservation
  const reservation = await prisma.reservation.create({ ... })
  
  // Send email
  await sendEmail(body.guestEmail, 'Confirmation', ...)
  
  return Response.json(reservation)
}
```

**✅ 2026 (app/api/bookings/route.ts):**

```typescript
import { CreateReservation } from '@/core/use-cases/CreateReservation'

export async function POST(request: Request) {
  const body = await request.json()
  
  const useCase = new CreateReservation()
  const result = await useCase.execute({
    propertyId: body.propertyId,
    guestId: body.guestId,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    guestCount: body.guestCount
  })
  
  return Response.json(result)
}
```

---

## 📚 7. Najpogostejše Napake pri DDD Implementaciji

### **❌ Napaka 1: Anemic Domain Model**

```typescript
// ❌ SLABO - Samo podatki, brez logike
export class Property {
  id: string
  name: string
  basePrice: number
  // ... samo properties
}

// ✅ DOBRO - Bogat domain model z logiko
export class Property {
  constructor(
    public readonly id: string,
    public readonly pricing: PricingStrategy
  ) {}

  isAvailable(dateRange: DateRange): boolean {
    // Business logic znotraj entity
  }

  calculatePrice(dateRange: DateRange): Money {
    // Business logic znotraj entity
  }
}
```

### **❌ Napaka 2: Infrastructure v Domain**

```typescript
// ❌ SLABO - Domain ve za Prismo
export class Property {
  async save() {
    await prisma.property.update({ ... }) // 😱
  }
}

// ✅ DOBRO - Domain uporablja ports
export class Property {
  // Ni odvisnosti na infrastructure
}

// Use case uporablja port
export class CreateReservation {
  constructor(private repo: PropertyRepository) {} // Interface, ne implementacija
  
  async execute() {
    await this.repo.save(property) // Abstrakcija
  }
}
```

### **❌ Napaka 3: Preveliki Use-Cases**

```typescript
// ❌ SLABO - God class
export class TourismUseCase {
  async getOffers() { ... }
  async createBooking() { ... }
  async cancelBooking() { ... }
  async sendEmail() { ... }
  async calculatePrice() { ... }
}

// ✅ DOBRO - En use-case = ena odgovornost
export class GetTourismOffers { ... }
export class CreateBooking { ... }
export class CancelBooking { ... }
export class SendGuestEmail { ... }
export class CalculatePrice { ... }
```

---

## 🎓 8. Učni Viri za Team

### **Obvezno branje:**

1. **"Domain-Driven Design Distilled"** – Vaughn Vernon (lahkši uvod)
2. **"Implementing Domain-Driven Design"** – Vaughn Vernon
3. **"Clean Architecture"** – Robert C. Martin

### **Video viri:**

1. **DDD Fundamentals** – Pluralsight
2. **Domain-Driven Design** – YouTube (DevTernity conference)

### **Praktični viri:**

1. **DDD Starter Template** – GitHub
2. **Next.js + DDD Example** – Vercel examples

---

## 📈 9. Metrike Napredka

| Metrika | Pred | Po 1 mesecu | Po 3 mesecih | Cilj |
|---------|------|-------------|--------------|------|
| **Domain Coverage** | 40% | 70% | 90% | 95% |
| **Code Duplication** | 15% | 10% | 5% | <3% |
| **Test Coverage** | 65% | 75% | 85% | 90% |
| **Build Time** | 120s | 100s | 90s | <80s |
| **Onboarding Time** | 14 dni | 10 dni | 5 dni | 3 dni |

---

## 🚀 10. Zaključek

### **Ključne Prednosti Nove Arhitekture:**

✅ **Jasna ločnica** med poslovno logiko in tehnično izvedbo  
✅ **Enostavnejše testiranje** (domain testi brez infrastructure)  
✅ **Lažje vzdrževanje** (vsaka domena na enem mestu)  
✅ **Boljša skalabilnost** (neodvisen razvoj domen)  
✅ **Hitrejši onboarding** (jasna struktura za nove razvijalce)

### **Naslednji Koraki:**

1. **Review** tega dokumenta s teamom
2. **Prioritize** faze glede na business potrebe
3. **Schedule** refactor v sprint plan
4. **Start** s Fazo 0 (priprava)

---

**Dokument pripravljen:** 13. marec 2026  
**Avtor:** AgentFlow Pro AI Agent  
**Status:** Pripravljeno za implementacijo
