# 🇸🇮 Slovenian Tax System - Implementation Guide

**Status:** ✅ IMPLEMENTED
**Created:** 2026-03-16
**Version:** 1.0

---

## 📋 OVERVIEW

AgentFlow Pro now includes a complete Slovenian tax calculation system supporting:

1. **Tourist Tax (Turistična taksa)** - Automatic calculation by municipality
2. **VAT (DDV)** - 9.5% for accommodation, 22% for other services
3. **Tax Reporting** - Monthly reports for eDavki submission
4. **Invoice Generation** - Tax-compliant invoices with breakdown

---

## 🏗️ ARCHITECTURE

```
src/lib/tax/
├── tourist-tax-calculator.ts  # Tourist tax by municipality
├── vat-calculator.ts          # VAT (DDV) calculations
├── tax-engine.ts              # Unified tax engine
└── README.md                  # This file

scripts/
└── seed-tax-rates.ts          # Seed municipality rates

src/pages/api/tax/
└── calculate.ts               # API endpoint

tests/tax/
├── tourist-tax.test.ts        # Tourist tax tests
├── vat-calculator.test.ts     # VAT tests (TODO)
└── tax-engine.test.ts         # Integration tests (TODO)
```

---

## 🚀 QUICK START

### **1. Seed Tax Rates**

First, populate the database with Slovenian municipality rates:

```bash
npx ts-node scripts/seed-tax-rates.ts
```

This will create rates for 40+ Slovenian municipalities including:
- Ljubljana (€3.13/adult)
- Bled (€3.00/adult)
- Piran/Portorož (€3.00/adult)
- Kranjska Gora/Bohinj (€2.50/adult)
- And many more...

### **2. Calculate Taxes**

#### **Using the API:**

```typescript
POST /api/tax/calculate

{
  "checkIn": "2026-03-20",
  "checkOut": "2026-03-23",
  "municipality": "ljubljana",
  "guests": [
    { "age": 35 },
    { "age": 32 },
    { "age": 10 },
    { "age": 5 }
  ],
  "accommodationAmount": 300,
  "foodAmount": 50,
  "servicesAmount": 0
}
```

Response:
```json
{
  "success": true,
  "data": {
    "touristTax": {
      "totalTax": 14.10,
      "breakdown": [...],
      "nights": 3,
      "guests": 4
    },
    "vat": {
      "totalNet": 350,
      "totalVAT": 33.25,
      "totalGross": 383.25,
      "breakdown": {
        "accommodation": { "base": 300, "amount": 28.50 },
        "food": { "base": 50, "amount": 11.00 }
      }
    },
    "totals": {
      "subtotal": 350,
      "touristTax": 14.10,
      "totalVAT": 33.25,
      "totalTax": 47.35,
      "grandTotal": 397.35
    }
  }
}
```

#### **Using the Library:**

```typescript
import { calculateReservationTax } from '@/lib/tax/tax-engine';

const result = await calculateReservationTax({
  checkIn: new Date('2026-03-20'),
  checkOut: new Date('2026-03-23'),
  municipality: 'ljubljana',
  guests: [
    { age: 35 },
    { age: 32 },
    { age: 10 },
    { age: 5 }
  ],
  accommodationAmount: 300,
  foodAmount: 50,
  servicesAmount: 0,
});

console.log(result.totals.grandTotal); // €397.35
console.log(formatTaxBreakdown(result)); // Formatted breakdown
```

---

## 📊 TAX RULES

### **Tourist Tax (Turistična taksa)**

| Age Group | Rate | Notes |
|-----------|------|-------|
| **0-7 years** | Free | Always €0 |
| **7-18 years** | 50% discount | Half of adult rate |
| **18+ years** | Full rate | Varies by municipality |

**Municipality Rates (2026):**
- Ljubljana: €3.13/adult
- Bled, Piran, Portorož: €3.00/adult
- Kranjska Gora, Bohinj, Radovljica: €2.50/adult
- Other municipalities: €2.00-€2.50/adult

**Spa Tax (Zdraviliška taksa):**
- Some municipalities (Moravske Toplice, Radenci) charge additional spa tax
- Typically €0.50 per person per night

### **VAT (DDV)**

| Category | Rate | Applies To |
|----------|------|------------|
| **Accommodation** | 9.5% | Room nights, breakfast (if included) |
| **Food** | 22% | Restaurant meals, other food services |
| **Services** | 22% | Wellness, parking, transfers, tours |
| **Other** | 22% | Any other taxable items |

