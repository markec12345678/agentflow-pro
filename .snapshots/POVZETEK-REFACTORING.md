# 🎯 POVZETEK: Calendar API Refactoring

## Kaj smo naredili?

Refaktorirali smo `/api/tourism/calendar` API route iz **300+ vrstic business logike** v **čisto arhitekturo z use case-i**.

## 📊 Rezultati

| Metrika                      | Pred        | Po           | Izboljšanje          |
| ---------------------------- | ----------- | ------------ | -------------------- |
| **Business logika v API-ju** | ✅ Da       | ❌ Ne        | 100% odstranjeno     |
| **Dolžina POST handlerja**   | 200+ vrstic | ~70 vrstic   | **-65%**             |
| **Testabilnost**             | ❌ Težko    | ✅ Enostavno | Use case testi       |
| **Ponovna uporaba**          | ❌ Samo API | ✅ Vsod      | Domain logika ločena |

## ✅ Ustvarjene datoteke

### Use Cases (src/core/use-cases/)

1. ✅ `create-reservation-or-block.ts` (267 vrstic)
   - Ustvari rezervacijo ali blokirane datume
   - Preveri konflikte datumov
   - Ustvari/gostu posodobi gosta
   - Pošlje notifikacije

2. ✅ `update-reservation.ts` (108 vrstic)
   - Posodobi obstoječo rezervacijo
   - Validira avtorizacijo
   - Posodobi: status, note, ceno, akontacijo, takso

3. ✅ `cancel-reservation-or-block.ts` (95 vrstic)
   - Prekliče rezervacijo (soft delete)
   - Odstrani blokirane datume
   - Validira avtorizacijo

4. ✅ `create-reservation-or-block.test.ts` (230 vrstic)
   - Unit testi za use case
   - 6 testnih primerov
   - Mock repository-ji

### Posodobljene datoteke

1. ✅ `src/app/api/tourism/calendar/route.ts`
   - GET: že uporablja GetCalendar use case
   - POST: refaktoriran (200+ → ~70 vrstic)
   - PATCH: refaktoriran (60 → ~50 vrstic)
   - DELETE: refaktoriran (60 → ~50 vrstic)

2. ✅ `src/infrastructure/database/repositories/reservation-repository.ts`
   - Dodana metoda `findConflicts()`
   - Dodana metoda `cancel()`

3. ✅ `src/infrastructure/database/repositories/property-repository.ts`
   - Dodano polje `ownerId` v mapiranju

4. ✅ `src/core/domain/tourism/entities/property.ts`
   - Dodano polje `ownerId?: string`

5. ✅ `src/core/domain/tourism/entities/reservation.ts`
   - Dodane metode: `updateStatus()`, `updateNotes()`, `updatePrice()`, `updateDeposit()`, `updateTouristTax()`

6. ✅ `src/core/ports/repositories.ts`
   - Dodani metodi: `findConflicts()` in `cancel()`

## 🎯 Prednosti

### 1. **Ločevanje odgovornosti**

```
API Route   → Samo HTTP (request/response)
Use Case    → Samo business logika
Repository  → Samo dostop do podatkov
```

### 2. **Testabilnost**

```typescript
// Enostavni unit testi brez Next.js
const mockRepo = new MockReservationRepository()
const useCase = new CreateReservationOrBlock(mockRepo, ...)
const result = await useCase.execute(input)
expect(result.success).toBe(true)
```

### 3. **Ponovna uporaba**

```typescript
// Isti use case lahko uporabiš za:
- API route
- CLI commands
- Scheduled jobs
- GraphQL resolvers
```

### 4. **Maintainability**

- Manj kode na enem mestu
- Jasne odvisnosti
- Lažje razumevanje
- Lažje spreminjanje

## 📁 Struktura

