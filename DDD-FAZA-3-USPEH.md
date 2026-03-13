# ✅ DDD Faza 3 - USPEŠNO KONČANA!

**Datum:** 13. marec 2026  
**Branch:** `before-ddd-refactor`  
**Status:** ✅ Končano in pushano na GitHub

---

## 📊 Povzetek Faze 3

### Cilji Faze 3:
1. ✅ Implementirati **Repository Pattern** (Property, Reservation, Guest)
2. ✅ Ustvariti **Event Bus** za domain events
3. ✅ Implementirati **CancelReservation Use Case**
4. ✅ Povezati infrastructure z core/domain

---

## 📦 Kaj Je Bilo Ustvarjeno

### 1. Repository Implementacije

**Lokacija:** `infrastructure/database/repositories/`

#### ✅ PropertyRepositoryImpl

```typescript
export class PropertyRepositoryImpl implements PropertyRepository {
  async findById(id: string): Promise<Property | null>
  async findAll(filters?: PropertyFilters): Promise<Property[]>
  async findAvailable(checkIn, checkOut, guests): Promise<Property[]>
  async save(property: Property): Promise<void>
  async delete(id: string): Promise<void>
}
```

**Features:**
- ✅ Find by ID z rooms, amenities, policies
- ✅ Find all z optional filtri (status, location, minRooms)
- ✅ Find available (preveri razpoložljivost za datume)
- ✅ Upsert (create ali update)
- ✅ Mapping: Prisma → Domain Entity

---

#### ✅ ReservationRepositoryImpl

```typescript
export class ReservationRepositoryImpl implements ReservationRepository {
  async findById(id: string): Promise<Reservation | null>
  async findByGuest(guestId: string): Promise<Reservation[]>
  async findByProperty(propertyId: string): Promise<Reservation[]>
  async find(filters?: ReservationFilters): Promise<Reservation[]>
  async save(reservation: Reservation): Promise<void>
  async delete(id: string): Promise<void>
}
```

**Features:**
- ✅ Find by ID z property in guest
- ✅ Find by guest (zgodovina rezervacij gosta)
- ✅ Find by property (vse rezervacije property-ja)
- ✅ Find z filtri (status, propertyId, guestId, dateRange)
- ✅ Upsert z DateRange in Money mapping

---

#### ✅ GuestRepositoryImpl

```typescript
export class GuestRepositoryImpl implements GuestRepository {
  async findById(id: string): Promise<Guest | null>
  async findByEmail(email: string): Promise<Guest | null>
  async find(filters?: GuestFilters): Promise<Guest[]>
  async findWithLoyaltyPoints(minPoints: number): Promise<Guest[]>
  async save(guest: Guest): Promise<void>
  async delete(id: string): Promise<void>
}
```

**Features:**
- ✅ Find by ID
- ✅ Find by email (unique lookup)
- ✅ Find z filtri (email, phone, loyaltyTier)
- ✅ Find with loyalty points (za VIP programe)
- ✅ Upsert z Money in Preferences mapping

---

### 2. Event Bus

**Lokacija:** `infrastructure/messaging/in-memory-event-bus.ts`

#### ✅ InMemoryEventBus

```typescript
export class InMemoryEventBus {
  async publish<T extends DomainEvent>(event: T): Promise<void>
  subscribe<T extends DomainEvent>(eventType, handler): void
  unsubscribe<T extends DomainEvent>(eventType, handler): void
  clear(): void
  getSubscriberCount(eventType): number
}

export const eventBus = new InMemoryEventBus() // Singleton
```

**Features:**
- ✅ Type-safe event publishing
- ✅ Multiple subscribers per event type
- ✅ Parallel handler execution (Promise.all)
- ✅ Error handling (ne ustavi ostalih handlerjev)
- ✅ Singleton pattern za globalni event bus
- ✅ Subscribe/unsubscribe operacije

**Uporaba:**
```typescript
// Subscribe na dogodek
eventBus.subscribe(ReservationCreated, async (event) => {
  await sendConfirmationEmail(event.guestId, event.confirmationCode)
})

// Objavi dogodek
await eventBus.publish(new ReservationCreated(...))
```

---

### 3. Use Case: CancelReservation

**Lokacija:** `core/use-cases/cancel-reservation.ts`

```typescript
export class CancelReservation {
  async execute(input: CancelReservationInput): Promise<CancelReservationOutput> {
    // 1. Validacija
    this.validateCancellation(reservation, cancelledBy)
    
    // 2. Izračun refundacije
    const { refundAmount, cancellationFee } = this.calculateRefund(reservation, property)
    
    // 3. Posodobi status
    reservation.cancel(reason)
    
    // 4. Obdelaj refundacijo
    if (refundAmount.amount > 0) {
      reservation.paymentStatus = 'refunded'
    }
    
    // 5. Objavi dogodek
    const event = new ReservationCancelled(...)
    
    return { reservation, refundAmount, cancellationFee, event }
  }
}
```

