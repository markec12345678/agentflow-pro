# 🚀 Faza 17B: API Route Refactoring Guide

## 📋 Cilj: Refactor Next 50 API Routes

**Trenutno:** 20/320 refactored (6.25%)  
**Cilj:** 70/320 refactored (21.875%)  
**Preostalih:** 50 route-ov

---

## 🎯 Prioritete - Serije po 10 Route-ov

### **Serija 1: Tourism Core** (10 route-ov)
1. `/api/tourism/guests` - Guest management ✅
2. `/api/tourism/properties/[id]` - Property details
3. `/api/tourism/calendar` - Calendar management
4. `/api/tourism/notifications` - Notifications
5. `/api/tourism/analytics` - Tourism analytics
6. `/api/tourism/faq` - FAQ system
7. `/api/tourism/chat` - Chat system
8. `/api/tourism/workflow` - Workflow execution
9. `/api/tourism/generate` - Content generation
10. `/api/tourism/ical` - iCal integration

**Čas:** ~5 ur  
**Benefit:** Core tourism functionality refactored

### **Serija 2: Guest Management** (10 route-ov)
1. `/api/tourism/guests/[id]` - Guest details
2. `/api/tourism/guest-communication` - Guest messaging
3. `/api/tourism/inquiries` - Guest inquiries
4. `/api/tourism/inquiries/[id]` - Inquiry details
5. `/api/tourism/itineraries` - Itinerary management
6. `/api/tourism/itineraries/[id]` - Itinerary details
7. `/api/tourism/landing-pages` - Landing pages
8. `/api/tourism/landing-pages/[id]` - Landing page details
9. `/api/tourism/photo-analysis` - Photo analysis
10. `/api/tourism/search` - Search functionality

**Čas:** ~5 ur  
**Benefit:** Guest management refactored

### **Serija 3: Payments & Invoices** (10 route-ov)
1. `/api/tourism/payments/charge` - Charge payment
2. `/api/tourism/payments/capture` - Capture payment
3. `/api/tourism/payments/refund` - Refund payment
4. `/api/tourism/payments/create-intent` - Create payment intent
5. `/api/tourism/invoices/generate` - Generate invoice
6. `/api/tourism/reservations/[id]/invoice` - Reservation invoice
7. `/api/tourism/reservations/[id]/payments` - Reservation payments
8. `/api/tourism/revenue/analytics` - Revenue analytics
9. `/api/tourism/revenue/export` - Revenue export
10. `/api/tourism/daily-revenue` - Daily revenue

**Čas:** ~5 ur  
**Benefit:** Payment system refactored

### **Serija 4: Housekeeping** (10 route-ov)
1. `/api/tourism/housekeeping/tasks` - Tasks management
2. `/api/tourism/housekeeping/tasks/[id]/status` - Task status
3. `/api/tourism/housekeeping/schedule` - Schedule management
4. `/api/tourism/housekeeping/staff` - Staff management
5. `/api/tourism/housekeeping/analytics` - Housekeeping analytics
6. `/api/tourism/housekeeping/my-tasks` - My tasks
7. `/api/tourism/housekeeping/optimize-routes` - Route optimization
8. `/api/tourism/properties/[id]/rooms` - Rooms management
9. `/api/tourism/properties/[id]/rooms/[roomId]` - Room details
10. `/api/tourism/properties/[id]/amenities` - Amenities

**Čas:** ~5 ur  
**Benefit:** Housekeeping system refactored

### **Serija 5: Channel Management** (10 route-ov)
1. `/api/tourism/channel-manager/sync` - Channel sync
2. `/api/tourism/channel-manager/webhook` - Channel webhook
3. `/api/tourism/airbnb/oauth` - Airbnb OAuth
4. `/api/tourism/booking/availability` - Booking.com availability
5. `/api/tourism/booking/create` - Booking.com create
6. `/api/tourism/eturizem/submit` - eTurizem submit
7. `/api/tourism/eturizem/check-in` - eTurizem check-in
8. `/api/tourism/eturizem/connection` - eTurizem connection
9. `/api/tourism/pms-connections` - PMS connections
10. `/api/tourism/pms-sync` - PMS sync

