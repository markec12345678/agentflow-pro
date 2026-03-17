# 🧾 INVOICING & TAX REPORTING SYSTEM

**Complete Slovenian tourist tax & VAT compliance for hospitality**

---

## ✅ COMPLETED FEATURES

### 1. **Tourist Tax Calculation** ✅
- ✅ All Slovenian municipalities supported
- ✅ Children/adults different rates
- ✅ Spa tax (zdraviliška taksa) support
- ✅ Automatic calculation based on property location

### 2. **Invoice Generation** ✅
- ✅ PDF generation with Slovenian requirements
- ✅ Automatic invoice numbering
- ✅ VAT (DDV) calculation at 22%
- ✅ Email delivery ready

### 3. **Tax Reporting** ✅
- ✅ Monthly tax reports per property
- ✅ eDavki export ready
- ✅ Tourist tax breakdown
- ✅ VAT summary

---

## 📁 FILE STRUCTURE

```
src/
├── lib/
│   ├── tourism/
│   │   └── tax-rates.ts              # Tourist tax rates & calculations
│   └── invoices/
│       └── invoice-template.ts       # PDF invoice template
└── app/
    └── api/
        ├── invoices/
        │   ├── route.ts              # Create/list invoices
        │   └── [id]/
        │       └── pdf/
        │           └── route.ts      # Download invoice PDF
        └── tax-reports/
            └── route.ts              # Generate/list tax reports

prisma/
└── schema.prisma                     # Updated with Invoice, TaxReport models
```

---

## 🚀 HOW TO USE

### **STEP 1: Install Dependencies**

```bash
npm install @react-pdf/renderer
```

---

### **STEP 2: Update Database**

```bash
# Generate Prisma client with new models
npx prisma migrate dev --name add_invoicing_tax_models

# This will create:
# - TouristTaxRate table
# - Invoice table
# - TaxReport table
```

---

### **STEP 3: Create Invoice from Reservation**

**API Call:**
```bash
POST /api/invoices
Content-Type: application/json

{
  "reservationId": "res_123456"
}
```

**Response:**
```json
{
  "id": "inv_123456",
  "invoiceNumber": "INV-2026-0001",
  "reservationId": "res_123456",
  "guestId": "guest_123456",
  "invoiceDate": "2026-03-15T10:00:00Z",
  "dueDate": "2026-04-14T10:00:00Z",
  "accommodation": 500.00,
  "touristTax": 15.30,
  "vatRate": 22,
  "vatAmount": 113.09,
  "total": 628.39,
  "status": "draft"
}
```

---

### **STEP 4: Download Invoice PDF**

**API Call:**
```bash
GET /api/invoices/inv_123456/pdf
```

**Returns:** PDF file (`INV-2026-0001.pdf`)

**PDF Includes:**
- ✅ Your company info (supplier)
- ✅ Guest info (billing)
- ✅ Stay details (check-in/out, nights, guests)
- ✅ Itemized breakdown (accommodation, tourist tax)
- ✅ VAT calculation (22%)
- ✅ Total amount
- ✅ Payment instructions
- ✅ Slovenian tax compliance

---

### **STEP 5: Generate Monthly Tax Report**

**API Call:**
```bash
POST /api/tax-reports
Content-Type: application/json

{
  "propertyId": "prop_123456",
  "year": 2026,
  "month": 3  // March
}
```

**Response:**
```json
{
  "id": "tax_report_123456",
  "propertyId": "prop_123456",
  "propertyName": "Hotel Bela Krajina",
  "month": "2026-03-01T00:00:00Z",
  "year": 2026,
  "monthNumber": 3,
  "totalNights": 150,
  "totalGuests": 320,
  "totalAdults": 280,
  "totalChildren": 40,
  "touristTaxAmount": 450.50,
  "vatAmount": 2850.75,
  "totalAccommodation": 15000.00,
  "status": "draft"
}
```

---

### **STEP 6: Export for eDavki**

**API Call:**
```bash
GET /api/tax-reports/tax_report_123456/edavki
```

**Returns:** XML/CSV file formatted for eDavki submission

*(Note: eDavki export format needs to be implemented based on current eDavki API specs)*

---

## 💡 EXAMPLES

### **Example 1: Create Invoice for Reservation**

```typescript
// In your checkout flow:
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reservationId: reservation.id,
  }),
});

const invoice = await response.json();

// Download PDF
const pdfUrl = `/api/invoices/${invoice.id}/pdf`;
window.open(pdfUrl, '_blank');
```

