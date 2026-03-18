/**
 * Invoice PDF Template Generator
 * 
 * Generates PDF invoices with Slovenian tax requirements
 * Uses @react-pdf/renderer for PDF generation
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register Slovenian font (optional, for special characters)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
// });

export interface InvoiceData {
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Supplier (Your company)
  supplierName: string;
  supplierAddress: string;
  supplierRegistration?: string; // Matična številka
  supplierVAT?: string;          // DDV številka
  supplierEmail?: string;
  supplierPhone?: string;
  
  // Guest/Company
  guestName: string;
  guestAddress: string;
  guestVAT?: string;
  guestEmail?: string;
  guestPhone?: string;
  
  // Stay details
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  roomName: string;
  propertyName?: string;
  
  // Items
  accommodation: number;      // Base price
  touristTax: number;         // Turistična taksa
  vatRate: number;            // 22%
  
  // Totals
  subtotal: number;
  vatAmount: number;
  total: number;
  
  // Additional
  notes?: string;
  paymentInstructions?: string;
}

const styles = StyleSheet.create({
  document: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  
  // Header
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  supplierDetails: {
    fontSize: 9,
    color: '#666',
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  invoiceTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
  },
  
  // Guest info
  guestSection: {
    marginBottom: 20,
  },
  guestLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  guestName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  guestAddress: {
    fontSize: 10,
    color: '#333',
  },
  
  // Stay details
  staySection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  stayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  stayLabel: {
    fontSize: 9,
    color: '#666',
  },
  stayValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Items table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' as const },
  col3: { flex: 1, textAlign: 'right' as const },
  col4: { flex: 1, textAlign: 'right' as const },
  
  // Totals
  totalsSection: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
    marginRight: 20,
    width: 150,
    textAlign: 'right' as const,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right' as const,
  },
  grandTotal: {
    fontSize: 12,
    color: '#333',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingTop: 5,
    marginTop: 5,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Notes
  notesSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff9e6',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#333',
  },
  
  // Payment instructions
  paymentSection: {
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paymentDetails: {
    fontSize: 9,
    color: '#333',
  },
});

/**
 * Format number as EUR currency
 */
function formatEUR(amount: number): string {
  return `€ ${amount.toFixed(2)}`;
}

/**
 * Format date as DD. MM. YYYY
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('sl-SI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generate Invoice PDF Document
 */
export const InvoicePDF = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.document}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.supplierInfo}>
            <Text style={styles.supplierName}>{data.supplierName}</Text>
            <Text style={styles.supplierDetails}>{data.supplierAddress}</Text>
            {data.supplierRegistration && (
              <Text style={styles.supplierDetails}>
                Matična št.: {data.supplierRegistration}
              </Text>
            )}
            {data.supplierVAT && (
              <Text style={styles.supplierDetails}>
                DDV: {data.supplierVAT}
              </Text>
            )}
            {data.supplierEmail && (
              <Text style={styles.supplierDetails}>
                Email: {data.supplierEmail}
              </Text>
            )}
            {data.supplierPhone && (
              <Text style={styles.supplierDetails}>
                Tel: {data.supplierPhone}
              </Text>
            )}
          </View>
          
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>RAČUN</Text>
            <Text style={styles.invoiceNumber}>
              Št.: {data.invoiceNumber}
            </Text>
            <Text style={styles.invoiceNumber}>
              Datum: {formatDate(data.invoiceDate)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Guest Info */}
      <View style={styles.guestSection}>
        <Text style={styles.guestLabel}>Račun za:</Text>
        <Text style={styles.guestName}>{data.guestName}</Text>
        <Text style={styles.guestAddress}>{data.guestAddress}</Text>
        {data.guestVAT && (
          <Text style={styles.guestDetails}>
            DDV: {data.guestVAT}
          </Text>
        )}
      </View>
      
      {/* Stay Details */}
      <View style={styles.staySection}>
        <View style={styles.stayRow}>
          <View>
            <Text style={styles.stayLabel}>Namestitev</Text>
            <Text style={styles.stayValue}>
              {data.propertyName || data.roomName}
            </Text>
          </View>
          <View>
            <Text style={styles.stayLabel}>Prihod</Text>
            <Text style={styles.stayValue}>{formatDate(data.checkIn)}</Text>
          </View>
          <View>
            <Text style={styles.stayLabel}>Odhod</Text>
            <Text style={styles.stayValue}>{formatDate(data.checkOut)}</Text>
          </View>
          <View>
            <Text style={styles.stayLabel}>Nočitve</Text>
            <Text style={styles.stayValue}>{data.nights}</Text>
          </View>
        </View>
        <View style={styles.stayRow}>
          <View>
            <Text style={styles.stayLabel}>Gostje</Text>
            <Text style={styles.stayValue}>
              {data.adults} odraslih, {data.children} otrok
            </Text>
          </View>
        </View>
      </View>
      
      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Opis</Text>
          <Text style={styles.col2}>Količina</Text>
          <Text style={styles.col3}>Cena</Text>
          <Text style={styles.col4}>Znesek</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.col1}>
            Nastanitev ({data.nights} nočitev)
          </Text>
          <Text style={styles.col2}>{data.nights}</Text>
          <Text style={styles.col3}>{formatEUR(data.accommodation / data.nights)}</Text>
          <Text style={styles.col4}>{formatEUR(data.accommodation)}</Text>
        </View>
        
        <View style={[styles.tableRow, styles.tableRowAlt]}>
          <Text style={styles.col1}>Turistična taksa</Text>
          <Text style={styles.col2}>{data.adults + data.children} oseb</Text>
          <Text style={styles.col3}>-</Text>
          <Text style={styles.col4}>{formatEUR(data.touristTax)}</Text>
        </View>
      </View>
      
      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Osnova:</Text>
          <Text style={styles.totalValue}>
            {formatEUR(data.subtotal)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>DDV ({data.vatRate}%):</Text>
          <Text style={styles.totalValue}>
            {formatEUR(data.vatAmount)}
          </Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>
            SKUPAJ:
          </Text>
          <Text style={[styles.totalValue, { fontSize: 12 }]}>
            {formatEUR(data.total)}
          </Text>
        </View>
      </View>
      
      {/* Notes */}
      {data.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Opombe:</Text>
          <Text style={styles.notesText}>{data.notes}</Text>
        </View>
      )}
      
      {/* Payment Instructions */}
      {data.paymentInstructions && (
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>Navodila za plačilo:</Text>
          <Text style={styles.paymentDetails}>
            {data.paymentInstructions}
          </Text>
        </View>
      )}
      
      {/* Footer */}
      <View style={styles.footer} fixed>
        <View style={styles.footerRow}>
          <Text>
            {data.supplierName} | {data.supplierAddress}
          </Text>
          <Text>
            Stran 1/1
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

/**
 * Generate invoice PDF buffer (for use in API routes)
 * 
 * @param data - Invoice data
 * @returns PDF buffer
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const { pdf } = await import('@react-pdf/renderer');
  const document = <InvoicePDF data={data} />;
  const buffer = await pdf(document).toBuffer();
  return buffer;
}

export default InvoicePDF;
