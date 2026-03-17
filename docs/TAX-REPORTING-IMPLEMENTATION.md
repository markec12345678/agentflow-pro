# 🇸🇮 SLOVENIAN TAX REPORTING SYSTEM - IMPLEMENTATION PLAN

**Priority:** P0 - Critical for Production
**Timeline:** Weeks 2-3 (2026-03-23 to 2026-04-05)
**Complexity:** Medium
**Regulatory:** Slovenian Tax Authority (eDavki)

---

## 📋 OVERVIEW

### **What We're Building**

A complete tax reporting system for Slovenian hospitality businesses that:
1. ✅ Calculates tourist tax automatically by municipality
2. ✅ Calculates VAT (DDV) on reservations
3. ✅ Generates monthly tax reports
4. ✅ Exports data for eDavki submission
5. ✅ Creates tax-compliant invoices

### **Why It's Critical**

- **Legal Requirement:** All Slovenian properties MUST collect and remit tourist tax
- **Fines:** Non-compliance can result in €500-€5,000 fines
- **Customer Expectation:** Guests expect transparent tax calculation
- **Accounting:** Required for monthly VAT returns

---

## 🎯 REQUIREMENTS

### **1. Tourist Tax Calculation**

**Rules by Municipality (2026 rates):**

| Municipality | Rate (€/person/night) | Notes |
|--------------|----------------------|-------|
| **Ljubljana** | 3.13 | Standard rate |
| **Bled** | 3.00 | Standard rate |
| **Piran** | 3.00 | Coastal region |
| **Portorož** | 3.00 | Coastal region |
| **Koper** | 2.50 | Coastal region |
| **Kranjska Gora** | 2.50 | Mountain region |
| **Bohinj** | 2.50 | Mountain region |
| **Radovljica** | 2.50 | Mountain region |
| **Other municipalities** | 1.50-2.50 | Default rate |

**Special Rates:**
- Children 7-18 years: 50% discount
- Children under 7: Free
- Groups (10+ people): Negotiable rates

**Implementation Requirements:**
```typescript
interface TouristTaxRate {
  municipality: string;
  rateAdult: number;      // Per person per night
  rateChild: number;      // 50% discount
  rateInfant: number;     // Free (0)
  effectiveFrom: Date;
  effectiveTo?: Date;
}

interface Guest {
  age: number;
  isResident?: boolean;   // EU residents may have different rates
}

interface Reservation {
  checkIn: Date;
  checkOut: Date;
  guests: Guest[];
  municipality: string;
}

function calculateTouristTax(reservation: Reservation, rate: TouristTaxRate): number {
  // Calculate number of nights
  const nights = (reservation.checkOut - reservation.checkIn) / (1000 * 60 * 60 * 24);
  
  // Calculate per guest
  let totalTax = 0;
  for (const guest of reservation.guests) {
    if (guest.age < 7) {
      // Free
      continue;
    } else if (guest.age < 18) {
      // 50% discount
      totalTax += rate.rateChild * nights;
    } else {
      // Full rate
      totalTax += rate.rateAdult * nights;
    }
  }
  
  return totalTax;
}
```

---

### **2. VAT (DDV) Calculation**

**Slovenian VAT Rates for Hospitality:**

| Service Type | VAT Rate | Notes |
|-------------|----------|-------|
| **Accommodation** | 9.5% | Reduced rate for hotels, guesthouses |
| **Breakfast** | 9.5% | If included in accommodation |
| **Other meals** | 22% | Standard rate for restaurant services |
| **Extra services** | 22% | Spa, transfers, tours |

