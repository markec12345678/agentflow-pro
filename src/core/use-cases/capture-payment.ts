/**
 * Use Case: Capture Payment
 * 
 * Obdelaj plačilo za račun ali rezervacijo.
 */

import { Payment } from '../domain/tourism/entities/payment'
import { Invoice } from '../domain/tourism/entities/invoice'
import { Reservation } from '../domain/tourism/entities/reservation'
import { Money } from '../shared/value-objects/money'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CapturePaymentInput {
  invoiceId?: string
  reservationId?: string
  guestId: string
  amount: Money
  method: PaymentMethod
  providerData?: Record<string, any>
}

export interface CapturePaymentOutput {
  payment: Payment
  transactionId: string
  status: PaymentStatus
  amount: Money
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'paypal' | 'stripe'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'

// ============================================================================
// Use Case Class
// ============================================================================

export class CapturePayment {
  constructor(
    private paymentRepository: PaymentRepository,
    private invoiceRepository: InvoiceRepository,
    private paymentGateway: PaymentGateway
  ) {}

  /**
   * Obdelaj plačilo
   */
  async execute(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const { invoiceId, reservationId, guestId, amount, method, providerData } = input

    // 1. Validacija
    this.validateInput(input)

    // 2. Ustvari payment entity
    const payment = Payment.create({
      invoiceId,
      reservationId,
      guestId,
      amount,
      method,
      type: 'charge'
    })

    try {
      // 3. Obdelaj plačilo preko payment gateway-ja
      const gatewayResult = await this.paymentGateway.charge({
        amount: amount.amount,
        currency: amount.currency,
        method,
        guestId,
        metadata: {
          invoiceId,
          reservationId
        },
        ...providerData
      })

      // 4. Označi kot uspešno
      payment.markAsProcessed(gatewayResult.transactionId, gatewayResult.response)

      // 5. Posodobi invoice (če obstaja)
      if (invoiceId) {
        await this.updateInvoicePayment(invoiceId, amount)
      }

      // 6. Shrani payment
      await this.paymentRepository.save(payment)

      // 7. Vrni rezultat
      return {
        payment,
        transactionId: gatewayResult.transactionId,
        status: payment.status,
        amount
      }
    } catch (error: any) {
      // 8. Obdelaj napako
      payment.markAsFailed(error.message)
      await this.paymentRepository.save(payment)
      throw error
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj input
   */
  private validateInput(input: CapturePaymentInput): void {
    const { amount, method } = input

    if (amount.amount <= 0) {
      throw new Error('Payment amount must be positive')
    }

    if (!['credit_card', 'debit_card', 'bank_transfer', 'cash', 'paypal', 'stripe'].includes(method)) {
      throw new Error('Invalid payment method')
    }

    if (!input.invoiceId && !input.reservationId) {
      throw new Error('Either invoiceId or reservationId must be provided')
    }
  }

  /**
   * Posodobi invoice payment
   */
  private async updateInvoicePayment(invoiceId: string, amount: Money): Promise<void> {
    const invoice = await this.invoiceRepository.findById(invoiceId)
    
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`)
    }

    invoice.updatePaidAmount(amount)
    await this.invoiceRepository.save(invoice)
  }
}

// ============================================================================
// Gateway Interface
// ============================================================================

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>
  refund(input: RefundInput): Promise<RefundResult>
}

export interface ChargeInput {
  amount: number
  currency: string
  method: PaymentMethod
  guestId: string
  metadata?: Record<string, any>
  [key: string]: any
}

export interface ChargeResult {
  transactionId: string
  response: Record<string, any>
  status: 'success' | 'failed'
}

export interface RefundInput {
  transactionId: string
  amount: number
  reason?: string
}

export interface RefundResult {
  transactionId: string
  response: Record<string, any>
  status: 'success' | 'failed'
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>
  findByTransactionId(transactionId: string): Promise<Payment | null>
  findByGuest(guestId: string): Promise<Payment[]>
  findByInvoice(invoiceId: string): Promise<Payment[]>
  save(payment: Payment): Promise<void>
  delete(id: string): Promise<void>
}