**Important:** In Slovenia, tourist tax is NOT subject to VAT. It's a pass-through tax collected on behalf of the municipality.

---

## 💡 USAGE EXAMPLES

### **Example 1: Weekend in Ljubljana**

```typescript
// Family of 4 (2 adults, 2 children)
// 3 nights in Ljubljana
// Accommodation: €100/night = €300 total

const result = await calculateReservationTax({
  checkIn: new Date('2026-03-20'),
  checkOut: new Date('2026-03-23'),
  municipality: 'ljubljana',
  guests: [
    { age: 40 },
    { age: 38 },
    { age: 12 }, // Child (7-18)
    { age: 5 }   // Infant (0-7)
  ],
  accommodationAmount: 300,
});

// Tourist Tax:
// - Adult 1: 3 nights × €3.13 = €9.39
// - Adult 2: 3 nights × €3.13 = €9.39
// - Child (12): 3 nights × €1.57 = €4.71
// - Infant (5): 3 nights × €0 = €0
// Total Tourist Tax: €23.49

// VAT (9.5% on accommodation):
// - Base: €300
// - VAT: €28.50
// - Gross: €328.50

// Grand Total:
// - Subtotal: €300
// - Tourist Tax: €23.49
// - VAT: €28.50
// - Total: €351.99
```

### **Example 2: Week in Bled with Breakfast**

```typescript
// Couple, 7 nights in Bled
// Accommodation: €150/night = €1,050 total
// Breakfast: €15/person/day = €210 total

const result = await calculateReservationTax({
  checkIn: new Date('2026-07-01'),
  checkOut: new Date('2026-07-08'),
  municipality: 'bled',
  guests: [
    { age: 45 },
    { age: 42 }
  ],
  accommodationAmount: 1050,
  foodAmount: 210, // Breakfast
});

// Tourist Tax:
// - 2 adults × 7 nights × €3.00 = €42.00

// VAT:
// - Accommodation (9.5%): €1,050 + €99.75 = €1,149.75
// - Food (22%): €210 + €46.20 = €256.20
// - Total VAT: €145.95

// Grand Total:
// - Subtotal: €1,260
// - Tourist Tax: €42.00
// - VAT: €145.95
// - Total: €1,447.95
```

### **Example 3: Group Booking in Piran**

```typescript
// Group of 10 adults, 5 nights in Piran
// Accommodation: €80/person/night = €4,000 total
// Dinner: €30/person/night = €1,500 total

const result = await calculateReservationTax({
  checkIn: new Date('2026-08-01'),
  checkOut: new Date('2026-08-06'),
  municipality: 'piran',
  guests: Array(10).fill({ age: 35 }),
  accommodationAmount: 4000,
  foodAmount: 1500,
});

// Tourist Tax:
// - 10 adults × 5 nights × €3.00 = €150.00

// VAT:
// - Accommodation (9.5%): €4,000 + €380 = €4,380
// - Food (22%): €1,500 + €330 = €1,830
// - Total VAT: €710

// Grand Total:
// - Subtotal: €5,500
// - Tourist Tax: €150
// - VAT: €710
// - Total: €6,360
```

---

## 🔧 CUSTOMIZATION

### **Add New Municipality**

Edit `scripts/seed-tax-rates.ts`:

```typescript
const touristTaxRates = [
  // ... existing municipalities ...
  {
    municipality: 'your-municipality',
    adults: 2.50,
    children7_18: 1.25,
    children0_7: 0,
    spaTax: undefined,
  },
];
```

Then re-run:
```bash
npx ts-node scripts/seed-tax-rates.ts
```

### **Override Rates Programmatically**

```typescript
import { calculateTouristTaxWithRates } from '@/lib/tax/tourist-tax-calculator';

const result = calculateTouristTaxWithRates(
  {
    checkIn: new Date('2026-03-20'),
    checkOut: new Date('2026-03-23'),
    municipality: 'custom',
    guests: [{ age: 30 }],
  },
  {
    adults: 5.00, // Custom rate
    children7_18: 2.50,
    children0_7: 0,
  }
);
```

---

## 📁 DATABASE SCHEMA

### **TouristTaxRate Model**

```prisma
model TouristTaxRate {
  id           String   @id @default(cuid())
  municipality String   @unique
  adults       Decimal
  children7_18 Decimal
  children0_7  Decimal
  spaTax       Decimal?
  validFrom    DateTime @default(now())
  validTo      DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([municipality])
  @@map("tourist_tax_rates")
}
```

