/**
 * AgentFlow Pro - Invoice Generation Service
 * 
 * Features:
 * - Automated invoice creation
 * - VAT/tax calculation
 * - Multi-language templates
 * - PDF generation
 * - Email delivery
 */

import { prisma } from '@/database/schema';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type?: 'room' | 'tax' | 'service' | 'other';
}

export interface CreateInvoiceOptions {
  reservationId: string;
  propertyId: string;
  guestId?: string;
  dueDate: Date;
  taxRate?: number; // VAT percentage
  items: InvoiceLineItem[];
  notes?: string;
  language?: 'sl' | 'en' | 'de' | 'it';
}

export interface InvoiceTemplate {
  header: string;
  propertyInfo: string;
  guestInfo: string;
  invoiceDetails: string;
  lineItems: string;
  totals: string;
  footer: string;
  paymentTerms: string;
}

const INVOICE_TEMPLATES: Record<string, InvoiceTemplate> = {
  sl: {
    header: 'RAČUN',
    propertyInfo: 'Podatki o nastanitvi:',
    guestInfo: 'Podatki o gostu:',
    invoiceDetails: 'Podatki o računu:',
    lineItems: 'Postavke:',
    totals: 'Skupaj:',
    footer: 'Hvala za vaše zaupanje!',
    paymentTerms: 'Plačilni pogoji: Plačilo v roku 8 dni.',
  },
  en: {
    header: 'INVOICE',
    propertyInfo: 'Property Information:',
    guestInfo: 'Guest Information:',
    invoiceDetails: 'Invoice Details:',
    lineItems: 'Line Items:',
    totals: 'Totals:',
    footer: 'Thank you for your stay!',
    paymentTerms: 'Payment Terms: Payment due within 8 days.',
  },
  de: {
    header: 'RECHNUNG',
    propertyInfo: 'Unterkunftsinformationen:',
    guestInfo: 'Gastinformationen:',
    invoiceDetails: 'Rechnungsdetails:',
    lineItems: 'Positionen:',
    totals: 'Gesamt:',
    footer: 'Vielen Dank für Ihren Aufenthalt!',
    paymentTerms: 'Zahlungsbedingungen: Zahlung innerhalb von 8 Tagen.',
  },
  it: {
    header: 'FATTURA',
    propertyInfo: 'Informazioni sulla struttura:',
    guestInfo: 'Informazioni sull\'ospite:',
    invoiceDetails: 'Dettagli fattura:',
    lineItems: 'Voci:',
    totals: 'Totali:',
    footer: 'Grazie per il vostro soggiorno!',
    paymentTerms: 'Termini di pagamento: Pagamento entro 8 giorni.',
  },
};

export class InvoiceGenerationService {
  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(propertyId: string): Promise<string> {
    const year = new Date().getFullYear();
    
    // Get count of invoices for this property this year
    const count = await prisma.invoice.count({
      where: {
        propertyId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    const sequence = (count + 1).toString().padStart(5, '0');
    return `INV-${year}-${sequence}`;
  }

  /**
   * Create invoice from reservation
   */
  async createInvoice(options: CreateInvoiceOptions): Promise<{
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
  }> {
    const {
      reservationId,
      propertyId,
      guestId,
      dueDate,
      taxRate = 22, // Default Slovenian VAT
      items,
      notes,
      language = 'sl',
    } = options;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(propertyId);

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        reservationId,
        propertyId,
        guestId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate,
        status: 'draft',
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        items: items as any,
        notes,
      },
      include: {
        reservation: {
          include: {
            guest: true,
            property: true,
          },
        },
      },
    });

    return {
      invoiceId: invoice.id,
      invoiceNumber,
      totalAmount,
    };
  }