**Implementation:**
```typescript
enum VATRate {
  ACCOMMODATION = 0.095,  // 9.5%
  FOOD_STANDARD = 0.22,   // 22%
  SERVICES = 0.22,        // 22%
}

interface TaxableItem {
  description: string;
  amount: number;         // Net amount (without VAT)
  vatRate: VATRate;
  vatAmount: number;      // Calculated VAT
  grossAmount: number;    // Amount with VAT
}

function calculateVAT(item: TaxableItem): TaxableItem {
  const vatAmount = item.amount * item.vatRate;
  const grossAmount = item.amount + vatAmount;
  
  return {
    ...item,
    vatAmount,
    grossAmount,
  };
}

function calculateTotalVAT(items: TaxableItem[]): {
  totalNet: number;
  totalVAT: number;
  totalGross: number;
} {
  const totalNet = items.reduce((sum, item) => sum + item.amount, 0);
  const totalVAT = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalGross = items.reduce((sum, item) => sum + item.grossAmount, 0);
  
  return { totalNet, totalVAT, totalGross };
}
```

---

### **3. Monthly Tax Report**

**Report Structure:**

```typescript
interface MonthlyTaxReport {
  month: number;          // 1-12
  year: number;
  property: {
    name: string;
    taxNumber: string;    // Davčna številka
    address: string;
  };
  
  // Tourist Tax Summary
  touristTax: {
    totalNights: number;
    totalGuests: number;
    totalTaxCollected: number;
    byMunicipality: Array<{
      municipality: string;
      nights: number;
      guests: number;
      taxAmount: number;
    }>;
  };
  
  // VAT Summary
  vat: {
    accommodation: {
      taxableBase: number;
      vatRate: number;    // 9.5%
      vatAmount: number;
    };
    food: {
      taxableBase: number;
      vatRate: number;    // 22%
      vatAmount: number;
    };
    services: {
      taxableBase: number;
      vatRate: number;    // 22%
      vatAmount: number;
    };
    total: {
      taxableBase: number;
      vatAmount: number;
    };
  };
  
  // Totals
  totals: {
    totalRevenue: number;
    totalTouristTax: number;
    totalVAT: number;
    totalToRemit: number;  // Tourist tax + VAT
  };
  
  // eDavki submission
  edavki: {
    formType: string;     // DDV-O, TUR-1
    submissionDeadline: Date;
    paymentDeadline: Date;
    xmlExport?: string;   // XML for eDavki
  };
}
```

---

## 🏗️ DATABASE SCHEMA

### **Prisma Schema Updates**