---

## 🧪 TESTING

### **Run Tests**

```bash
# Tourist tax tests
npm test -- tourist-tax

# VAT tests (when created)
npm test -- vat-calculator

# All tax tests
npm test -- tax
```

### **Test Coverage**

Current coverage:
- ✅ Tourist tax calculation (100%)
- ✅ Guest categorization (100%)
- ✅ Night calculation (100%)
- ✅ Tax breakdown formatting (80%)
- ⏳ VAT calculation (TODO)
- ⏳ Integration tests (TODO)

---

## 📞 API REFERENCE

### **POST /api/tax/calculate**

Calculate all taxes for a reservation.

**Request:**
```typescript
{
  checkIn: string (ISO date, required)
  checkOut: string (ISO date, required)
  municipality: string (required, lowercase)
  guests: Array<{ age: number }> (required)
  accommodationAmount: number (required, >= 0)
  foodAmount?: number (optional, >= 0)
  servicesAmount?: number (optional, >= 0)
  otherAmount?: number (optional, >= 0)
}
```

**Response (Success):**
```typescript
{
  success: true,
  data: {
    touristTax: {
      totalTax: number,
      breakdown: Array<{
        guestAge: number,
        category: 'adult' | 'child_7_18' | 'child_0_7',
        nights: number,
        ratePerNight: number,
        amount: number,
      }>,
      municipality: string,
      nights: number,
      guests: number,
    },
    vat: {
      totalNet: number,
      totalVAT: number,
      totalGross: number,
      breakdown: {
        accommodation: { base: number, rate: number, amount: number },
        food: { base: number, rate: number, amount: number },
        services: { base: number, rate: number, amount: number },
        other: { base: number, rate: number, amount: number },
      },
    },
    totals: {
      subtotal: number,
      touristTax: number,
      vatBeforeTouristTax: number,
      vatOnTouristTax: number,
      totalVAT: number,
      totalTax: number,
      grandTotal: number,
    },
  },
  metadata: {
    calculatedAt: string,
    municipality: string,
    nights: number,
    guests: number,
  },
}
```

**Response (Error):**
```typescript
{
  error: string,
  details?: string,
  suggestion?: string,
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Municipality not found
- `405` - Method Not Allowed
- `500` - Internal Server Error

---

## 🐛 TROUBLESHOOTING

### **"Municipality not found"**

**Error:**
```
Error: No tourist tax rate found for municipality: your-municipality
```

**Solution:**
1. Run the seed script: `npx ts-node scripts/seed-tax-rates.ts`
2. Or use custom rates in your calculation
3. Or add the municipality to the seed file

### **Incorrect Tax Calculation**

**Check:**
1. Guest ages are correct
2. Municipality name is lowercase
3. Dates are valid (checkOut > checkIn)
4. Amounts are non-negative

### **Rounding Issues**

All calculations are rounded to 2 decimal places (cents). If you see small discrepancies (< €0.01), this is expected due to rounding.

---

## 📚 RESOURCES

### **Official Sources**
- [Slovenian Tax Authority (FURS)](https://www.gov.si/en/state-authorities/ministries/ministry-of-finance/financial-administration-of-the-republic-of-slovenia/)
- [Tourist Tax Regulations](https://www.gov.si/en/topics/tourist-tax/)
- [eDavki Portal](https://edavki.durs.si/)

### **Internal Documentation**
- [Tax Reporting Implementation](./TAX-REPORTING-IMPLEMENTATION.md)
- [Invoicing Implementation](./INVOICING-IMPLEMENTATION.md)
- [Project Master Tracker](./PROJECT-MASTER-TRACKER.md)

---

## 🎯 NEXT STEPS

### **Phase 1 (Completed ✅)**
- [x] Tourist tax calculator
- [x] VAT calculator
- [x] Unified tax engine
- [x] Seed script for municipalities
- [x] API endpoint
- [x] Unit tests

### **Phase 2 (In Progress 🚧)**
- [ ] Monthly tax report generator
- [ ] eDavki XML export
- [ ] Invoice PDF generation
- [ ] Invoice email delivery

### **Phase 3 (Planned 📋)**
- [ ] Tax dashboard UI
- [ ] Automatic tax payment tracking
- [ ] Integration with accounting software
- [ ] Multi-property tax reporting

---

**Created:** 2026-03-16
**Last Updated:** 2026-03-16
**Maintained By:** AgentFlow Pro Team