**Čas:** ~5 ur  
**Benefit:** Channel management refactored

---

## 📝 Refactoring Pattern

### **Before (Monolithic API Route):**
```typescript
// src/app/api/tourism/guests/route.ts (150+ vrstic)
export async function GET(request: NextRequest) {
  // 50 vrstic validation
  // 50 vrstic business logic
  // 30 vrstic database calls
  // 20 vrstic response formatting
  return NextResponse.json(guests)
}
```

### **After (Thin API Route + Use Case):**
```typescript
// src/app/api/tourism/guests/route.ts (40 vrstic)
import { GetGuests } from '@/core/use-cases/get-guests'

export async function GET(request: NextRequest) {
  const useCase = new GetGuests()
  const result = await useCase.execute({ userId, filters })
  return NextResponse.json(result)
}

// src/core/use-cases/get-guests.ts (100 vrstic)
export class GetGuests {
  async execute(input: GetGuestsInput): Promise<GetGuestsOutput> {
    // Business logic here
  }
}
```

---

## ✅ Refactoring Checklist za Vsak Route

- [ ] 1. Identificiraj business logic v API route-u
- [ ] 2. Ustvari Use Case v `src/core/use-cases/`
- [ ] 3. Premakni business logic v Use Case
- [ ] 4. Posodobi API route da kliče Use Case
- [ ] 5. Dodaj middleware za error handling
- [ ] 6. Testiraj refactored route
- [ ] 7. Commitaj spremembe

---

## 📊 Progress Tracker

| Serija | Route-i | Status | % Complete |
|--------|---------|--------|------------|
| **Existing** | 20 | ✅ Končano | 6.25% |
| **Serija 1** | 10 | ⏳ Čaka | 0% |
| **Serija 2** | 10 | ⏳ Čaka | 0% |
| **Serija 3** | 10 | ⏳ Čaka | 0% |
| **Serija 4** | 10 | ⏳ Čaka | 0% |
| **Serija 5** | 10 | ⏳ Čaka | 0% |

**Skupaj:** 20/70 (28.57%) → 70/320 (21.875%)

---

## 🚀 Navodila za Nadaljevanje

### **Korak 1: Izberi Serijo**
Začni s Serija 1 (Tourism Core) - najbolj kritični route-i

### **Korak 2: Začni z Prvim Route-om**
Odpri `/api/tourism/guests/route.ts` in sledi refactoring pattern-u

### **Korak 3: Ustvari Use Case**
```bash
# Ustvari nov use case
touch src/core/use-cases/get-guests.ts
```

### **Korak 4: Refaktoriziraj**
- Premakni logic v use case
- Pusti tanek API wrapper
- Dodaj error handling

### **Korak 5: Testiraj**
```bash
# Testiraj route
npm run dev
# Obišči http://localhost:3002/api/tourism/guests
```

### **Korak 6: Commitaj**
```bash
git add .
git commit -m "refactor: GetGuests API route"
git push
```

### **Korak 7: Ponovi za Naslednji Route**
Nadaljuj z naslednjim route-om v seriji

---

## 💡 Tips & Tricks

### **Hitrejši Refactoring:**
1. **Copy-Paste Pattern** - Uporabi obstoječe use case-e kot template
2. **Bulk Refactoring** - Refaktoriziraj 3-5 route-ov naenkrat
3. **AI Assistance** - Uporabi AI za generiranje boilerplate code

### **Kvaliteta:**
1. **Error Handling** - Vedno dodaj proper error handling
2. **Validation** - Validiraj input v use case-u
3. **Type Safety** - Uporabi TypeScript za input/output DTO-je
4. **Testing** - Testiraj vsak refactored route

---

## 🎯 Končni Cilj

**Po 50 route-ih:**
- ✅ 70/320 API route-ov refactored (21.875%)
- ✅ Vsi core route-i "tanki" (<100 vrstic)
- ✅ Business logic v use case-ih
- ✅ Easy to test in maintain

**Next Milestone:** 150/320 (46.875%) - Top 50% route-ov

---

**Ready to Start?** 🚀

Izberi prvo serijo in začni z refactoringom!