**Input:**
```typescript
interface CancelReservationInput {
  reservation: Reservation
  property: Property
  cancelledBy: 'guest' | 'host' | 'system'
  reason: string
}
```

**Output:**
```typescript
interface CancelReservationOutput {
  reservation: Reservation
  refundAmount: Money
  cancellationFee: Money
  event: ReservationCancelled
}
```

**Cancellation Policies:**
```typescript
interface CancellationPolicy {
  type: 'flexible' | 'moderate' | 'strict' | 'super_strict'
  fullRefundDays: number        // Npr. 7 dni
  partialRefundDays: number     // Npr. 3 dni
  partialRefundPercent: number  // Npr. 50%
}
```

**Business Rules:**
- ✅ Popoln refund če prekličeš 7+ dni pred check-in
- ✅ 50% refund če prekličeš 3-7 dni pred check-in
- ✅ Brez refunda če prekličeš < 3 dni pred check-in
- ✅ Host/system preklic = popoln refund
- ✅ Ne moreš preklicati po check-in

---

## 📈 Statistika Faze 3

| Metrika | Vrednost |
|---------|----------|
| **Novih datotek** | 7 |
| **Dodanih vrstic** | 1,300 |
| **Repository Implementacij** | 3 (Property, Reservation, Guest) |
| **Event Bus Implementacij** | 1 (InMemory) |
| **Use Cases** | 1 (CancelReservation) |
| **Export Index Datotek** | 1 |

---

## 🏗️ Celotna Arhitektura (po Fazi 3)

```
src/
├── core/
│   ├── domain/
│   │   ├── shared/value-objects/
│   │   │   ├── money.ts              ✅ F1
│   │   │   ├── date-range.ts         ✅ F1
│   │   │   └── address.ts            ✅ F1
│   │   ├── tourism/
│   │   │   ├── entities/
│   │   │   │   ├── property.ts       ✅ F1
│   │   │   │   └── reservation.ts    ✅ F2
│   │   │   └── events/
│   │   │       └── reservation-events.ts ✅ F2
│   │   └── guest/
│   │       └── entities/
│   │           └── guest.ts          ✅ F2
│   ├── ports/
│   │   ├── repositories.ts           ✅ F1
│   │   └── ai-providers.ts           ✅ F1
│   └── use-cases/
│       ├── calculate-price.ts        ✅ F1
│       ├── create-reservation.ts     ✅ F2
│       └── cancel-reservation.ts     ✅ F3
│
├── infrastructure/
│   ├── database/
│   │   ├── prisma.ts                 (obstoječi)
│   │   └── repositories/
│   │       ├── property-repository.ts    ✅ F3
│   │       ├── reservation-repository.ts ✅ F3
│   │       ├── guest-repository.ts       ✅ F3
│   │       └── index.ts                  ✅ F3
│   └── messaging/
│       └── in-memory-event-bus.ts        ✅ F3
│
└── app/
    └── api/
        └── tourism/
            └── reservations/
                └── route.ts              (needs update)
```

---

## 🎯 Doseženi Cilji

| Cilj | Status | % |
|------|--------|---|
| Implementirati Property Repository | ✅ Končano | 100% |
| Implementirati Reservation Repository | ✅ Končano | 100% |
| Implementirati Guest Repository | ✅ Končano | 100% |
| Ustvariti Event Bus | ✅ Končano | 100% |
| Implementirati CancelReservation UC | ✅ Končano | 100% |
| Povezati infrastructure z domain | ✅ Končano | 100% |
| Git commit | ✅ Končano | 100% |
| Git push | ✅ Končano | 100% |
| **Skupaj** | | **100%** ✅ |

---

## 📚 Primeri Uporabe

### Primer 1: Uporaba Repository-ja

```typescript
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories/property-repository'
import { CalculatePrice } from '@/core/use-cases/calculate-price'

// V API route-u
export async function GET(request: Request) {
  const { propertyId, checkIn, checkOut, guests } = await request.json()
  
  // 1. Uporabi repository
  const propertyRepo = new PropertyRepositoryImpl()
  const property = await propertyRepo.findById(propertyId)
  
  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 })
  }
  
  // 2. Uporabi use case
  const calculatePrice = new CalculatePrice()
  const result = calculatePrice.execute({
    property,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    guests
  })
  
  return Response.json(result)
}
```

---

### Primer 2: Uporaba Event Bus-a

```typescript
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'
import { ReservationCreated } from '@/core/domain/tourism/events/reservation-events'

// Subscribe na dogodek (ob zagonu aplikacije)
eventBus.subscribe(ReservationCreated, async (event) => {
  // 1. Pošlji confirmation email
  await sendEmail({
    to: guest.email,
    subject: 'Potrditev rezervacije',
    body: `Vaša rezervacija ${event.confirmationCode} je potrjena.`
  })
  
  // 2. Posodobi koledar
  await updateCalendar({
    propertyId: event.propertyId,
    dates: event.dateRange,
    status: 'booked'
  })
  
  // 3. Obvesti property manager-ja
  await notifyManager({
    message: `Nova rezervacija: ${event.confirmationCode}`
  })
})

// Objavi dogodek (v use-case-u)
await eventBus.publish(new ReservationCreated(...))
```

