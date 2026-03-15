# 🚀 API Route Bulk Refactoring Script

## 📊 Trenutno Stanje

**Total API Routes:** 320  
**Refactored:** 30 (9.375%)  
**Remaining:** 290 (90.625%)

**Cilj Faze 17B:** 150 route-ov refactored (46.875%)  
**Preostalih do cilja:** 120 route-ov

---

## 📋 Prioritete po Serijah

### ✅ **Completed (30 routes):**
- Previously refactored: 20 routes
- Serija 1 (partial): 2 routes (guests, properties/[id])

### 🔴 **Next: Serija 1 Completion (8 routes)**
```
3. /api/tourism/calendar
4. /api/tourism/notifications
5. /api/tourism/analytics
6. /api/tourism/faq
7. /api/tourism/chat
8. /api/tourism/workflow
9. /api/tourism/generate
10. /api/tourism/ical
```

### 🟡 **Serija 2: Guest Management (10 routes)**
```
1. /api/tourism/guests/[id]
2. /api/tourism/guest-communication
3. /api/tourism/inquiries
4. /api/tourism/inquiries/[id]
5. /api/tourism/itineraries
6. /api/tourism/itineraries/[id]
7. /api/tourism/landing-pages
8. /api/tourism/landing-pages/[id]
9. /api/tourism/photo-analysis
10. /api/tourism/search
```

### 🟡 **Serija 3: Payments & Invoices (10 routes)**
```
1. /api/tourism/payments/charge
2. /api/tourism/payments/capture
3. /api/tourism/payments/refund
4. /api/tourism/payments/create-intent
5. /api/tourism/invoices/generate
6. /api/tourism/reservations/[id]/invoice
7. /api/tourism/reservations/[id]/payments
8. /api/tourism/revenue/analytics
9. /api/tourism/revenue/export
10. /api/tourism/daily-revenue
```

### 🟡 **Serija 4: Housekeeping (10 routes)**
```
1. /api/tourism/housekeeping/tasks
2. /api/tourism/housekeeping/tasks/[id]/status
3. /api/tourism/housekeeping/schedule
4. /api/tourism/housekeeping/staff
5. /api/tourism/housekeeping/analytics
6. /api/tourism/housekeeping/my-tasks
7. /api/tourism/housekeeping/optimize-routes
8. /api/tourism/properties/[id]/rooms
9. /api/tourism/properties/[id]/rooms/[roomId]
10. /api/tourism/properties/[id]/amenities
```

### 🟡 **Serija 5: Channel Management (10 routes)**
```
1. /api/tourism/channel-manager/sync
2. /api/tourism/channel-manager/webhook
3. /api/tourism/airbnb/oauth
4. /api/tourism/booking/availability
5. /api/tourism/booking/create
6. /api/tourism/eturizem/submit
7. /api/tourism/eturizem/check-in
8. /api/tourism/eturizem/connection
9. /api/tourism/pms-connections
10. /api/tourism/pms-sync
```

### ⚪ **Serija 6-12: Preostalih 70 route-ov**
(Will be identified and refactored in batches)

---

## 🔧 Refactoring Pattern (Template)

### **Step 1: Analyze Route**
```bash
# Check route size and complexity
wc -l src/app/api/tourism/guests/route.ts
```

### **Step 2: Create Use Case**
```typescript
// src/core/use-cases/[action]-[entity].ts
export class [Action][Entity] {
  constructor(private repo: Repository) {}
  
  async execute(input: Input): Promise<Output> {
    // Business logic here
  }
}
```

### **Step 3: Refactor API Route**
```typescript
// Thin wrapper (<50 lines)
export async function GET(request: NextRequest) {
  const useCase = new [Action][Entity]()
  const result = await useCase.execute(input)
  return NextResponse.json(result)
}
```

### **Step 4: Test**
```bash
npm run dev
# Test endpoint
```

### **Step 5: Commit**
```bash
git add .
git commit -m "refactor: [Action][Entity] API route"
git push
```

---

## 📊 Progress Tracker

| Batch | Routes | Status | % Complete |
|-------|--------|--------|------------|
| **Existing** | 30 | ✅ Done | 100% |
| **Serija 1** | 8 | ⏳ Pending | 0% |
| **Serija 2** | 10 | ⏳ Pending | 0% |
| **Serija 3** | 10 | ⏳ Pending | 0% |
| **Serija 4** | 10 | ⏳ Pending | 0% |
| **Serija 5** | 10 | ⏳ Pending | 0% |
| **Serija 6-12** | 70 | ⏳ Pending | 0% |

**Target:** 150 routes (46.875%)

---

## 🚀 Bulk Refactoring Strategy

### **Option A: Manual Refactoring (High Quality)**
- Refactor each route individually
- Time: ~30 minutes per route
- Total: 120 routes × 30 min = 60 hours
- Quality: 100%

### **Option B: AI-Assisted (Medium Quality)**
- Use AI to generate use cases
- Time: ~15 minutes per route
- Total: 120 routes × 15 min = 30 hours
- Quality: 85%

### **Option C: Template-Based (Fast)**
- Create generic use cases
- Time: ~5 minutes per route
- Total: 120 routes × 5 min = 10 hours
- Quality: 70%

### **Recommended: Hybrid (Option B+C)**
- Critical routes: AI-Assisted (50 routes)
- Simple routes: Template-Based (70 routes)
- Total: ~20 hours
- Quality: 80%

---

## 💡 Automation Ideas

### **Script 1: Use Case Generator**
```bash
# Generate use case boilerplate
./scripts/generate-use-case.ts GetGuests
```

### **Script 2: Route Analyzer**
```bash
# Analyze all routes and prioritize
./scripts/analyze-routes.ts
```

### **Script 3: Bulk Refactor**
```bash
# Refactor multiple routes at once
./scripts/bulk-refactor.ts --series 1
```

---

## 🎯 Next Action

**Start with Serija 1 (8 routes)** to complete the first batch.

**Estimated Time:** 4 hours  
**Benefit:** 38/320 routes refactored (11.875%)

**Ready to start?** 🚀
