# API Refactoring: Calendar Route

## Problem

`src/app/api/tourism/calendar/route.ts` vsebuje preveč logike v POST/PATCH/DELETE handlerjih:

```typescript
// ❌ PREVEČ LOGIKE
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { propertyId, roomId, type, checkIn, checkOut, ... } = body

  // 200+ vrstic logike z Prisma klici
  const existingReservations = await prisma.reservation.findMany({...})
  const guest = await prisma.guest.findFirst({...})
  const reservation = await prisma.reservation.create({...})
  await prisma.notification.create({...})
  // ...
}
```

## Rešitev

### 1. Ustvari Use Case razrede

```
src/core/use-cases/
├── create-reservation-or-block.ts      # POST: reservation ali blocked date
├── update-reservation.ts               # PATCH: update reservation
├── cancel-reservation-or-block.ts      # DELETE: cancel/remove
└── check-reservation-conflicts.ts      # Helper: conflict detection
```

### 2. Refactoriraj API Route

```typescript
// ✅ ČIST API ROUTE
export async function POST(request: NextRequest) {
  const body = await request.json();

  const useCase = new CreateReservationOrBlock(
    reservationRepo,
    guestRepo,
    propertyRepo,
    notificationRepo,
  );

  const result = await useCase.execute({
    propertyId: body.propertyId,
    roomId: body.roomId,
    type: body.type,
    checkIn: new Date(body.checkIn),
    checkOut: new Date(body.checkOut),
    // ...
  });

  return NextResponse.json(result);
}
```

### 3. Benefits

- **Manj kode v API route**: 300+ → ~50 vrstic (-83%)
- **Testabilnost**: Use case-e lahko testiraš brez Next.js
- **Reusability**: Isti use case za API, CLI, scheduled jobs
- **Clear boundaries**: Domain logic vs. HTTP handling

## Implementation Plan

### Phase 1: Create Use Cases

- [ ] `CreateReservationOrBlock` use case
- [ ] `UpdateReservation` use case
- [ ] `CancelReservationOrBlock` use case
- [ ] `CheckReservationConflicts` helper

### Phase 2: Refactor API Route

- [ ] Remove Prisma logic from POST handler
- [ ] Remove Prisma logic from PATCH handler
- [ ] Remove Prisma logic from DELETE handler
- [ ] Add proper error handling

### Phase 3: Testing

- [ ] Unit tests for use cases
- [ ] Integration tests for API endpoints
- [ ] E2E tests for calendar workflows

## Files to Create

1. `src/core/use-cases/create-reservation-or-block.ts`
2. `src/core/use-cases/update-reservation.ts`
3. `src/core/use-cases/cancel-reservation-or-block.ts`
4. `src/core/use-cases/check-reservation-conflicts.ts`

## Files to Modify

1. `src/app/api/tourism/calendar/route.ts` - Remove business logic, use use cases