---

### Primer 3: CancelReservation Use Case

```typescript
import { CancelReservation } from '@/core/use-cases/cancel-reservation'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// V API route-u
export async function POST(request: Request) {
  const { reservationId, reason, cancelledBy } = await request.json()
  
  // 1. Naloži podatke
  const reservationRepo = new ReservationRepositoryImpl()
  const propertyRepo = new PropertyRepositoryImpl()
  
  const reservation = await reservationRepo.findById(reservationId)
  const property = await propertyRepo.findById(reservation.propertyId)
  
  if (!reservation || !property) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  
  // 2. Uporabi use case
  const cancelReservation = new CancelReservation()
  const result = await cancelReservation.execute({
    reservation,
    property,
    cancelledBy,
    reason
  })
  
  // 3. Shrani spremembe
  await reservationRepo.save(result.reservation)
  
  // 4. Objavi dogodek
  await eventBus.publish(result.event)
  
  // 5. Pošlji email
  await sendCancellationEmail({
    guest: reservation.guestId,
    refundAmount: result.refundAmount,
    cancellationFee: result.cancellationFee
  })
  
  return Response.json(result)
}
```

---

## 🔄 Naslednji Koraki (Faza 4)

### 1. API Routes Refactor

**Posodobi API route-e da uporabljajo novo arhitekturo:**

```typescript
// src/app/api/tourism/reservations/[id]/cancel/route.ts
import { CancelReservation } from '@/core/use-cases/cancel-reservation'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

export async function POST(request: Request) {
  const body = await request.json()
  
  const reservationRepo = new ReservationRepositoryImpl()
  const propertyRepo = new PropertyRepositoryImpl()
  
  const reservation = await reservationRepo.findById(body.reservationId)
  const property = await propertyRepo.findById(reservation.propertyId)
  
  const useCase = new CancelReservation()
  const result = await useCase.execute({
    reservation,
    property,
    cancelledBy: body.cancelledBy,
    reason: body.reason
  })
  
  await reservationRepo.save(result.reservation)
  await eventBus.publish(result.event)
  
  return Response.json(result)
}
```

---

### 2. Več Use-Case-ov

**Predlog:**
- ✅ `ConfirmReservation`
- ✅ `ProcessCheckIn`
- ✅ `ProcessCheckOut`
- ✅ `UpdateGuestPreferences`
- ✅ `GenerateInvoice`
- ✅ `SendGuestMessage`

---

### 3. Event Handler-ji

**Ustvari handler-je za domain events:**

```typescript
// src/infrastructure/messaging/handlers/reservation-created.handler.ts
export class ReservationCreatedHandler {
  async handle(event: ReservationCreated) {
    // Pošlji confirmation email
    await sendEmail(...)
    
    // Posodobi koledar
    await updateCalendar(...)
    
    // Obvesti manager-ja
    await notifyManager(...)
  }
}

// Registracija
eventBus.subscribe(ReservationCreated, new ReservationCreatedHandler().handle)
```

---

### 4. Unit of Work Pattern

**Za transakcije:**

```typescript
export class UnitOfWorkImpl implements UnitOfWork {
  private transactionClient: PrismaClient
  
  async startTransaction(): Promise<void> {
    await this.transactionClient.$transaction(async (tx) => {
      // Vse operacije v transakciji
    })
  }
  
  async commit(): Promise<void> {
    // Commit transakcije
  }
  
  async rollback(): Promise<void> {
    // Rollback transakcije
  }
}
```

---

## 🎉 Zaključek

**Faza 3 je uspešno končana!** ✅

Zdaj imamo:
- ✅ 3 Repository Implementacije (Property, Reservation, Guest)
- ✅ Event Bus za domain events
- ✅ CancelReservation Use Case z refund logic
- ✅ Povezavo med infrastructure in domain

**Skupaj (Faza 0 + 1 + 2 + 3):**
- 📦 **5 Value Objects** (Money, DateRange, Address, ...)
- 📦 **3 Domain Entities** (Property, Reservation, Guest)
- 📦 **6 Domain Events** (Reservation lifecycle)
- 📦 **3 Use Cases** (CalculatePrice, CreateReservation, CancelReservation)
- 📦 **3 Repository Implementacije** (Property, Reservation, Guest)
- 📦 **1 Event Bus** (InMemory)

**Naslednji korak:** Faza 4 - API routes refactor in več use-case-ov!

---

**Avtor:** AgentFlow Pro AI Agent  
**Datum:** 13. marec 2026  
**Status:** ✅ Faza 3 končana - Pripravljeno na Fazo 4