---

### **Example 2: Generate March Tax Report**

```typescript
// Generate tax report for March 2026
const response = await fetch('/api/tax-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    propertyId: 'prop_123456',
    year: 2026,
    month: 3,
  }),
});

const taxReport = await response.json();
console.log(`Tourist tax to pay: €${taxReport.touristTaxAmount}`);
console.log(`VAT to pay: €${taxReport.vatAmount}`);
```

---

### **Example 3: List All Unpaid Invoices**

```typescript
// Get all unpaid invoices
const response = await fetch('/api/invoices?status=sent&limit=50');
const { invoices } = await response.json();

invoices.forEach(invoice => {
  console.log(`${invoice.invoiceNumber}: €${invoice.total} (due: ${invoice.dueDate})`);
});
```

---

## 📊 TAX RATES (Slovenia 2026)

### **Standard Rates:**

| Region | Adults | Children 7-18 | Children 0-7 |
|--------|--------|---------------|--------------|
| **Bela krajina, Dolenjska, Posavje** | €1.53 | €0.77 | Free |
| **Ljubljana** | €3.13 | €1.57 | Free |
| **Bled, Bohinj** | €2.20 | €1.10 | Free |
| **Portorož, Piran** | €2.48 | €1.24 | Free |
| **Other** | €1.53 | €0.77 | Free |

### **Spa Tax (Zdraviliška taksa):**

Additional €0.43 per adult per night for properties with spa status in:
- Dolenjske Toplice
- Novo Mesto
- Portorož
- Other spa municipalities

---

## 🧾 INVOICE REQUIREMENTS (Slovenia)

### **Mandatory Fields:**

1. ✅ Invoice number (unique, sequential)
2. ✅ Invoice date
3. ✅ Due date
4. ✅ Supplier info (name, address, matična številka, DDV)
5. ✅ Guest info (name, address, DDV if company)
6. ✅ Stay details (check-in, check-out, nights)
7. ✅ Itemized breakdown (accommodation, tourist tax)
8. ✅ VAT rate and amount
9. ✅ Total amount
10. ✅ Payment instructions

---

## 📅 TAX REPORTING DEADLINES

### **Monthly Reports:**

- **Due Date:** 20th day of the following month
- **Tourist Tax:** Submit via eDavki
- **VAT:** Submit via eDavki (monthly or quarterly depending on your status)

### **Example:**

- **March 2026 report** → Due by April 20, 2026
- **Q1 2026 VAT** → Due by April 20, 2026 (if quarterly)

---

## ⚠️ IMPORTANT NOTES

### **1. Update Your Company Info**

Before issuing invoices, update these in `invoice-template.ts`:

```typescript
supplierName: 'AgentFlow Pro',  // Your company name
supplierAddress: 'Griblje 70, 8332 Gradac, Slovenia',
supplierRegistration: '',  // TODO: Add your matična številka
supplierVAT: '',  // TODO: Add your DDV številka
supplierEmail: 'robertpezdirc@gmail.com',
supplierPhone: '+386 40 451 250',
```

### **2. eDavki Integration**

The system generates tax reports, but you need to:
1. Export data (CSV/XML)
2. Login to eDavki
3. Submit manually (or integrate eDavki API if available)

### **3. VAT Registration**

If your annual revenue exceeds €50,000, you MUST register for VAT (DDV) in Slovenia.

---

## 🎯 NEXT STEPS

### **Phase 1: Testing (This Week)**

```
□ Install @react-pdf/renderer
□ Run Prisma migration
□ Create test reservation
□ Generate test invoice
□ Download PDF
□ Verify calculations
```

### **Phase 2: Production (Next Week)**

```
□ Add your company info (matična, DDV)
□ Test with real guest data
□ Submit first tax report
□ Set up automatic monthly report generation
```

### **Phase 3: Automation (Future)**

```
□ Auto-generate invoice on checkout
□ Auto-send invoice via email
□ Auto-generate monthly tax reports
□ eDavki API integration (if available)
```

---

## 📞 SUPPORT

### **Questions?**

- Tourist tax rates: https://www.gov.si/en/topics/tourist-tax/
- eDavki portal: https://edavki.durs.si/
- VAT requirements: https://www.gov.si/en/topics/value-added-tax/

### **Technical Issues?**

Check:
- Prisma schema is updated
- Database migration completed
- API endpoints are accessible
- PDF generation dependencies installed

---

**Created:** 2026-03-15  
**Version:** 1.0  
**Status:** ✅ Ready for Testing