```prisma
// Tourist Tax Rates by Municipality
model TouristTaxRate {
  id              String   @id @default(cuid())
  municipality    String   @unique
  rateAdult       Decimal  @db.Decimal(10, 2)
  rateChild       Decimal  @db.Decimal(10, 2)
  rateInfant      Decimal  @db.Decimal(10, 2) @default(0)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  reservations    Reservation[]
}

// Guest Information for Tax Calculation
model Guest {
  id              String   @id @default(cuid())
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  nationality     String?
  isEUResident    Boolean  @default(true)
  
  reservations    Reservation[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Enhanced Reservation with Tax Data
model Reservation {
  id              String   @id @default(cuid())
  
  // ... existing fields ...
  
  // Tax Calculation
  touristTaxAmount    Decimal  @db.Decimal(10, 2) @default(0)
  vatAmount           Decimal  @db.Decimal(10, 2) @default(0)
  totalWithTax        Decimal  @db.Decimal(10, 2)
  
  // Tax Breakdown (JSON for flexibility)
  taxBreakdown        Json?    // { touristTax: ..., vat: ..., items: [...] }
  
  // Tax Reporting
  taxReported         Boolean  @default(false)
  taxReportMonth      Int?
  taxReportYear       Int?
  taxPaid             Boolean  @default(false)
  taxPaidDate         DateTime?
  
  // Relations
  guests              Guest[]
  touristTaxRate      TouristTaxRate? @relation(fields: [touristTaxRateId], references: [id])
  touristTaxRateId    String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([taxReportMonth, taxReportYear])
  @@index([taxReported])
}

// Tax Report Model (Monthly Summary)
model TaxReport {
  id              String   @id @default(cuid())
  month           Int
  year            Int
  
  // Property Info
  propertyId      String
  property        Property @relation(fields: [propertyId], references: [id])
  
  // Tourist Tax Summary
  totalNights     Int
  totalGuests     Int
  totalTouristTax Decimal  @db.Decimal(10, 2)
  
  // VAT Summary
  vatAccommodationBase   Decimal @db.Decimal(10, 2) @default(0)
  vatAccommodationAmount Decimal @db.Decimal(10, 2) @default(0)
  vatFoodBase           Decimal @db.Decimal(10, 2) @default(0)
  vatFoodAmount         Decimal @db.Decimal(10, 2) @default(0)
  vatServicesBase       Decimal @db.Decimal(10, 2) @default(0)
  vatServicesAmount     Decimal @db.Decimal(10, 2) @default(0)
  totalVATBase          Decimal @db.Decimal(10, 2) @default(0)
  totalVATAmount        Decimal @db.Decimal(10, 2) @default(0)
  
  // Totals
  totalRevenue          Decimal @db.Decimal(10, 2)
  totalToRemit          Decimal @db.Decimal(10, 2)
  
  // eDavki Submission
  edavkiFormType        String?
  edavkiSubmitted       Boolean @default(false)
  edavkiSubmittedDate   DateTime?
  edavkiReference       String?
  
  // Payment
  taxPaid               Boolean @default(false)
  taxPaidDate           DateTime?
  taxPaidAmount         Decimal? @db.Decimal(10, 2)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([month, year, propertyId])
  @@index([year, month])
}

// Invoice Model
model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique  // Format: YYYY-XXXX
  
  // Property
  propertyId      String
  property        Property @relation(fields: [propertyId], references: [id])
  
  // Guest/Customer
  guestName       String
  guestAddress    String
  guestTaxNumber  String?  // For business guests
  
  // Reservation Link
  reservationId   String?
  reservation     Reservation? @relation(fields: [reservationId], references: [id])
  
  // Invoice Items
  items           Json     // Array of invoice items
  
  // Amounts
  subtotal        Decimal  @db.Decimal(10, 2)
  touristTax      Decimal  @db.Decimal(10, 2) @default(0)
  vatAmount       Decimal  @db.Decimal(10, 2) @default(0)
  total           Decimal  @db.Decimal(10, 2)
  
  // Status
  status          InvoiceStatus @default(DRAFT)
  issuedDate      DateTime @default(now())
  dueDate         DateTime
  
  // Payment
  paid            Boolean  @default(false)
  paidDate        DateTime?
  paymentMethod   String?
  
  // PDF
  pdfUrl          String?
  pdfGenerated    Boolean  @default(false)
  
  // eDavki
  reportedToTax   Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status])
  @@index([issuedDate])
  @@index([propertyId, issuedDate])
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  SENT
  PAID
  CANCELLED
  OVERDUE
}
```

---

## 🔧 IMPLEMENTATION PLAN

### **Week 2 (2026-03-23 to 2026-03-29)**

#### **Day 1-2: Database Setup**
```bash
# Tasks:
□ Create Prisma migration for tax models
□ Seed tourist tax rates for Slovenian municipalities
□ Add tax fields to Reservation model
□ Create TaxReport and Invoice models
□ Run migration
```

**Files to Create/Modify:**
- `prisma/schema.prisma` (add TaxReport, Invoice, Guest, TouristTaxRate)
- `prisma/migrations/XXXX_add_tax_system/migration.sql`
- `scripts/seed-tax-rates.ts` (seed Slovenian municipality rates)

---

#### **Day 3-4: Tax Calculation Engine**

**Files to Create:**
- `src/lib/tax/tourist-tax-calculator.ts`
- `src/lib/tax/vat-calculator.ts`
- `src/lib/tax/tax-engine.ts`

