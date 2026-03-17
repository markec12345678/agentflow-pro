# 📄 INVOICING SYSTEM - IMPLEMENTATION PLAN

**Priority:** P0 - Critical for Production
**Timeline:** Weeks 2-3 (2026-03-23 to 2026-04-05)
**Complexity:** Medium-High

---

## 🎯 OVERVIEW

### **What We're Building**

A complete invoicing system for Slovenian hospitality businesses that:
1. ✅ Generates tax-compliant invoices (PDF)
2. ✅ Supports multiple invoice types (proforma, final, advance)
3. ✅ Handles multi-language (Slovenian/English)
4. ✅ Automatic email delivery
5. ✅ Payment tracking
6. ✅ Integration with tax system

### **Legal Requirements (Slovenia)**

**Mandatory Invoice Fields:**
- Invoice number (unique, sequential)
- Issue date
- Supply date (if different)
- Supplier info (name, address, tax number)
- Customer info (name, address, tax number for B2B)
- Description of services
- Quantity
- Unit price
- Taxable amount
- VAT rate and amount
- Total amount
- Payment terms
- Payment method

---

## 🏗️ DATABASE SCHEMA

### **Prisma Schema (Complete)**

```prisma
// Invoice Model (Full)
model Invoice {
  id                  String          @id @default(cuid())
  invoiceNumber       String          @unique  // Format: YYYY-XXXX
  
  // Property
  propertyId          String
  property            Property        @relation(fields: [propertyId], references: [id])
  
  // Invoice Type
  type                InvoiceType     @default(FINAL)
  
  // Customer (Guest)
  customerName        String
  customerAddress     String
  customerCity        String
  customerPostalCode  String
  customerCountry     String          @default("SI")
  customerEmail       String?
  customerPhone       String?
  customerTaxNumber   String?         // For B2B
  
  // Reservation Link
  reservationId       String?
  reservation         Reservation?    @relation(fields: [reservationId], references: [id])
  
  // Billing Period
  serviceStartDate    DateTime?
  serviceEndDate      DateTime?
  
  // Invoice Items
  items               InvoiceItem[]
  
  // Amounts
  subtotal            Decimal         @db.Decimal(10, 2)  // Before tax
  discountAmount      Decimal         @db.Decimal(10, 2)  @default(0)
  discountPercent     Decimal         @db.Decimal(5, 2)   @default(0)
  taxableAmount       Decimal         @db.Decimal(10, 2)  // After discount
  touristTaxAmount    Decimal         @db.Decimal(10, 2)  @default(0)
  
  // VAT Breakdown
  vat95Base           Decimal         @db.Decimal(10, 2)  @default(0)
  vat95Amount         Decimal         @db.Decimal(10, 2)  @default(0)
  vat22Base           Decimal         @db.Decimal(10, 2)  @default(0)
  vat22Amount         Decimal         @db.Decimal(10, 2)  @default(0)
  totalVATAmount      Decimal         @db.Decimal(10, 2)  @default(0)
  
  // Totals
  totalAmount         Decimal         @db.Decimal(10, 2)  // Final amount
  
  // Payment
  currency            String          @default("EUR")
  paymentTerms        Int             @default(14)  // Days
  dueDate             DateTime
  status              InvoiceStatus   @default(DRAFT)
  
  paid                Boolean         @default(false)
  paidDate            DateTime?
  paidAmount          Decimal?        @db.Decimal(10, 2)
  paymentMethod       PaymentMethod?
  paymentReference    String?         // Bank reference
  
  // PDF
  pdfUrl              String?
  pdfGeneratedAt      DateTime?
  pdfGenerationError  String?
  
  // Email Delivery
  emailSent           Boolean         @default(false)
  emailSentAt         DateTime?
  emailDeliveredAt    DateTime?
  emailOpenedAt       DateTime?
  emailError          String?
  
  // Accounting
  accountingPeriod    String?         // YYYY-MM
  accountingPosted    Boolean         @default(false)
  accountingPostDate  DateTime?
  
  // eDavki
  reportedToTax       Boolean         @default(false)
  taxReportId         String?
  taxReport           TaxReport?      @relation(fields: [taxReportId], references: [id])
  
  // Notes
  internalNotes       String?
  customerNotes       String?
  
  // Metadata
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  createdBy           String?
  cancelledAt         DateTime?
  cancelledBy         String?
  cancellationReason  String?
  
  @@index([status])
  @@index([propertyId, createdAt])
  @@index([dueDate])
  @@index([customerEmail])
  @@index([reservationId])
  @@index([accountingPeriod])
}

// Invoice Items
model InvoiceItem {
  id              String    @id @default(cuid())
  invoiceId       String
  invoice         Invoice   @relation(fields: [invoiceId], references: [invoice], onDelete: Cascade)
  
  // Item Details
  description     String
  longDescription String?
  
  // Type
  itemType        ItemType  @default(SERVICE)
  
  // Quantity & Pricing
  quantity        Decimal   @db.Decimal(10, 2)
  unit            String    @default("kos")  // kos, noc, dan, ura
  unitPrice       Decimal   @db.Decimal(10, 2)
  
  // VAT
  vatRate         VATRate   @default(ACCOMMODATION)
  
  // Amounts
  amount          Decimal   @db.Decimal(10, 2)  // quantity * unitPrice
  vatAmount       Decimal   @db.Decimal(10, 2)
  grossAmount     Decimal   @db.Decimal(10, 2)
  
  // Reservation Link (optional)
  reservationId   String?
  
  // Order
  sortOrder       Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([invoiceId])
  @@index([itemType])
}

enum InvoiceType {
  PROFORMA        // Proforma invoice (not legally binding)
  ADVANCE         // Advance invoice (predračun)
  FINAL           // Final invoice (končni račun)
  CREDIT          // Credit note (dobropis)
  DEBIT           // Debit note (dobropis)
  RECURRING       // Recurring invoice (periodični račun)
}

enum InvoiceStatus {
  DRAFT           // Osnutek
  PENDING         // Čaka na odobritev
  ISSUED          // Izdan
  SENT            // Poslan
  VIEWED          // Pregledan (customer opened)
  PARTIALLY_PAID  // Delno plačan
  PAID            // Plačan
  OVERDUE         // Zapadel
  CANCELLED       // Preklican
  REFUNDED        // Dobropisan
}

enum ItemType {
  ACCOMMODATION   // Nočitev
  FOOD            // Hrana
  SERVICE         // Storitve
  PRODUCT         // Izdelek
  OTHER           // Drugo
}

enum VATRate {
  NONE            // 0% (ni DDV)
  ACCOMMODATION   // 9.5%
  FOOD            // 22%
  SERVICES        // 22%
  STANDARD        // 22%
}

enum PaymentMethod {
  BANK_TRANSFER   // Bančno nakazilo
  CREDIT_CARD     // Kreditna kartica
  DEBIT_CARD      // Debetna kartica
  CASH            // Gotovina
  PAYPAL          // PayPal
  STRIPE          // Stripe
  OTHER           // Drugo
}
```

