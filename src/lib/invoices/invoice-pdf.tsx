/**
 * Invoice PDF Generator
 * 
 * Generates professional, tax-compliant invoices in PDF format.
 * Bilingual support (Slovenian/English).
 * 
 * Dependencies:
 *   npm install @react-pdf/renderer
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';

// Register fonts (optional - using default Helvetica for now)
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 25,
    borderBottom: 2,
    borderBottomColor: '#1a73e8',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoSection: {
    width: '50%',
  },
  logoPlaceholder: {
    width: 150,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 10,
    color: '#999',
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  invoiceDate: {
    fontSize: 10,
    color: '#999',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  column: {
    width: '48%',
  },
  textLine: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
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
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  colDescription: { flex: 3 },
  colQuantity: { width: 60, textAlign: 'center' as const },
  colUnit: { width: 60, textAlign: 'center' as const },
  colUnitPrice: { width: 80, textAlign: 'right' as const },
  colAmount: { width: 90, textAlign: 'right' as const },
  totals: {
    marginTop: 15,
    alignSelf: 'flex-end',
    width: '55%',
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
    paddingVertical: 10,
    marginTop: 5,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  grandTotalAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  paymentInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderLeft: 3,
    borderLeftColor: '#1a73e8',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  paymentText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
    lineHeight: 1.5,
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff9e6',
    borderLeft: 3,
    borderLeftColor: '#ffc107',
    borderRadius: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#856404',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 35,
    paddingTop: 15,
    borderTop: 1,
    borderTopColor: '#ddd',
    fontSize: 9,
    textAlign: 'center' as const,
    color: '#999',
  },
  footerText: {
    marginBottom: 3,
  },
  vatBreakdown: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  vatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9,
  },
  vatLabel: {
    color: '#666',
  },
  vatAmount: {
    fontWeight: 'bold',
  },
});

interface InvoiceItemData {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  vatRate: string;
  vatAmount: number;
  grossAmount: number;
}

interface InvoicePDFData {
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
    registrationNumber?: string;
  };
  customer: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    taxNumber?: string;
    email?: string;
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
  touristTaxAmount?: number;
  paymentTerms: number;
  bankName?: string;
  bankIban?: string;
  bankSwift?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export const InvoicePDFDocument: React.FC<{ data: InvoicePDFData }> = ({
  data,
}) => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PROFORMA: 'PREDRAČUN / PROFORMA INVOICE',
      ADVANCE: 'PREDRAČUN / ADVANCE INVOICE',
      FINAL: 'RAČUN / INVOICE',
      CREDIT: 'DOBROPIS / CREDIT NOTE',
      DEBIT: 'DOBROPIS / DEBIT NOTE',
    };
    return labels[type] || 'RAČUN / INVOICE';
  };

  const getVATRateLabel = (rate: string): string => {
    switch (rate) {
      case 'ACCOMMODATION':
        return '9.5%';
      case 'FOOD':
        return '22%';
      case 'SERVICES':
        return '22%';
      default:
        return '0%';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
            <Text style={[styles.textLine, styles.bold]}>{data.property.name}</Text>
            <Text style={styles.textLine}>{data.property.address}</Text>
            <Text style={styles.textLine}>
              {data.property.postalCode} {data.property.city}
            </Text>
            <Text style={styles.textLine}>{data.property.country}</Text>
          </View>

          <View style={styles.invoiceTitle}>
            <Text style={styles.title}>{getTypeLabel(data.type)}</Text>
            <Text style={styles.invoiceNumber}>
              Št.: {data.invoiceNumber} / No: {data.invoiceNumber}
            </Text>
            <Text style={styles.invoiceDate}>
              Datum: {data.issuedDate} / Date: {data.issuedDate}
            </Text>
            <Text style={styles.invoiceDate}>
              Zapade: {data.dueDate} / Due: {data.dueDate}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Kupec / Customer
          </Text>
          <Text style={[styles.textLine, styles.bold]}>{data.customer.name}</Text>
          <Text style={styles.textLine}>{data.customer.address}</Text>
          <Text style={styles.textLine}>
            {data.customer.postalCode} {data.customer.city}
          </Text>
          <Text style={styles.textLine}>{data.customer.country}</Text>
          {data.customer.taxNumber && (
            <Text style={styles.textLine}>
              Davčna št. / Tax ID: {data.customer.taxNumber}
            </Text>
          )}
          {data.customer.email && (
            <Text style={styles.textLine}>Email: {data.customer.email}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Postavke / Items
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Opis / Description</Text>
              <Text style={styles.colQuantity}>Kol.</Text>
              <Text style={styles.colUnit}>Enota</Text>
              <Text style={styles.colUnitPrice}>Cena</Text>
              <Text style={styles.colAmount}>Znesek</Text>
            </View>

            {data.items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index === data.items.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQuantity}>{item.quantity}</Text>
                <Text style={styles.colUnit}>{item.unit}</Text>
                <Text style={styles.colUnitPrice}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={styles.colAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* VAT Breakdown */}
        <View style={styles.vatBreakdown}>
          <Text style={styles.sectionTitle}>DDV Breakdown / VAT Breakdown</Text>
          {data.vat95Base > 0 && (
            <View style={styles.vatRow}>
              <Text style={styles.vatLabel}>
                9.5% (Namestitev / Accommodation):
              </Text>
              <Text style={styles.vatAmount}>
                {formatCurrency(data.vat95Base)} + {formatCurrency(data.vat95Amount)} DDV
              </Text>
            </View>
          )}
          {data.vat22Base > 0 && (
            <View style={styles.vatRow}>
              <Text style={styles.vatLabel}>
                22% (Hrana, storitve / Food, services):
              </Text>
              <Text style={styles.vatAmount}>
                {formatCurrency(data.vat22Base)} + {formatCurrency(data.vat22Amount)} DDV
              </Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Medvsota / Subtotal:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(data.subtotal)}</Text>
          </View>

          {data.touristTaxAmount && data.touristTaxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Turistična taksa / Tourist tax:
              </Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(data.touristTaxAmount)}
              </Text>
            </View>
          )}

          {data.discountAmount && data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Popust / Discount:</Text>
              <Text style={styles.totalAmount}>
                -{formatCurrency(data.discountAmount)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Osnova za DDV / VAT Base:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(data.taxableAmount)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DDV / VAT:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(data.totalVATAmount)}
            </Text>
          </View>

          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>SKUPAJ / TOTAL:</Text>
            <Text style={styles.grandTotalAmount}>
              {formatCurrency(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>
            Plačilni pogoji / Payment Terms
          </Text>
          <Text style={styles.paymentText}>
            Prosimo, poravnajte račun v {data.paymentTerms} dneh od datuma izdaje.
          </Text>
          <Text style={styles.paymentText}>
            Please pay within {data.paymentTerms} days from issue date.
          </Text>
          {data.bankName && (
            <>
              <Text style={styles.paymentText}>
                Banka / Bank: {data.bankName}
              </Text>
              <Text style={styles.paymentText}>
                IBAN: {data.bankIban}
              </Text>
              <Text style={styles.paymentText}>
                SWIFT: {data.bankSwift}
              </Text>
              <Text style={styles.paymentText}>
                Sklic / Reference: SI00 {data.invoiceNumber.replace(/-/g, '')}
              </Text>
            </>
          )}
        </View>

        {/* Customer Notes */}
        {data.customerNotes && (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{data.customerNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hvala za vaše gostovanje! / Thank you for your stay!
          </Text>
          <Text style={styles.footerText}>
            {data.property.name} • {data.property.address} •{' '}
            {data.property.postalCode} {data.property.city}
          </Text>
          {data.property.phone && (
            <Text style={styles.footerText}>Tel: {data.property.phone}</Text>
          )}
          {data.property.email && (
            <Text style={styles.footerText}>Email: {data.property.email}</Text>
          )}
          <Text style={styles.footerText}>
            Davčna št. / Tax ID: {data.property.taxNumber}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate PDF from invoice data
 */
export async function generateInvoicePDF(
  invoiceId: string
): Promise<{
  pdfUrl: string;
  buffer: Buffer;
  filename: string;
}> {
  // Fetch invoice data
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      property: true,
      reservation: {
        include: {
          guests: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  // Transform data for PDF
  const pdfData: InvoicePDFData = {
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    issuedDate: new Date(invoice.invoiceDate).toLocaleDateString('sl-SI'),
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
      registrationNumber: invoice.property.registrationNumber,
    },
    customer: {
      name: invoice.customerName,
      address: invoice.customerAddress,
      postalCode: invoice.customerPostalCode,
      city: invoice.customerCity,
      country: invoice.customerCountry,
      taxNumber: invoice.customerTaxNumber,
      email: invoice.customerEmail || undefined,
    },
    items: invoice.items.map((item) => ({
      id: item.id,
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
    touristTaxAmount: Number(invoice.touristTaxAmount),
    paymentTerms: invoice.paymentTerms,
    bankName: invoice.property.bankName,
    bankIban: invoice.property.bankIban,
    bankSwift: invoice.property.bankSwift,
    customerNotes: invoice.customerNotes || undefined,
  };

  // Generate PDF
  const pdf = <InvoicePDFDocument data={pdfData} />;
  const buffer = await renderToBuffer(pdf);

  // Generate filename
  const filename = `Invoice-${invoice.invoiceNumber}.pdf`;

  return {
    pdfUrl: '', // Will be set after upload
    buffer: Buffer.from(buffer),
    filename,
  };
}

/**
 * Upload PDF to storage (Vercel Blob, S3, etc.)
 */
export async function uploadPDFToStorage(
  filename: string,
  buffer: Buffer
): Promise<string> {
  // For now, return a placeholder URL
  // In production, upload to Vercel Blob, S3, or similar
  
  try {
    // Try to use Vercel Blob if available
    const { put } = await import('@vercel/blob');
    const blob = await put(`invoices/${filename}`, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    });
    return blob.url;
  } catch (error) {
    // Fallback: return data URL (for development)
    const base64 = buffer.toString('base64');
    return `data:application/pdf;base64,${base64}`;
  }
}

/**
 * Complete PDF generation with upload
 */
export async function generateAndUploadInvoicePDF(
  invoiceId: string
): Promise<{
  pdfUrl: string;
  filename: string;
  size: number;
}> {
  const { buffer, filename } = await generateInvoicePDF(invoiceId);
  const pdfUrl = await uploadPDFToStorage(filename, buffer);

  // Update invoice with PDF URL
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      pdfUrl,
      pdfGeneratedAt: new Date(),
    },
  });

  return {
    pdfUrl,
    filename,
    size: buffer.length,
  };
}