**Implementation:**
```typescript
// src/lib/tax/tourist-tax-calculator.ts

import { prisma } from '@/lib/prisma';

interface GuestInput {
  age: number;
  isEUResident?: boolean;
}

interface ReservationInput {
  checkIn: Date;
  checkOut: Date;
  municipality: string;
  guests: GuestInput[];
}

export async function calculateTouristTax(
  reservation: ReservationInput
): Promise<{
  totalTax: number;
  breakdown: Array<{
    guestAge: number;
    nights: number;
    rate: number;
    amount: number;
  }>;
}> {
  // Get tax rate for municipality
  const taxRate = await prisma.touristTaxRate.findFirst({
    where: {
      municipality: reservation.municipality,
      isActive: true,
      effectiveFrom: { lte: new Date() },
    },
  });
  
  if (!taxRate) {
    throw new Error(`No tourist tax rate found for ${reservation.municipality}`);
  }
  
  const nights = Math.ceil(
    (reservation.checkOut.getTime() - reservation.checkIn.getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  const breakdown = [];
  let totalTax = 0;
  
  for (const guest of reservation.guests) {
    let rate: number;
    
    if (guest.age < 7) {
      rate = 0; // Free
    } else if (guest.age < 18) {
      rate = Number(taxRate.rateChild);
    } else {
      rate = Number(taxRate.rateAdult);
    }
    
    const amount = rate * nights;
    totalTax += amount;
    
    breakdown.push({
      guestAge: guest.age,
      nights,
      rate,
      amount,
    });
  }
  
  return {
    totalTax,
    breakdown,
  };
}
```

```typescript
// src/lib/tax/vat-calculator.ts

export enum VATRate {
  ACCOMMODATION = 0.095,  // 9.5%
  FOOD = 0.22,            // 22%
  SERVICES = 0.22,        // 22%
}

interface VATItem {
  description: string;
  amount: number;
  vatRate: VATRate;
}

export function calculateVAT(items: VATItem[]): {
  items: Array<VATItem & { vatAmount: number; grossAmount: number }>;
  totalNet: number;
  totalVAT: number;
  totalGross: number;
} {
  const processedItems = items.map(item => {
    const vatAmount = item.amount * item.vatRate;
    const grossAmount = item.amount + vatAmount;
    
    return {
      ...item,
      vatAmount,
      grossAmount,
    };
  });
  
  const totalNet = processedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalVAT = processedItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalGross = processedItems.reduce((sum, item) => sum + item.grossAmount, 0);
  
  return {
    items: processedItems,
    totalNet,
    totalVAT,
    totalGross,
  };
}

export function calculateReservationVAT(
  accommodationAmount: number,
  foodAmount: number = 0,
  servicesAmount: number = 0
): {
  accommodation: { base: number; rate: number; amount: number };
  food: { base: number; rate: number; amount: number };
  services: { base: number; rate: number; amount: number };
  totals: { base: number; vat: number; gross: number };
} {
  const accommodation = {
    base: accommodationAmount,
    rate: VATRate.ACCOMMODATION,
    amount: accommodationAmount * VATRate.ACCOMMODATION,
  };
  
  const food = {
    base: foodAmount,
    rate: VATRate.FOOD,
    amount: foodAmount * VATRate.FOOD,
  };
  
  const services = {
    base: servicesAmount,
    rate: VATRate.SERVICES,
    amount: servicesAmount * VATRate.SERVICES,
  };
  
  const baseTotal = accommodation.base + food.base + services.base;
  const vatTotal = accommodation.amount + food.amount + services.amount;
  
  return {
    accommodation,
    food,
    services,
    totals: {
      base: baseTotal,
      vat: vatTotal,
      gross: baseTotal + vatTotal,
    },
  };
}
```

---

#### **Day 5-6: API Endpoints**

**Files to Create:**
- `src/pages/api/tax/calculate.ts`
- `src/pages/api/tax/reports/monthly.ts`
- `src/pages/api/tax/reports/export.ts`

