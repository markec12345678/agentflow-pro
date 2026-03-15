# UseCaseFactory Pattern

## 🎯 Problem

API routes so imeli preveč logike z inicializacijo repository-jev:

```typescript
// ❌ PREVEČ LOGIKE V API-JU
export async function POST(request: NextRequest) {
  // Auth...

  // ❌ To ni naloga API-ja!
  const reservationRepo = new ReservationRepositoryImpl(prisma);
  const guestRepo = new GuestRepositoryImpl(prisma);
  const propertyRepo = new PropertyRepositoryImpl(prisma);
  const notificationRepo = {
    /* ... */
  };

  const useCase = new CreateReservationOrBlock(
    reservationRepo,
    guestRepo,
    propertyRepo,
    notificationRepo,
  );

  const result = await useCase.execute(input);
  return NextResponse.json(result);
}
```

**Težave:**

- ❌ API route skrbi za dependency injection
- ❌ Težko testirati (moraš mockat prismo v API-ju)
- ❌ Ponavljajoča se koda v vsakem API-ju
- ❌ API route ni "tanka plast"

## ✅ Rešitev: UseCaseFactory

Centraliziramo kreiranje use case-ov v eni točki:

```typescript
// ✅ USE CASE FACTORY
export class UseCaseFactory {
  private static reservationRepo = new ReservationRepositoryImpl(prisma);
  private static guestRepo = new GuestRepositoryImpl(prisma);
  private static propertyRepo = new PropertyRepositoryImpl(prisma);

  static createReservationOrBlock(): CreateReservationOrBlock {
    return new CreateReservationOrBlock(
      this.reservationRepo,
      this.guestRepo,
      this.propertyRepo,
      this.notificationRepo,
    );
  }
}
```

## 📐 API Route Pattern

### ✅ TANKA PLAST - Samo 3 stvari:

```typescript
export async function POST(request: NextRequest) {
  // 1. Avtentikacija
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);

  // 2. Validacija
  const body = await request.json();
  if (!body.propertyId) {
    return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
  }

  // 3. Use Case Execution
  const useCase = UseCaseFactory.createReservationOrBlock();
  const result = await useCase.execute({ ...body, userId });

  return NextResponse.json(result);
}
```

### Struktura:

```
1. Avtentikacija (10-15 vrstic)
2. Validacija (5-10 vrstic)
3. Use Case (2-3 vrstice)
─────────────────────────────
SKUPAJ: ~20-30 vrstic namesto 100+
```

## 🏗️ Arhitektura

```
┌─────────────────────────────────────────┐
│           API Route Layer               │
│  ┌─────────────────────────────────┐   │
│  │  /api/tourism/calendar          │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │ 1. Auth                  │   │   │
│  │  │ 2. Validate              │   │   │
│  │  │ 3. UseCaseFactory        │   │   │
│  │  │    .createReservation()  │   │   │
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        UseCaseFactory                   │
│  ┌─────────────────────────────────┐   │
│  │ • createReservationOrBlock()    │   │
│  │ • updateReservation()           │   │
│  │ • cancelReservationOrBlock()    │   │
│  │ • createReservation()           │   │
│  │ • ...                           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Private: Repository Instances  │   │
│  │  • reservationRepo              │   │
│  │  • guestRepo                    │   │
│  │  • propertyRepo                 │   │
│  │  • notificationRepo             │   │
│  └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Use Case Layer                  │
│  ┌─────────────────────────────────┐   │
│  │ CreateReservationOrBlock        │   │
│  │ • Validate property             │   │
│  │ • Check conflicts               │   │
│  │ • Create guest/reservation      │   │
│  │ • Send notification             │   │
│  └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Repository Layer                   │
│  ┌─────────────────────────────────┐   │
│  │ ReservationRepositoryImpl       │   │
│  │ • findById()                    │   │
│  │ • findConflicts()               │   │
│  │ • save()                        │   │
│  │ • cancel()                      │   │
│  └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│       Database Layer (Prisma)           │
│  ┌─────────────────────────────────┐   │
│  │  prisma.reservation.findMany()  │   │
│  │  prisma.guest.create()          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 📁 Lokacije

### Factory

```
src/core/use-cases/use-case-factory.ts
```

### Uporaba v API-ju

```typescript
import { UseCaseFactory } from "@/core/use-cases/use-case-factory";

export async function POST(request: NextRequest) {
  // ...
  const useCase = UseCaseFactory.createReservationOrBlock();
  // ...
}
```

## ✅ Prednosti

### 1. **Tanki API Route-i**

```typescript
// BEFORE: 100+ vrstic
export async function POST() {
  const repo1 = new Repo1();
  const repo2 = new Repo2();
  const repo3 = new Repo3();
  const useCase = new UseCase(repo1, repo2, repo3);
  // ... 80+ vrstic business logike
}

