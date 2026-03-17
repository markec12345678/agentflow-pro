# 🚀 TAX & INVOICING SYSTEM - SETUP GUIDE

**Status:** ✅ Ready to Deploy
**Created:** 2026-03-16
**Version:** 1.0

---

## 📋 PREREQUISITES

Before setting up the tax and invoicing system, ensure you have:

- ✅ Node.js 18+ installed
- ✅ PostgreSQL database running
- ✅ Prisma configured
- ✅ Next.js project setup
- ✅ Environment variables configured

---

## 🔧 STEP-BY-STEP SETUP

### **Step 1: Install Dependencies**

```bash
# Install PDF generation
npm install @react-pdf/renderer

# Install email service
npm install resend @react-email/components @react-email/render

# Install Prisma (if not already installed)
npm install prisma @prisma/client --save-dev
```

---

### **Step 2: Seed Tax Rates**

Populate database with Slovenian municipality tax rates:

```bash
npx ts-node scripts/seed-tax-rates.ts
```

**Expected Output:**
```
🌱 Seeding Slovenian Tourist Tax Rates...

✓ Created: ljubljana - €3.13/adult
✓ Created: bled - €3.00/adult
✓ Created: piran - €3.00/adult
...

============================================================
✅ Seeding completed!
   Created: 40
   Updated: 0
   Skipped: 0
   Total: 40 municipalities
============================================================
```

---

### **Step 3: Configure Environment Variables**

Add to `.env.local`:

```bash
# Tax System
DATABASE_URL="postgresql://..."

# Email Service (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_DOMAIN="agentflow.pro"

# Optional: Vercel Blob for PDF storage
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxxxxxxxxxx"
```

**Get Resend API Key:**
1. Go to https://resend.com
2. Sign up / Login
3. Create API Key
4. Add domain (or use onboarding domain)

---

### **Step 4: Update Prisma Schema**

Ensure these models exist in `prisma/schema.prisma`:

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

model TaxReport {
  id              String   @id @default(cuid())
  propertyId      String
  propertyName    String
  month           DateTime
  year            Int
  monthNumber     Int
  totalNights     Int
  totalGuests     Int
  totalAdults     Int
  totalChildren   Int
  touristTaxAmount Decimal
  vatAmount        Decimal
  totalAccommodation Decimal
  totalRevenue     Decimal
  totalToRemit     Decimal
  status          String   @default("draft")
  edavkiExportUrl String?
  edavkiSubmittedAt DateTime?
  paidAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([propertyId, year, monthNumber])
  @@index([status])
  @@map("tax_reports")
}

model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique
  // ... (already in your schema)
  
  @@map("invoices")
}
```

Then run:
```bash
npx prisma migrate dev
npx prisma generate
```

---

### **Step 5: Test Tax Calculation**

Run the tax tests:

```bash
npm test -- tourist-tax
```

**Expected Output:**
```
PASS tests/tax/tourist-tax.test.ts
  Tourist Tax Calculator
    ✓ calculateNights (5 tests)
    ✓ getGuestCategory (3 tests)
    ✓ calculateTouristTaxWithRates (7 tests)
    ✓ formatTaxBreakdown (1 test)
    ✓ validateGuestAges (4 tests)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

---

### **Step 6: Test API Endpoint**

Start development server:
```bash
npm run dev
```

Test tax calculation API:
```bash
curl -X POST http://localhost:3000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "checkIn": "2026-03-20",
    "checkOut": "2026-03-23",
    "municipality": "ljubljana",
    "guests": [
      { "age": 35 },
      { "age": 32 },
      { "age": 10 },
      { "age": 5 }
    ],
    "accommodationAmount": 300
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "touristTax": {
      "totalTax": 23.49,
      "breakdown": [...],
      "nights": 3,
      "guests": 4
    },
    "vat": {
      "totalNet": 300,
      "totalVAT": 28.50,
      "totalGross": 328.50
    },
    "totals": {
      "subtotal": 300,
      "touristTax": 23.49,
      "totalVAT": 28.50,
      "totalTax": 51.99,
      "grandTotal": 351.99
    }
  }
}
```

---

### **Step 7: Test Invoice PDF Generation**

Create a test invoice:

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "propertyId": "test-property-id",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerAddress": "Test Street 1",
    "customerPostalCode": "1000",
    "customerCity": "Ljubljana",
    "customerCountry": "SI",
    "items": [
      {
        "description": "Nočitev / Accommodation",
        "quantity": 3,
        "unit": "noc",
        "unitPrice": 100,
        "vatRate": "ACCOMMODATION"
      }
    ],
    "paymentTerms": 14
  }'
```

Then generate PDF:
```bash
curl -X POST http://localhost:3000/api/invoices/[INVOICE_ID]/generate-pdf \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Step 8: Test Email Sending**