```typescript
// src/pages/api/tax/calculate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { calculateTouristTax } from '@/lib/tax/tourist-tax-calculator';
import { calculateReservationVAT } from '@/lib/tax/vat-calculator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const {
      checkIn,
      checkOut,
      municipality,
      guests,
      accommodationAmount,
      foodAmount,
      servicesAmount,
    } = req.body;
    
    // Calculate tourist tax
    const touristTaxResult = await calculateTouristTax({
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      municipality,
      guests,
    });
    
    // Calculate VAT
    const vatResult = calculateReservationVAT(
      accommodationAmount,
      foodAmount,
      servicesAmount
    );
    
    // Total calculation
    const totalWithoutTax = vatResult.totals.base;
    const totalTax = touristTaxResult.totalTax + vatResult.totals.vat;
    const totalWithTax = vatResult.totals.gross + touristTaxResult.totalTax;
    
    return res.status(200).json({
      success: true,
      data: {
        touristTax: {
          total: touristTaxResult.totalTax,
          breakdown: touristTaxResult.breakdown,
        },
        vat: vatResult,
        totals: {
          subtotal: totalWithoutTax,
          touristTax: touristTaxResult.totalTax,
          vat: vatResult.totals.vat,
          total: totalWithTax,
        },
      },
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate tax',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

#### **Day 7: Testing**

**Test Files:**
- `tests/tax/tourist-tax.test.ts`
- `tests/tax/vat-calculator.test.ts`
- `tests/tax/tax-api.test.ts`

---

### **Week 3 (2026-03-30 to 2026-04-05)**

#### **Day 1-2: Monthly Report Generation**

**Files to Create:**
- `src/lib/tax/monthly-report-generator.ts`
- `src/pages/api/tax/reports/generate.ts`

```typescript
// src/lib/tax/monthly-report-generator.ts

import { prisma } from '@/lib/prisma';

export async function generateMonthlyTaxReport(
  propertyId: string,
  month: number,
  year: number
) {
  // Get all reservations for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkIn: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        { taxReported: false },
        { taxReportMonth: month, taxReportYear: year },
      ],
    },
    include: {
      guests: true,
    },
  });
  
  // Aggregate tourist tax
  let totalNights = 0;
  let totalGuests = 0;
  let totalTouristTax = 0;
  
  // Aggregate VAT
  let vatAccommodationBase = 0;
  let vatAccommodationAmount = 0;
  let vatFoodBase = 0;
  let vatFoodAmount = 0;
  let vatServicesBase = 0;
  let vatServicesAmount = 0;
  
  for (const reservation of reservations) {
    // Count nights and guests
    const nights = Math.ceil(
      (new Date(reservation.checkOut).getTime() - 
       new Date(reservation.checkIn).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    totalNights += nights;
    totalGuests += reservation.guests.length;
    totalTouristTax += Number(reservation.touristTaxAmount);
    
    // Parse tax breakdown for VAT
    const breakdown = reservation.taxBreakdown as any;
    if (breakdown?.vat) {
      vatAccommodationBase += Number(breakdown.vat.accommodation?.base || 0);
      vatAccommodationAmount += Number(breakdown.vat.accommodation?.amount || 0);
      vatFoodBase += Number(breakdown.vat.food?.base || 0);
      vatFoodAmount += Number(breakdown.vat.food?.amount || 0);
      vatServicesBase += Number(breakdown.vat.services?.base || 0);
      vatServicesAmount += Number(breakdown.vat.services?.amount || 0);
    }
  }
  
  const totalVATBase = vatAccommodationBase + vatFoodBase + vatServicesBase;
  const totalVATAmount = vatAccommodationAmount + vatFoodAmount + vatServicesAmount;
  const totalRevenue = totalVATBase + totalTouristTax;
  const totalToRemit = totalTouristTax + totalVATAmount;
  
  // Create or update tax report
  const taxReport = await prisma.taxReport.upsert({
    where: {
      month_year_propertyId: {
        month,
        year,
        propertyId,
      },
    },
    update: {
      totalNights,
      totalGuests,
      totalTouristTax,
      vatAccommodationBase,
      vatAccommodationAmount,
      vatFoodBase,
      vatFoodAmount,
      vatServicesBase,
      vatServicesAmount,
      totalVATBase,
      totalVATAmount,
      totalRevenue,
      totalToRemit,
    },
    create: {
      month,
      year,
      propertyId,
      totalNights,
      totalGuests,
      totalTouristTax,
      vatAccommodationBase,
      vatAccommodationAmount,
      vatFoodBase,
      vatFoodAmount,
      vatServicesBase,
      vatServicesAmount,
      totalVATBase,
      totalVATAmount,
      totalRevenue,
      totalToRemit,
    },
  });
  
  // Mark reservations as reported
  await prisma.reservation.updateMany({
    where: {
      propertyId,
      checkIn: {
        gte: startDate,
        lte: endDate,
      },
      taxReported: false,
    },
    data: {
      taxReported: true,
      taxReportMonth: month,
      taxReportYear: year,
    },
  });
  
  return taxReport;
}
```

---

#### **Day 3-4: Invoice Generation (PDF)**

**Dependencies:**
```bash
npm install @react-pdf/renderer
```

**Files to Create:**
- `src/components/invoices/invoice-pdf.tsx`
- `src/pages/api/invoices/generate.ts`
- `src/pages/api/invoices/create.ts`

```typescript
// src/components/invoices/invoice-pdf.tsx

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { marginBottom: 20, borderBottom: 2, paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold' },
  invoiceInfo: { marginTop: 10 },
  section: { marginTop: 20, marginBottom: 10 },
  table: { marginTop: 10 },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#000',
    paddingBottom: 5,
  },
  tableHeader: { fontWeight: 'bold' },
  totals: { marginTop: 20, textAlign: 'right' },
  footer: { 
    marginTop: 40, 
    paddingTop: 10, 
    borderTop: 1, 
    fontSize: 10,
    textAlign: 'center',
  },
});