---

## 🔧 IMPLEMENTATION PLAN

### **Week 2 (2026-03-23 to 2026-03-29)**

#### **Day 1-2: Database & API Setup**

**Files to Create/Modify:**
- `prisma/schema.prisma` (add Invoice, InvoiceItem models)
- `prisma/migrations/XXXX_add_invoicing_system/migration.sql`
- `src/pages/api/invoices/index.ts`
- `src/pages/api/invoices/[id].ts`

```typescript
// src/pages/api/invoices/index.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method === 'GET') {
    // List invoices
    const { propertyId, status, page = '1', limit = '20' } = req.query;
    
    const invoices = await prisma.invoice.findMany({
      where: {
        propertyId: propertyId as string,
        status: status ? (status as any) : undefined,
      },
      include: {
        reservation: {
          select: {
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });
    
    const total = await prisma.invoice.count({
      where: {
        propertyId: propertyId as string,
        status: status ? (status as any) : undefined,
      },
    });
    
    return res.json({
      invoices,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  }
  
  if (req.method === 'POST') {
    // Create invoice
    const {
      propertyId,
      type,
      customerName,
      customerAddress,
      customerCity,
      customerPostalCode,
      customerCountry,
      customerEmail,
      customerTaxNumber,
      reservationId,
      serviceStartDate,
      serviceEndDate,
      items,
      paymentTerms,
      customerNotes,
    } = req.body;
    
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must have at least one item' });
    }
    
    // Calculate amounts
    let subtotal = 0;
    let vat95Base = 0;
    let vat95Amount = 0;
    let vat22Base = 0;
    let vat22Amount = 0;
    
    for (const item of items) {
      const itemAmount = Number(item.quantity) * Number(item.unitPrice);
      subtotal += itemAmount;
      
      if (item.vatRate === 'ACCOMMODATION') {
        vat95Base += itemAmount;
        vat95Amount += itemAmount * 0.095;
      } else {
        vat22Base += itemAmount;
        vat22Amount += itemAmount * 0.22;
      }
    }
    
    const taxableAmount = subtotal;
    const totalVATAmount = vat95Amount + vat22Amount;
    const totalAmount = taxableAmount + totalVATAmount;
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (paymentTerms || 14));
    
    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `${year}-`,
        },
      },
      orderBy: { invoiceNumber: 'desc' },
    });
    
    let invoiceNumberSeq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
      invoiceNumberSeq = lastSeq + 1;
    }
    
    const invoiceNumber = `${year}-${String(invoiceNumberSeq).padStart(4, '0')}`;
    
    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        propertyId,
        type,
        customerName,
        customerAddress,
        customerCity,
        customerPostalCode,
        customerCountry,
        customerEmail,
        customerTaxNumber,
        reservationId,
        serviceStartDate: serviceStartDate ? new Date(serviceStartDate) : null,
        serviceEndDate: serviceEndDate ? new Date(serviceEndDate) : null,
        subtotal,
        taxableAmount,
        vat95Base,
        vat95Amount,
        vat22Base,
        vat22Amount,
        totalVATAmount,
        totalAmount,
        paymentTerms: paymentTerms || 14,
        dueDate,
        customerNotes,
        createdBy: session.user.id,
        items: {
          create: items.map((item: any, index: number) => ({
            description: item.description,
            itemType: item.itemType || 'SERVICE',
            quantity: item.quantity,
            unit: item.unit || 'kos',
            unitPrice: item.unitPrice,
            vatRate: item.vatRate || 'ACCOMMODATION',
            amount: Number(item.quantity) * Number(item.unitPrice),
            vatAmount: (Number(item.quantity) * Number(item.unitPrice)) * 
              (item.vatRate === 'ACCOMMODATION' ? 0.095 : 0.22),
            grossAmount: (Number(item.quantity) * Number(item.unitPrice)) * 
              (1 + (item.vatRate === 'ACCOMMODATION' ? 0.095 : 0.22)),
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    
    return res.status(201).json(invoice);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

#### **Day 3-4: PDF Generation**

**Dependencies:**
```bash
npm install @react-pdf/renderer
npm install react-pdf
```

**Files to Create:**
- `src/components/invoices/invoice-pdf.tsx`
- `src/lib/pdf/generate-invoice-pdf.ts`
- `src/pages/api/invoices/[id]/pdf.ts`

```typescript
// src/components/invoices/invoice-pdf.tsx

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: { 
    marginBottom: 20,
    borderBottom: 2,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    width: 150,
    height: 50,
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666',
  },
  section: { 
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  table: { 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 10,
  },
  totals: { 
    marginTop: 15,
    alignSelf: 'flex-end',
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 5,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  grandTotalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  footer: { 
    marginTop: 30, 
    paddingTop: 15, 
    borderTop: 1,
    fontSize: 9,
    textAlign: 'center',
    color: '#999',
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderLeft: 3,
    borderLeftColor: '#1a73e8',
  },
  notesText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
});