// AFTER: ~30 vrstic
export async function POST() {
  // Auth (10 vrstic)
  // Validate (5 vrstic)
  const useCase = UseCaseFactory.createReservationOrBlock();
  return useCase.execute(input);
}
```

### 2. **Enostavno Testiranje**

```typescript
// Test use case-a brez Next.js
const mockRepo = new MockReservationRepository()
const useCase = new CreateReservationOrBlock(mockRepo, ...)
const result = await useCase.execute(input)
expect(result.success).toBe(true)
```

### 3. **Centralized Dependency Injection**

```typescript
// Vse dependency-je upravlja factory
// API route samo pokliče:
UseCaseFactory.createReservationOrBlock();
```

### 4. **Consistency**

```typescript
// Vsi API-ji uporabljajo enak pattern:
UseCaseFactory.createX();
UseCaseFactory.updateY();
UseCaseFactory.cancelZ();
```

## 🚀 Kako Dodati Nov Use Case

### 1. Ustvari Use Case

```typescript
// src/core/use-cases/my-new-use-case.ts
export class MyNewUseCase {
  constructor(
    private repo1: Repository1,
    private repo2: Repository2,
  ) {}

  async execute(input: Input): Promise<Output> {
    // Business logic
  }
}
```

### 2. Dodaj v Factory

```typescript
// src/core/use-cases/use-case-factory.ts
import { MyNewUseCase } from "./my-new-use-case";

export class UseCaseFactory {
  // ... existing repos ...

  static myNewUseCase(): MyNewUseCase {
    return new MyNewUseCase(this.repo1, this.repo2);
  }
}
```

### 3. Uporabi v API-ju

```typescript
// src/app/api/my-api/route.ts
import { UseCaseFactory } from "@/core/use-cases/use-case-factory";

export async function POST(request: NextRequest) {
  // 1. Auth
  const userId = getUserId(session);

  // 2. Validate
  const body = await request.json();

  // 3. Execute
  const useCase = UseCaseFactory.myNewUseCase();
  const result = await useCase.execute({ ...body, userId });

  return NextResponse.json(result);
}
```

## 📊 Metrike

| Metrika                  | Before            | After          | Izboljšanje        |
| ------------------------ | ----------------- | -------------- | ------------------ |
| **Vrstic v API-ju**      | 100-200           | 20-40          | **-80%**           |
| **Dependency injection** | V vsakem API-ju   | Centraliziran  | **100% DRY**       |
| **Testabilnost**         | Težko             | Enostavno      | **Use case testi** |
| **Consistency**          | Različni patterni | Enoten pattern | **100% standard**  |

## 🎯 Primeri Uporabe

### Calendar API

```typescript
// POST - Create reservation
const useCase = UseCaseFactory.createReservationOrBlock();

// PATCH - Update reservation
const useCase = UseCaseFactory.updateReservation();

// DELETE - Cancel reservation
const useCase = UseCaseFactory.cancelReservationOrBlock();
```

### Reservations API (prihodnji refactoring)

```typescript
// POST - Create reservation
const useCase = UseCaseFactory.createReservation();

// PATCH - Update guest
const useCase = UseCaseFactory.updateGuest();

// DELETE - Cancel reservation
const useCase = UseCaseFactory.cancelReservation();
```

## ⚠️ Opozorila

### 1. **Ne dodaj business logike v factory!**

```typescript
// ❌ NARODE
export class UseCaseFactory {
  static createReservationOrBlock() {
    // ❌ Ne delaj validacije tukaj!
    if (!input.propertyId) throw new Error()

    return new CreateReservationOrBlock(...)
  }
}

// ✅ PRAVILNO
export class UseCaseFactory {
  static createReservationOrBlock() {
    // ✅ Samo dependency injection
    return new CreateReservationOrBlock(...)
  }
}
```

### 2. **Factory ni nadomestilo za Use Case!**

```typescript
// ❌ NARODE
export class UseCaseFactory {
  static async createReservation(input: any) {
    // ❌ To je business logika!
    const property = await prisma.property.findUnique(...)
    // ...
  }
}

// ✅ PRAVILNO
export class UseCaseFactory {
  static createReservation(): CreateReservation {
    // ✅ Samo kreiranje use case-a
    return new CreateReservation(...)
  }
}
```

### 3. **Ne uporabljaj factory za kompleksno konfiguracijo!**

```typescript
// ❌ NARODE
export class UseCaseFactory {
  static createReservationOrBlock(config: ComplexConfig) {
    return new CreateReservationOrBlock(
      config.repo1,
      config.repo2,
      config.repo3,
      config.repo4,
    );
  }
}

// ✅ PRAVILNO
export class UseCaseFactory {
  static createReservationOrBlock(): CreateReservationOrBlock {
    // Uporabi default repository-je
    return new CreateReservationOrBlock(
      this.reservationRepo,
      this.guestRepo,
      this.propertyRepo,
      this.notificationRepo,
    );
  }
}
```

## 🔧 Prihodnje Izboljšave

### 1. **Container-based DI**

```typescript
// Namesto statičnega factory-ja
const container = new DIContainer();
container.register("reservationRepo", ReservationRepositoryImpl);
container.register("useCase", CreateReservationOrBlock);

const useCase = container.resolve("useCase");
```

### 2. **Scoped Repositories**

```typescript
// Za transaction support
export async function POST(request: NextRequest) {
  const scope = UseCaseFactory.createScope();

  await scope.transaction(async () => {
    const useCase1 = scope.createUseCase1();
    const useCase2 = scope.createUseCase2();

    await useCase1.execute();
    await useCase2.execute();
  });
}
```

### 3. **Auto-registration**

```typescript
// Avtomatsko registriraj vse use case-e
export class UseCaseFactory {
  private static cases = new Map<string, any>();

  static register(name: string, factory: () => any) {
    this.cases.set(name, factory);
  }

  static get(name: string) {
    return this.cases.get(name)();
  }
}
```

## 📚 Reference

- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