interface InvoiceData {
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  property: {
    name: string;
    address: string;
    taxNumber: string;
  };
  guest: {
    name: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totals: {
    subtotal: number;
    touristTax: number;
    vat: number;
    total: number;
  };
}

export const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RAČUN / INVOICE</Text>
        <Text style={styles.invoiceInfo}>
          Številka: {data.invoiceNumber}
        </Text>
        <Text style={styles.invoiceInfo}>
          Datum izdaje: {data.issuedDate}
        </Text>
        <Text style={styles.invoiceInfo}>
          Datum zapadlosti: {data.dueDate}
        </Text>
      </View>
      
      {/* Property Info */}
      <View style={styles.section}>
        <Text style={styles.tableHeader}>Izdajatelj / Issuer:</Text>
        <Text>{data.property.name}</Text>
        <Text>{data.property.address}</Text>
        <Text>Davčna št.: {data.property.taxNumber}</Text>
      </View>
      
      {/* Guest Info */}
      <View style={styles.section}>
        <Text style={styles.tableHeader}>Kupec / Customer:</Text>
        <Text>{data.guest.name}</Text>
        <Text>{data.guest.address}</Text>
      </View>
      
      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Opis</Text>
          <Text style={styles.tableHeader}>Kol</Text>
          <Text style={styles.tableHeader}>Cena</Text>
          <Text style={styles.tableHeader}>Znesek</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text>{item.description}</Text>
            <Text>{item.quantity}</Text>
            <Text>{item.unitPrice.toFixed(2)} €</Text>
            <Text>{item.amount.toFixed(2)} €</Text>
          </View>
        ))}
      </View>
      
      {/* Totals */}
      <View style={styles.totals}>
        <Text>Medvsota: {data.totals.subtotal.toFixed(2)} €</Text>
        <Text>Turistična taksa: {data.totals.touristTax.toFixed(2)} €</Text>
        <Text>DDV (9.5%): {data.totals.vat.toFixed(2)} €</Text>
        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
          Skupaj: {data.totals.total.toFixed(2)} €
        </Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text>Hvala za vaše gostovanje! / Thank you for your stay!</Text>
      </View>
    </Page>
  </Document>
);
```

---

#### **Day 5: eDavki Export**

**Files to Create:**
- `src/lib/tax/edavki-export.ts`
- `src/pages/api/tax/reports/edavki-export.ts`

```typescript
// src/lib/tax/edavki-export.ts

import { xmlbuilder } from 'xmlbuilder';