interface InvoiceItemData {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  vatRate: string;
  vatAmount: number;
  grossAmount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  type: string;
  issuedDate: string;
  dueDate: string;
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    taxNumber: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  customer: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    taxNumber?: string;
  };
  items: InvoiceItemData[];
  subtotal: number;
  discountAmount?: number;
  taxableAmount: number;
  vat95Base: number;
  vat95Amount: number;
  vat22Base: number;
  vat22Amount: number;
  totalVATAmount: number;
  totalAmount: number;
  paymentTerms: number;
  customerNotes?: string;
}

export const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const formatCurrency = (amount: number) => 
    `${amount.toFixed(2)} €`;
  
  const getVATRateLabel = (rate: string) => {
    switch (rate) {
      case 'ACCOMMODATION': return '9.5%';
      case 'FOOD': return '22%';
      case 'SERVICES': return '22%';
      default: return '0%';
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PROFORMA': return 'PREDRAČUN / PROFORMA INVOICE';
      case 'ADVANCE': return 'PREDRAČUN / ADVANCE INVOICE';
      case 'FINAL': return 'RAČUN / INVOICE';
      case 'CREDIT': return 'DOBROPIS / CREDIT NOTE';
      default: return 'RAČUN / INVOICE';
    }
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {/* Logo placeholder */}
            <View style={{ width: 150, height: 50, backgroundColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center', paddingTop: 20 }}>
                LOGO
              </Text>
            </View>
          </View>
          
          <View style={styles.invoiceTitle}>
            <Text style={styles.title}>{getTypeLabel(data.type)}</Text>
            <Text style={styles.invoiceNumber}>Št.: {data.invoiceNumber}</Text>
            <Text style={styles.invoiceNumber}>Datum: {data.issuedDate}</Text>
          </View>
        </View>
        
        {/* Property & Customer Info */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Izdajatelj / Issuer:</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.property.name}</Text>
            <Text>{data.property.address}</Text>
            <Text>{data.property.postalCode} {data.property.city}</Text>
            <Text>{data.property.country}</Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Davčna št.: {data.property.taxNumber}
            </Text>
            {data.property.phone && (
              <Text style={{ fontSize: 9, color: '#666' }}>
                Tel: {data.property.phone}
              </Text>
            )}
            {data.property.email && (
              <Text style={{ fontSize: 9, color: '#666' }}>
                Email: {data.property.email}
              </Text>
            )}
          </View>
          
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Kupec / Customer:</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.customer.name}</Text>
            <Text>{data.customer.address}</Text>
            <Text>{data.customer.postalCode} {data.customer.city}</Text>
            <Text>{data.customer.country}</Text>
            {data.customer.taxNumber && (
              <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
                Davčna št.: {data.customer.taxNumber}
              </Text>
            )}
          </View>
        </View>
        
        {/* Service Period */}
        {(data.items.some(i => i.description.includes('nočitev') || i.description.includes('accommodation'))) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Obdobje nastanitve / Period of Stay:</Text>
            <Text>{data.issuedDate} - {data.dueDate}</Text>
          </View>
        )}
        
        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 3 }}>Opis / Description</Text>
            <Text style={{ width: 50, textAlign: 'center' }}>Kol.</Text>
            <Text style={{ width: 50, textAlign: 'center' }}>Enota</Text>
            <Text style={{ width: 70, textAlign: 'right' }}>Cena</Text>
            <Text style={{ width: 70, textAlign: 'right' }}>Znesek</Text>
          </View>
          
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={{ flex: 3, fontSize: 10 }}>{item.description}</Text>
              <Text style={{ width: 50, textAlign: 'center', fontSize: 10 }}>{item.quantity}</Text>
              <Text style={{ width: 50, textAlign: 'center', fontSize: 10 }}>{item.unit}</Text>
              <Text style={{ width: 70, textAlign: 'right', fontSize: 10 }}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={{ width: 70, textAlign: 'right', fontSize: 10 }}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>
        
        {/* VAT Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DDV Breakdown:</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ flex: 2 }}>Stopnja / Rate</Text>
              <Text style={{ flex: 2, textAlign: 'right' }}>Osnova / Base</Text>
              <Text style={{ flex: 2, textAlign: 'right' }}>DDV / VAT</Text>
            </View>
            
            {data.vat95Base > 0 && (
              <View style={styles.tableRow}>
                <Text style={{ flex: 2, fontSize: 10 }}>9.5% (Namestitev)</Text>
                <Text style={{ flex: 2, textAlign: 'right', fontSize: 10 }}>
                  {formatCurrency(data.vat95Base)}
                </Text>
                <Text style={{ flex: 2, textAlign: 'right', fontSize: 10 }}>
                  {formatCurrency(data.vat95Amount)}
                </Text>
              </View>
            )}
            
            {data.vat22Base > 0 && (
              <View style={styles.tableRow}>
                <Text style={{ flex: 2, fontSize: 10 }}>22% (Hrana, Storitve)</Text>
                <Text style={{ flex: 2, textAlign: 'right', fontSize: 10 }}>
                  {formatCurrency(data.vat22Base)}
                </Text>
                <Text style={{ flex: 2, textAlign: 'right', fontSize: 10 }}>
                  {formatCurrency(data.vat22Amount)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Medvsota / Subtotal:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(data.subtotal)}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DDV / VAT:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(data.totalVATAmount)}</Text>
          </View>
          
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>SKUPAJ / TOTAL:</Text>
            <Text style={styles.grandTotalAmount}>{formatCurrency(data.totalAmount)}</Text>
          </View>
        </View>
        
        {/* Payment Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plačilni pogoji / Payment Terms:</Text>
          <Text style={{ fontSize: 10 }}>
            Prosimo, poravnajte račun v {data.paymentTerms} dneh od datuma izdaje.
          </Text>
          <Text style={{ fontSize: 10 }}>
            Please pay within {data.paymentTerms} days from issue date.
          </Text>
          <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
            Bank: [Bank Name] | IBAN: SI56 XXXX XXXX XXXX XXX | SWIFT: XXXXXXXX
          </Text>
          <Text style={{ fontSize: 9, color: '#666' }}>
            Sklic / Reference: SI00 {data.invoiceNumber.replace('-', '')}
          </Text>
        </View>
        
        {/* Customer Notes */}
        {data.customerNotes && (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{data.customerNotes}</Text>
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>Hvala za vaše gostovanje! / Thank you for your stay!</Text>
          <Text style={{ marginTop: 5 }}>
            {data.property.name} • {data.property.address} • {data.property.postalCode} {data.property.city}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
```

```typescript
// src/lib/pdf/generate-invoice-pdf.ts

import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/invoice-pdf';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function generateInvoicePDF(invoiceId: string): Promise<{
  pdfUrl: string;
  buffer: Buffer;
}> {
  // Fetch invoice data
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      property: true,
      reservation: true,
    },
  });
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  // Format data for PDF
  const pdfData = {
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    issuedDate: new Date(invoice.createdAt).toLocaleDateString('sl-SI'),
    dueDate: new Date(invoice.dueDate).toLocaleDateString('sl-SI'),
    property: {
      name: invoice.property.name,
      address: invoice.property.address,
      postalCode: invoice.property.postalCode,
      city: invoice.property.city,
      country: invoice.property.country,
      taxNumber: invoice.property.taxNumber,
      phone: invoice.property.phone,
      email: invoice.property.email,
      website: invoice.property.website,
    },
    customer: {
      name: invoice.customerName,
      address: invoice.customerAddress,
      postalCode: invoice.customerPostalCode,
      city: invoice.customerCity,
      country: invoice.customerCountry,
      taxNumber: invoice.customerTaxNumber,
    },
    items: invoice.items.map(item => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
      vatRate: item.vatRate,
      vatAmount: Number(item.vatAmount),
      grossAmount: Number(item.grossAmount),
    })),
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxableAmount: Number(invoice.taxableAmount),
    vat95Base: Number(invoice.vat95Base),
    vat95Amount: Number(invoice.vat95Amount),
    vat22Base: Number(invoice.vat22Base),
    vat22Amount: Number(invoice.vat22Amount),
    totalVATAmount: Number(invoice.totalVATAmount),
    totalAmount: Number(invoice.totalAmount),
    paymentTerms: invoice.paymentTerms,
    customerNotes: invoice.customerNotes,
  };
  
  // Generate PDF
  const pdf = <InvoicePDF data={pdfData} />;
  const buffer = await renderToBuffer(pdf);
  
  // Upload to Vercel Blob
  const blob = await put(`invoices/${invoice.invoiceNumber}.pdf`, buffer, {
    access: 'public',
  });
  
  // Update invoice with PDF URL
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      pdfUrl: blob.url,
      pdfGeneratedAt: new Date(),
    },
  });
  
  return {
    pdfUrl: blob.url,
    buffer: Buffer.from(buffer),
  };
}
```

---

#### **Day 5-6: Email Delivery**

**Dependencies:**
```bash
npm install resend
```

**Files to Create:**
- `src/lib/email/send-invoice-email.ts`
- `src/pages/api/invoices/[id]/send-email.ts`
- `src/emails/invoice-email.tsx`

```typescript
// src/lib/email/send-invoice-email.ts