Send test invoice email:
```bash
curl -X POST http://localhost:3000/api/invoices/[INVOICE_ID]/send-email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Check Resend dashboard for email delivery status.

---

## 🧪 MANUAL TESTING CHECKLIST

### **Tax System**
```
□ Run seed script (npx ts-node scripts/seed-tax-rates.ts)
□ Verify 40+ municipalities in database
□ Test API endpoint with different scenarios
□ Verify tourist tax calculation (ages, nights, municipalities)
□ Verify VAT calculation (9.5%, 22%)
□ Test monthly report generation
□ Test eDavki XML export
```

### **Invoicing System**
```
□ Create test invoice via API
□ Generate PDF
□ Verify PDF layout and content
□ Send test email
□ Verify email delivery
□ Check PDF attachment
□ Test bulk email sending (optional)
```

### **UI Components**
```
□ Add TaxDashboardWidget to dashboard
□ Add InvoiceList to invoices page
□ Add InvoiceForm to create invoice page
□ Test tax calculation in form
□ Test PDF generation button
□ Test email sending button
```

---

## 📊 USAGE EXAMPLES

### **Calculate Tax for Reservation**

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
});

console.log('Tourist Tax:', result.touristTax.totalTax); // €23.49
console.log('VAT:', result.vat.totalVAT); // €29.60
console.log('Total:', result.totals.grandTotal); // €353.09
```

### **Generate Monthly Report**

```typescript
import { generateAndSaveTaxReport } from '@/lib/tax/monthly-report-generator';

const report = await generateAndSaveTaxReport(
  'property-id',
  3,  // March
  2026
);

console.log('Total Tourist Tax:', report.touristTax.totalAmount);
console.log('Total VAT:', report.vat.totalVATAmount);
console.log('Total to Remit:', report.totals.totalToRemit);
```

### **Export to eDavki**

```typescript
import { generateTUR1XML } from '@/lib/tax/edavki-export';

const xml = generateTUR1XML(report, {
  propertyTaxNumber: 'SI12345678',
  propertyName: 'Hotel Example',
  propertyAddress: 'Slovenska 15, Ljubljana',
  reportType: 'TUR1',
});

// Save XML or download in browser
```

### **Generate & Send Invoice**

```typescript
import { generateAndUploadInvoicePDF } from '@/lib/invoices/invoice-pdf';
import { sendInvoiceEmail } from '@/lib/invoices/invoice-email';

// Generate PDF
const { pdfUrl, filename } = await generateAndUploadInvoicePDF(invoiceId);

// Send Email
const result = await sendInvoiceEmail(invoiceId, pdfUrl, filename);

if (result.success) {
  console.log('Email sent successfully!');
}
```

---

## 🐛 TROUBLESHOOTING

### **"Municipality not found"**

**Problem:** Tax rate not found for municipality.

**Solution:**
```bash
npx ts-node scripts/seed-tax-rates.ts
```

Or use custom rates:
```typescript
const result = await calculateReservationTax({
  // ...
  customTouristTaxRates: {
    adults: 3.00,
    children7_18: 1.50,
    children0_7: 0,
  },
});
```

---

### **"PDF generation failed"**

**Problem:** Missing dependencies.

**Solution:**
```bash
npm install @react-pdf/renderer
```

---

### **"Email sending failed"**

**Problem:** Resend API key not configured.

**Solution:**
1. Get API key from https://resend.com
2. Add to `.env.local`: `RESEND_API_KEY=re_xxxxx`
3. Restart dev server

---

### **"Prisma Client not generated"**

**Problem:** Prisma client needs regeneration.

**Solution:**
```bash
npx prisma generate
```

---

## 📞 SUPPORT

### **Documentation**
- `src/lib/tax/README.md` - Tax system guide
- `IMPLEMENTATION-COMPLETE.md` - Implementation summary
- `TAX-REPORTING-IMPLEMENTATION.md` - Detailed implementation plan
- `INVOICING-IMPLEMENTATION.md` - Invoice system plan

### **External Resources**
- [Resend Docs](https://resend.com/docs)
- [@react-pdf/renderer](https://react-pdf.org/)
- [eDavki Portal](https://edavki.durs.si/)
- [FURS Tax Rates](https://www.gov.si/en/topics/tourist-tax/)

---

## ✅ VERIFICATION CHECKLIST

After setup, verify everything works:

**Database:**
```
□ TouristTaxRate table has 40+ municipalities
□ TaxReport table exists
□ Invoice table exists
□ InvoiceItem table exists
```

**API:**
```
□ POST /api/tax/calculate returns correct data
□ GET /api/tax/reports lists reports
□ POST /api/tax/reports/generate creates report
□ POST /api/invoices/[id]/generate-pdf generates PDF
□ POST /api/invoices/[id]/send-email sends email
```

**Calculations:**
```
□ Tourist tax correct for all age groups
□ VAT correct for 9.5% and 22%
□ Monthly reports aggregate correctly
□ eDavki XML validates
```

**UI:**
```
□ TaxDashboardWidget displays correctly
□ InvoiceList shows invoices
□ InvoiceForm creates invoices
□ PDF preview works
□ Email send button works
```

---

**Setup Complete! 🎉**

*Created: 2026-03-16*
*Last Updated: 2026-03-16*