interface TaxReportData {
  property: {
    taxNumber: string;
    name: string;
    address: string;
  };
  month: number;
  year: number;
  touristTax: {
    totalNights: number;
    totalGuests: number;
    totalAmount: number;
  };
  vat: {
    accommodation: { base: number; amount: number };
    food: { base: number; amount: number };
    services: { base: number; amount: number };
  };
}

export function generateTUR1XML(data: TaxReportData): string {
  const xml = xmlbuilder.create('Tur1', { encoding: 'UTF-8' });
  
  // Header
  xml.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
  xml.att('verzija', '1.0');
  
  // Property info
  const taxpayer = xml.ele('Zavezanec');
  taxpayer.ele('DavcnaSt', data.property.taxNumber);
  taxpayer.ele('Naziv', data.property.name);
  taxpayer.ele('Naslov', data.property.address);
  
  // Reporting period
  const period = xml.ele('Obdobje');
  period.ele('Mesec', data.month.toString());
  period.ele('Leto', data.year.toString());
  
  // Tourist tax
  const touristTax = xml.ele('TuristicnaTaksa');
  touristTax.ele('SteviloNocitev', data.touristTax.totalNights.toString());
  touristTax.ele('SteviloOseb', data.touristTax.totalGuests.toString());
  touristTax.ele('Znesek', data.touristTax.totalAmount.toFixed(2));
  
  // VAT
  const vat = xml.ele('DDV');
  
  const accommodation = vat.ele('Stopnja95');
  accommodation.ele('Osnova', data.vat.accommodation.base.toFixed(2));
  accommodation.ele('Davek', data.vat.accommodation.amount.toFixed(2));
  
  const food = vat.ele('Stopnja22');
  food.ele('Osnova', data.vat.food.base.toFixed(2));
  food.ele('Davek', data.vat.food.amount.toFixed(2));
  
  const services = vat.ele('Stopnja22Storitve');
  services.ele('Osnova', data.vat.services.base.toFixed(2));
  services.ele('Davek', data.vat.services.amount.toFixed(2));
  
  return xml.end({ pretty: true });
}
```

---

#### **Day 6-7: Testing & Documentation**

**Test Files:**
- `tests/tax/monthly-report.test.ts`
- `tests/tax/invoice-generation.test.ts`
- `tests/tax/edavki-export.test.ts`

**Documentation:**
- `docs/TAX-SYSTEM-GUIDE.md`
- `docs/EDAVKI-SUBMISSION-GUIDE.md`

---

## 📊 UI COMPONENTS

### **Tax Dashboard Widget**

```typescript
// src/components/dashboard/tax-widget.tsx

export function TaxWidget({ propertyId }: { propertyId: string }) {
  const [taxData, setTaxData] = useState<{
    currentMonthTouristTax: number;
    currentMonthVAT: number;
    pendingReports: number;
    nextDeadline: Date;
  } | null>(null);
  
  useEffect(() => {
    // Fetch tax data
    fetch(`/api/tax/dashboard?propertyId=${propertyId}`)
      .then(res => res.json())
      .then(data => setTaxData(data));
  }, [propertyId]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Davki / Taxes</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Turistična taksa (ta mesec)</p>
          <p className="text-2xl font-bold">
            {taxData?.currentMonthTouristTax.toFixed(2) || '0.00'} €
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">DDV (ta mesec)</p>
          <p className="text-2xl font-bold">
            {taxData?.currentMonthVAT.toFixed(2) || '0.00'} €
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">Nepredložena poročila</p>
        <p className="text-xl font-semibold text-orange-600">
          {taxData?.pendingReports || 0}
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">Naslednji rok</p>
        <p className="text-lg font-medium">
          {taxData?.nextDeadline 
            ? new Date(taxData.nextDeadline).toLocaleDateString('sl-SI')
            : 'Ni rokov'}
        </p>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button 
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => window.location.href = '/dashboard/tax/reports'}
        >
          Ustvari poročilo
        </button>
        
        <button 
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => window.location.href = '/dashboard/invoices'}
        >
          Izdaj račun
        </button>
      </div>
    </div>
  );
}
```

---

### **Tax Reports Page**

```typescript
// src/pages/dashboard/tax/reports.tsx