import { Resend } from 'resend';
import { InvoiceEmailTemplate } from '@/emails/invoice-email';
import { render } from '@react-email/render';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(
  invoiceId: string,
  pdfUrl: string
): Promise<{ success: boolean; error?: string }> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      property: true,
      items: true,
    },
  });
  
  if (!invoice) {
    return { success: false, error: 'Invoice not found' };
  }
  
  if (!invoice.customerEmail) {
    return { success: false, error: 'Customer email not provided' };
  }
  
  try {
    // Render email template
    const html = await render(
      <InvoiceEmailTemplate
        invoice={invoice}
        property={invoice.property}
        pdfUrl={pdfUrl}
      />
    );
    
    // Send email
    const { data, error } = await resend.emails.send({
      from: `${invoice.property.name} <noreply@${invoice.property.domain || 'agentflow.pro'}>`,
      to: [invoice.customerEmail],
      subject: `Račun ${invoice.invoiceNumber} - ${invoice.property.name}`,
      html,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          path: pdfUrl,
        },
      ],
    });
    
    if (error) {
      throw error;
    }
    
    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
        status: 'SENT',
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        emailError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}
```

---

#### **Day 7: Testing**

**Test Files:**
- `tests/invoices/invoice-crud.test.ts`
- `tests/invoices/pdf-generation.test.ts`
- `tests/invoices/email-delivery.test.ts`
- `tests/invoices/payment-tracking.test.ts`

---

### **Week 3 (2026-03-30 to 2026-04-05)**

#### **Day 1-2: UI Components**

**Files to Create:**
- `src/components/invoices/invoice-list.tsx`
- `src/components/invoices/invoice-form.tsx`
- `src/components/invoices/invoice-detail.tsx`
- `src/pages/dashboard/invoices/index.tsx`
- `src/pages/dashboard/invoices/[id].tsx`
- `src/pages/dashboard/invoices/create.tsx`

---

#### **Day 3-4: Payment Tracking**

**Files to Create:**
- `src/pages/api/invoices/[id]/mark-paid.ts`
- `src/pages/api/invoices/[id]/cancel.ts`
- `src/lib/invoices/payment-webhook.ts`

---

#### **Day 5-6: Integration with Tax System**

**Files to Create:**
- `src/lib/invoices/tax-integration.ts`
- `src/pages/api/invoices/[id]/report-to-tax.ts`

---

#### **Day 7: Documentation & Testing**

**Documentation:**
- `docs/INVOICING-USER-GUIDE.md`
- `docs/INVOICE-TEMPLATES.md`

---

## ✅ SUCCESS CRITERIA

**Invoicing System Complete When:**
```
✅ Create invoices (proforma, advance, final)
✅ PDF generation working (Slovenian/English)
✅ Email delivery functional
✅ Payment tracking active
✅ Integration with tax system
✅ All tests passing
✅ User documentation complete
```

---

**Next Step:** Start implementation with database migration!

*Created: 2026-03-16*
*Timeline: 2026-03-23 to 2026-04-05*
*Priority: P0 - Critical*