  /**
   * Generate HTML invoice for PDF conversion
   */
  async generateInvoiceHtml(invoiceId: string, language: 'sl' | 'en' | 'de' | 'it' = 'sl'): Promise<string> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        reservation: {
          include: {
            guest: true,
            property: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const template = INVOICE_TEMPLATES[language];
    const items = invoice.items as InvoiceLineItem[];

    const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.header} ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: right; margin-bottom: 40px; }
    .header h1 { color: #1e40af; margin: 0; font-size: 32px; }
    .invoice-number { font-size: 18px; color: #666; margin-top: 10px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 600; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .info-row { margin-bottom: 5px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f3f4f6; text-align: left; padding: 12px; font-weight: 600; font-size: 14px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 12px; }
    .totals-row.total { background: #1e40af; color: white; font-weight: bold; font-size: 16px; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    .payment-terms { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${template.header}</h1>
    <div class="invoice-number">#${invoice.invoiceNumber}</div>
  </div>

  <div class="section">
    <div class="section-title">${template.propertyInfo}</div>
    <div class="info-box">
      <div class="info-row"><strong>${invoice.reservation.property.name}</strong></div>
      <div class="info-row">${invoice.reservation.property.location || ''}</div>
      <div class="info-row">${invoice.reservation.property.description || ''}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${template.guestInfo}</div>
    <div class="info-box">
      <div class="info-row"><strong>${invoice.reservation.guest?.name || invoice.reservation.guestName || 'N/A'}</strong></div>
      <div class="info-row">${invoice.reservation.guest?.email || ''}</div>
      <div class="info-row">${invoice.reservation.guest?.phone || ''}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${template.invoiceDetails}</div>
    <div class="info-box">
      <div class="info-row"><strong>${template.invoiceDetails}</strong></div>
      <div class="info-row">Invoice Date: ${format(invoice.issueDate, 'dd. MMMM yyyy', { locale: sl })}</div>
      <div class="info-row">Due Date: ${format(invoice.dueDate, 'dd. MMMM yyyy', { locale: sl })}</div>
      <div class="info-row">Reservation: ${invoice.reservation.id}</div>
      <div class="info-row">Status: ${invoice.status.toUpperCase()}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${template.lineItems}</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td style="text-align: right;">${item.quantity}</td>
            <td style="text-align: right;">€${item.unitPrice.toFixed(2)}</td>
            <td style="text-align: right;">€${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>€${invoice.subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>VAT (${invoice.taxRate}%):</span>
      <span>€${invoice.taxAmount.toFixed(2)}</span>
    </div>
    <div class="totals-row total">
      <span>${template.totals}</span>
      <span>€${invoice.totalAmount.toFixed(2)}</span>
    </div>
  </div>

  ${invoice.notes ? `
    <div class="section">
      <div class="section-title">Notes:</div>
      <div class="info-box">${invoice.notes}</div>
    </div>
  ` : ''}

  <div class="payment-terms">
    <strong>${template.paymentTerms}</strong>
  </div>

  <div class="footer">
    <div>${template.footer}</div>
    <div style="margin-top: 10px;">
      Generated by AgentFlow Pro on ${format(new Date(), 'dd. MMMM yyyy \'at\' HH:mm', { locale: sl })}
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Auto-generate invoice from reservation
   */
  async generateInvoiceFromReservation(
    reservationId: string,
    options?: {
      dueDate?: Date;
      taxRate?: number;
      language?: 'sl' | 'en' | 'de' | 'it';
      includeTax?: boolean;
    }
  ): Promise<{
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
  }> {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        property: true,
        room: true,
        payments: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const nights = Math.ceil(
      (reservation.checkOut.getTime() - reservation.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const items: InvoiceLineItem[] = [];

    // Room charge
    if (reservation.totalPrice) {
      items.push({
        description: `${reservation.room?.name || 'Room'} - ${nights} night${nights !== 1 ? 's' : ''}`,
        quantity: nights,
        unitPrice: reservation.totalPrice / nights,
        total: reservation.totalPrice,
        type: 'room',
      });
    }

    // Tourist tax
    if (reservation.touristTax) {
      const guests = reservation.guests || 1;
      items.push({
        description: `Tourist tax - ${guests} guest${guests !== 1 ? 's' : ''}`,
        quantity: guests * nights,
        unitPrice: reservation.touristTax / (guests * nights),
        total: reservation.touristTax,
        type: 'tax',
      });
    }

    // Already paid deposits
    const paidAmount = reservation.payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    if (paidAmount > 0) {
      items.push({
        description: 'Deposit (already paid)',
        quantity: 1,
        unitPrice: -paidAmount,
        total: -paidAmount,
        type: 'other',
      });
    }

    const dueDate = options?.dueDate || new Date(Date.now() + 8 * 24 * 60 * 60 * 1000); // 8 days

    return this.createInvoice({
      reservationId,
      propertyId: reservation.propertyId,
      guestId: reservation.guestId || undefined,
      dueDate,
      taxRate: options?.taxRate || 22,
      items,
      language: options?.language || 'sl',
    });
  }
}

// Singleton instance
export const invoiceGenerationService = new InvoiceGenerationService();