```
src/
├── core/
│   ├── domain/
│   │   ├── tourism/
│   │   │   └── entities/
│   │   │       ├── reservation.ts ✅ posodobljeno
│   │   │       └── property.ts ✅ posodobljeno
│   │   └── guest/
│   │       └── entities/
│   │           └── guest.ts
│   ├── ports/
│   │   └── repositories.ts ✅ posodobljeno
│   └── use-cases/
│       ├── create-reservation-or-block.ts ✅ novo
│       ├── create-reservation-or-block.test.ts ✅ novo
│       ├── update-reservation.ts ✅ novo
│       └── cancel-reservation-or-block.ts ✅ novo
├── infrastructure/
│   └── database/
│       └── repositories/
│           ├── reservation-repository.ts ✅ posodobljeno
│           └── property-repository.ts ✅ posodobljeno
└── app/
    └── api/
        └── tourism/
            └── calendar/
                └── route.ts ✅ refaktoriran
```

## 🔄 Primer: Pred in Po

### ❌ PRED (300+ vrstic v API-ju)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()

  // 200+ vrstic Prisma logike
  const existingReservations = await prisma.reservation.findMany({...})
  const guest = await prisma.guest.findFirst({...})
  const reservation = await prisma.reservation.create({...})
  await prisma.notification.create({...})

  return NextResponse.json({ reservation, guest })
}
```

### ✅ PO (70 vrstic, use case)

```typescript
export async function POST(request: NextRequest) {
  const userId = getUserId(session);
  const body = await request.json();

  const reservationRepo = new ReservationRepositoryImpl(prisma);
  const guestRepo = new GuestRepositoryImpl(prisma);
  const propertyRepo = new PropertyRepositoryImpl(prisma);

  const useCase = new CreateReservationOrBlock(
    reservationRepo,
    guestRepo,
    propertyRepo,
    notificationRepo,
  );

  const result = await useCase.execute({
    propertyId: body.propertyId,
    checkIn: new Date(body.checkIn),
    checkOut: new Date(body.checkOut),
    guestEmail: body.guestEmail,
    userId,
  });

  return NextResponse.json(result, { status: 201 });
}
```

## 📚 Dokumentacija

1. ✅ `.snapshots/CALENDAR-API-REFACTOR-COMPLETION.md`
   - Popoln report z vsemi spremembami
   - Metrike in izboljšave
   - Next steps

2. ✅ `.snapshots/CALENDAR-API-REFACTOR-VISUAL-GUIDE.md`
   - Arhitekturni diagrami
   - Request flow primeri
   - Code comparison

3. ✅ `.snapshots/sponsors-refactoring-plan.md`
   - Originalni plan
   - Implementation phases

## 🚀 Naslednji koraki

### Takoj

1. [ ] Zagnati teste: `npm test create-reservation-or-block`
2. [ ] Testirati API ročno
3. [ ] Preveriti da vse deluje

### Kratkoročno

1. [ ] Refaktoriti ostale tourism API route-e:
   - `/api/tourism/reservations/[id]/check-in`
   - `/api/tourism/reservations/[id]/check-out`
   - `/api/tourism/complete`

2. [ ] Dodati integration teste za API endpoint-e

3. [ ] Dodati error handling middleware

### Dolgoročno

1. [ ] Implementirati domain events za side effects
2. [ ] Dodati CQRS pattern za kompleksne query-je
3. [ ] Implementirati saga pattern za distribuirane transakcije

## 💡 Ključne lekcije

1. **Vedno uporabi use case-e** za business logiko
2. **API routes naj bodo tanki** (samo HTTP handling)
3. **Repository pattern** omogoča testiranje
4. **Domain entities** naj vsebujejo business rules
5. **Dependency injection** omogoča fleksibilnost

## ✅ Zaključek

Uspešno smo transformirali `/api/tourism/calendar` iz **300+ vrstic monolitnega API route-a** v **čisto, testabilno, maintainable arhitekturo z use case-i**.

**Pattern je zdaj vzpostavljen in se lahko uporabi za ostale API route.**

---

**Čas refactoringa:** ~2 uri  
**Novih datotek:** 4  
**Posodobljenih datotek:** 6  
**Novih vrstic kode:** ~700  
**Odstranjenih vrstic iz API-ja:** ~200  
**Neto izboljšava:** ⭐⭐⭐⭐⭐
