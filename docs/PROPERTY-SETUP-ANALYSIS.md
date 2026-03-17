# 🏢 PROPERTY SETUP ANALYSIS - AgentFlow Pro

## ✅ KAJ IMAMO (Backend - Prisma Schema)

### 📊 Property Model - POLNO PODPORO!
```sql
model Property {
  // Osnovni podatki
  id              String    @id @default(cuid())
  userId          String?
  name            String    // "Hotel Bled", "Apartmaji Piran"
  location        String?   // "Bled, Slovenija"
  type            String?   // "hotel", "apartment", "resort"
  capacity        Int?      // Število oseb
  description     String?   // Opis nastanitve
  
  // Cene
  basePrice       Float?    // Osnovna cena na noč
  currency        String?   @default("EUR")
  seasonRates     Json?     // { high: [{from,to,rate}], mid: [...], low: [...] }
  pricingRules    Json?     // { weekendFactor: 1.2, minStay: 2, earlyBird: {...} }
  
  // Avtomatizacija
  reservationAutoApprovalRules Json? // { enabled: boolean, channels?: string[], maxAmount?: number }
  
  // Integracije
  rnoId           Int?       // RNO ID nastanitvenega obrata (AJPES)
  eturizemId      String?    // ID za eTurizem/AJPES
  eturizemSyncStatus String?  @default("not_mapped") // not_mapped, pending, success, error
  eturizemSyncedAt DateTime?
  eturizemLastError String?
  
  // Relacije (vse obstaja!)
  rooms           Room[]      // Sobe v tej nepremičnini
  amenities       Amenity[]  // Ugodnosti
  policies        PropertyPolicy[] // Pravila
  reservations    Reservation[]
  guests          Guest[]
  reviews         Review[]
  communications  GuestCommunication[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**✅ VERDICT:** Backend je 100% POPOLN! Podpira vse, kar potrebujemo.

---

## ✅ KAJ IMAMO (API Endpoints)

### 📡 Property API - DELUJOČE!
```typescript
// GET /api/tourism/properties
// Vrne vse properties za uporabnika
export async function GET() {
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ properties });
}