export default function TaxReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/tax/reports')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      });
  }, []);
  
  const handleGenerateReport = async (month: number, year: number) => {
    const res = await fetch('/api/tax/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    
    if (res.ok) {
      alert('Poročilo ustvarjeno!');
      // Refresh reports
    }
  };
  
  const handleExportEDavki = async (reportId: string) => {
    const res = await fetch(`/api/tax/reports/edavki-export?id=${reportId}`);
    const blob = await res.blob();
    
    // Download XML
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tur1-${reportId}.xml`;
    a.click();
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Davčna poročila</h1>
      
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Obdobje</th>
            <th className="px-4 py-2">Turistična taksa</th>
            <th className="px-4 py-2">DDV</th>
            <th className="px-4 py-2">Skupaj</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Akcije</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id} className="border-t">
              <td className="px-4 py-2">
                {report.month}.{report.year}
              </td>
              <td className="px-4 py-2">
                {report.totalTouristTax.toFixed(2)} €
              </td>
              <td className="px-4 py-2">
                {report.totalVATAmount.toFixed(2)} €
              </td>
              <td className="px-4 py-2 font-bold">
                {report.totalToRemit.toFixed(2)} €
              </td>
              <td className="px-4 py-2">
                {report.edavkiSubmitted ? (
                  <span className="text-green-600">✓ Predloženo</span>
                ) : (
                  <span className="text-orange-600">⚠ Nepredloženo</span>
                )}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleGenerateReport(report.month, report.year)}
                  className="text-blue-600 hover:underline mr-2"
                >
                  Generiraj
                </button>
                
                <button
                  onClick={() => handleExportEDavki(report.id)}
                  className="text-green-600 hover:underline"
                >
                  Izvozi za eDavki
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## ✅ TESTING CHECKLIST

### **Unit Tests**
```
□ Tourist tax calculation (all age groups)
□ Tourist tax calculation (all municipalities)
□ VAT calculation (all rates)
□ Monthly report generation
□ Invoice PDF generation
□ eDavki XML export
```

### **Integration Tests**
```
□ Reservation creation with tax calculation
□ Tax report API endpoint
□ Invoice generation API
□ eDavki export API
```

### **E2E Tests**
```
□ Create reservation → Verify tax calculation
□ Generate monthly report → Verify totals
□ Generate invoice PDF → Download and verify
□ Export to eDavki → Validate XML schema
```

---

## 📚 DOCUMENTATION

### **User Guide Sections**

1. **Tourist Tax Setup**
   - How to configure municipality rates
   - How to add custom rates
   - How to update rates annually

2. **Tax Calculation**
   - How tax is calculated for reservations
   - Age-based discounts
   - Group discounts

3. **Monthly Reporting**
   - How to generate monthly reports
   - Reviewing report data
   - Submitting to eDavki

4. **Invoice Generation**
   - Creating invoices
   - Customizing invoice templates
   - Sending invoices to guests

5. **eDavki Submission**
   - Exporting XML files
   - Uploading to eDavki portal
   - Tracking submission status

---

## 🎯 SUCCESS CRITERIA

**Tax System Complete When:**
```
✅ Tourist tax calculated automatically for all reservations
✅ VAT calculated correctly (9.5% accommodation, 22% other)
✅ Monthly tax reports generated
✅ Invoice PDF generation working
✅ eDavki XML export functional
✅ All tests passing (unit, integration, E2E)
✅ User documentation complete
✅ Pilot properties trained on system
```

---

## 📞 SUPPORT RESOURCES

### **Slovenian Tax Authority**
- **Portal:** https://edavki.durs.si/
- **Tourist Tax Law:** Zakon o turistični taksi
- **VAT Law:** Zakon o davku na dodano vrednost (DDV)

### **Contact**
- **FURS (Financial Administration):** +386 1 47 47 400
- **Email:** fu.info@gov.si

---

**Implementation Timeline:** 2026-03-23 to 2026-04-05
**Status:** Ready to Start
**Priority:** P0 - Critical
