/**
 * Use Case: Invoice Management
 * 
 * Upravljanje z računi (generate, send, pay, refund).
 */

import { Invoice } from '../domain/tourism/entities/invoice'
import { Money } from '../shared/value-objects/money'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetInvoicesInput {
  userId: string
  userRole: string
  status?: string
  dateFrom?: string
  dateTo?: string
  recurring?: string
  limit?: number
  offset?: number
}

export interface GetInvoicesOutput {
  invoices: any[]
  total: number
  hasMore: boolean
}

export interface GenerateInvoiceInput {
  reservationId: string
  guestId: string
  propertyId: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
  }>
  notes?: string
  paymentTerms?: string
}

export interface GenerateInvoiceOutput {
  invoice: Invoice
  invoiceNumber: string
  totalAmount: Money
}

export interface SendInvoiceInput {
  invoiceId: string
  guestEmail: string
  template?: string
}

export interface SendInvoiceOutput {
  success: boolean
  sentAt: Date
}

export interface PayInvoiceInput {
  invoiceId: string
  paymentMethod: string
  paymentData: Record<string, any>
}

export interface PayInvoiceOutput {
  success: boolean
  transactionId: string
  paidAt: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class InvoiceManagement {
  constructor(
    private invoiceRepository: InvoiceRepository,
    private reservationRepository: ReservationRepository,
    private paymentGateway: PaymentGateway
  ) {}

  /**
   * Pridobi vse račune s filtri
   */
  async getInvoices(input: GetInvoicesInput): Promise<GetInvoicesOutput> {
    const { userId, userRole, status, dateFrom, dateTo, recurring, limit = 50, offset = 0 } = input

    // Validate access
    if (!['admin', 'receptor'].includes(userRole)) {
      throw new Error('Receptor or Admin access required')
    }

    // TODO: Fetch from repository with filters
    // const invoices = await this.invoiceRepository.findAll({
    //   status,
    //   dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    //   dateTo: dateTo ? new Date(dateTo) : undefined,
    //   recurring: recurring === 'true',
    //   limit,
    //   offset
    // })

    // Mock response
    return {
      invoices: [],
      total: 0,
      hasMore: false
    }
  }

  /**
   * Generiraj račun za rezervacijo
   */
  async generateInvoice(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput> {
    const { reservationId, guestId, propertyId, items, notes, paymentTerms } = input

    // 1. Pridobi rezervacijo
    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    // 2. Ustvari račun
    const invoice = Invoice.create({
      type: 'reservation',
      status: 'draft',
      reservationId,
      guestId,
      propertyId,
      issueDate: new Date(),
      dueDate: this.calculateDueDate(),
      items: [],
      notes: notes || 'Payment due within 7 days. Thank you for your business!',
      metadata: { paymentTerms }
    })

    // 3. Dodaj postavke
    for (const item of items) {
      invoice.addItem(
        item.description,
        item.quantity,
        new Money(item.unitPrice, 'EUR'),
        item.taxRate || 22
      )
    }

    // 4. Shrani račun
    await this.invoiceRepository.save(invoice)

    return {
      invoice,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount
    }
  }

  /**
   * Pošlji račun gostu
   */
  async sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceOutput> {
    const { invoiceId, guestEmail, template = 'standard' } = input

    // 1. Pridobi račun
    const invoice = await this.invoiceRepository.findById(invoiceId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // 2. Posodobi status
    invoice.status = 'sent'
    await this.invoiceRepository.save(invoice)

    // 3. Pošlji email
    // TODO: Implement email sending
    // await emailService.send({
    //   to: guestEmail,
    //   subject: `Invoice ${invoice.invoiceNumber}`,
    //   template,
    //   data: invoice.toJSON()
    // })

    return {
      success: true,
      sentAt: new Date()
    }
  }

  /**
   * Obdelaj plačilo računa
   */
  async payInvoice(input: PayInvoiceInput): Promise<PayInvoiceOutput> {
    const { invoiceId, paymentMethod, paymentData } = input

    // 1. Pridobi račun
    const invoice = await this.invoiceRepository.findById(invoiceId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // 2. Obdelaj plačilo preko gateway-ja
    const paymentResult = await this.paymentGateway.charge({
      amount: invoice.totalAmount.amount,
      currency: 'EUR',
      method: paymentMethod,
      ...paymentData
    })

    // 3. Posodobi račun
    invoice.markAsPaid()
    await this.invoiceRepository.save(invoice)

    return {
      success: true,
      transactionId: paymentResult.transactionId,
      paidAt: new Date()
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Izračunaj zapadlost računa (privzeto 14 dni)
   */
  private calculateDueDate(): Date {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    return dueDate
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>
  findAll(filters: any): Promise<Invoice[]>
  save(invoice: Invoice): Promise<void>
  delete(id: string): Promise<void>
}

export interface ReservationRepository {
  findById(id: string): Promise<any | null>
}

export interface PaymentGateway {
  charge(input: any): Promise<{ transactionId: string; response: any }>
}