// POST /api/tourism/properties  
// Kreira novo property
export async function POST(request: NextRequest) {
  const property = await prisma.property.create({
    data: {
      userId,
      name,
      location: body.location?.trim() || null,
      type: body.type?.trim() || null,
      capacity: typeof body.capacity === "number" ? body.capacity : null,
      basePrice: typeof body.basePrice === "number" ? body.basePrice : null,
      currency: body.currency?.trim() || null,
    },
  });
  return NextResponse.json(property);
}
```

**✅ VERDICT:** API osnovno deluje, AMPAK je POENOSTAVLJENO!

---

## ❌ KAJ MANJKA (Frontend UI)

### 🖥️ Property Management UI - NI KOMPLETNO!

#### ✅ Obstaja:
- `/settings/business/page.tsx` - Osnovni property info (name, legal name, address)
- `/api/tourism/properties/route.ts` - API za kreiranje/listanje

#### ❌ Manjka:
- **Property Dashboard** - centralni pregled vseh properties
- **Property Creation Form** - poln form za vnos vseh podatkov
- **Property Edit Form** - urejanje obstoječih properties
- **Room Management** - dodajanje/urejanje sob
- **Amenities Management** - ugodbnosti (WiFi, AC, itd.)
- **Policies Management** - pravila nastanitve
- **Pricing Management** - sezonske cene, pravila
- **eTurizem Integration** - sync nastavitve

---

## 🎯 KONKRETNI MANJKOČI:

### 1. **PROPERTY CREATION FORM**
```typescript
// Manjka: /dashboard/properties/create
// Bi moral podpreti VSE polja iz Prisma:
{
  name: "Hotel Bled",
  location: "Bled, Slovenija", 
  type: "hotel",
  capacity: 50,
  description: "Luxury hotel with lake view",
  basePrice: 150,
  currency: "EUR",
  seasonRates: {
    high: [{from: "2024-06-01", to: "2024-09-01", rate: 200}],
    mid: [{from: "2024-04-01", to: "2024-06-01", rate: 150}],
    low: [{from: "2024-10-01", to: "2024-04-01", rate: 100}]
  },
  pricingRules: {
    weekendFactor: 1.2,
    minStay: 2,
    earlyBird: {days: 30, discount: 0.1}
  },
  reservationAutoApprovalRules: {
    enabled: true,
    channels: ["direct", "booking.com"],
    maxAmount: 500
  }
}
```

### 2. **PROPERTY EDIT FORM**
```typescript
// Manjka: /dashboard/properties/[id]/edit
// Bi moral omogočiti urejanje VSEH polj
```

### 3. **ROOM MANAGEMENT**
```typescript
// Manjka: /dashboard/properties/[id]/rooms
// API: /api/properties/[id]/rooms
// Dodajanje, urejanje, brisanje sob
```

### 4. **AMENITIES MANAGEMENT**
```typescript
// Manjka: /dashboard/properties/[id]/amenities
// API: /api/properties/[id]/amenities
// WiFi, AC, Parking, Pool, itd.
```

### 5. **POLICIES MANAGEMENT**
```typescript
// Manjka: /dashboard/properties/[id]/policies
// API: /api/properties/[id]/policies
// Check-in time, cancellation policy, etc.
```

---

## 🚀 IMPLEMENTATION PLAN:

### Phase 1 (1 teden - Critical):
1. **Property Creation Form** - poln form z vsemi polji
2. **Property List Dashboard** - pregled vseh properties
3. **Property Edit Form** - urejanje obstoječih
4. **API Enhancement** - podpora za vse Prisma polja

### Phase 2 (1 teden - Core):
1. **Room Management** - dodajanje/urejanje sob
2. **Amenities Management** - ugodbnosti
3. **Pricing Management** - sezonske cene
4. **Basic eTurizem Setup** - ID nastavitve

### Phase 3 (1 teden - Advanced):
1. **Policies Management** - pravila
2. **Auto-approval Rules** - avtomatsko odobritev
3. **Advanced eTurizem** - sync, error handling
4. **Property Analytics** - performance metrics

---

## 📋 KONKRETNI NAPOTKI ZA PROGRAMERJA:

### 1. **Najprej razširi API:**
```typescript
// /api/tourism/properties/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const property = await prisma.property.create({
    data: {
      userId,
      name: body.name,
      location: body.location,
      type: body.type,
      capacity: body.capacity,
      description: body.description,
      basePrice: body.basePrice,
      currency: body.currency,
      seasonRates: body.seasonRates,      // ✅ DODAJ
      pricingRules: body.pricingRules,    // ✅ DODAJ
      reservationAutoApprovalRules: body.reservationAutoApprovalRules, // ✅ DODAJ
      eturizemId: body.eturizemId,        // ✅ DODAJ
    },
  });
}
```

### 2. **Naredi Property Dashboard:**
```typescript
// /dashboard/properties/page.tsx
export default function PropertiesPage() {
  return (
    <div>
      <PropertyList />
      <CreatePropertyButton />
    </div>
  );
}
```

### 3. **Naredi Property Form:**
```typescript
// /dashboard/properties/create/page.tsx
export default function CreatePropertyPage() {
  return (
    <PropertyForm mode="create" />
  );
}
```

---

## 🎯 ZAKLJUČEK:

### ✅ KAJ JE DOBRO:
- **Backend (Prisma)** - 100% POPOLN, podpira vse kar potrebujemo
- **Osnovni API** - deluje, ampak je poenostavljen
- **Settings UI** - obstaja osnovni property info

### ❌ KAJ JE SLABO:
- **Frontend UI** - manjkajo ključni formi in dashboardi
- **API** - podpira samo osnovna polja
- **User Experience** - ni centralnega property managementa

### 🚀 KAJ NAREDITI:
1. **Razširi API** za vse Prisma polja
2. **Naredi Property Dashboard** 
3. **Naredi Property Forms** (create/edit)
4. **Dodaj Room/Amenities/Pricing management**

**⏰ Čas:** 2-3 tedni za polno funkcionalnost

**💡 Prioriteta:** Property Dashboard > Property Forms > Room Management > Advanced Features
