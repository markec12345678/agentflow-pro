/**
 * Use Case: Process Payment
 * 
 * Process payment for invoice or reservation.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface ProcessPaymentInput {
  invoiceId?: string
  reservationId?: string
  userId: string
  amount: number
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'stripe'
  paymentData: Record<string, any>
  saveCard?: boolean
}

export interface ProcessPaymentOutput {
  success: boolean
  paymentId: string
  transactionId: string
  status: 'completed' | 'pending' | 'failed'
  amount: number
  processedAt: Date
  error?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class ProcessPayment {
  constructor(
    private paymentRepository: PaymentRepository,
    private invoiceRepository: InvoiceRepository,
    private paymentGateway: PaymentGateway
  ) {}

  /**
   * Process payment
   */
  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
    const { invoiceId, reservationId, userId, amount, paymentMethod, paymentData, saveCard = false } = input

    // 1. Validate input
    if (!invoiceId && !reservationId) {
      throw new Error('Either invoiceId or reservationId must be provided')
    }

    // 2. Create payment record
    const payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId,
      reservationId,
      userId,
      amount,
      paymentMethod,
      status: 'pending' as const,
      createdAt: new Date()
    }

    await this.paymentRepository.save(payment)

    // 3. Process payment through gateway
    try {
      const gatewayResult = await this.paymentGateway.charge({
        amount,
        currency: 'EUR',
        method: paymentMethod,
        data: paymentData,
        saveCard
      })

      // 4. Update payment status
      payment.status = 'completed'
      payment.transactionId = gatewayResult.transactionId
      payment.processedAt = new Date()
      await this.paymentRepository.save(payment)

      // 5. Update invoice if provided
      if (invoiceId) {
        await this.invoiceRepository.markAsPaid(invoiceId, payment.id)
      }

      return {
        success: true,
        paymentId: payment.id,
        transactionId: gatewayResult.transactionId,
        status: 'completed',
        amount,
        processedAt: payment.processedAt
      }
    } catch (error: any) {
      // 6. Handle error
      payment.status = 'failed'
      payment.metadata = { error: error.message }
      await this.paymentRepository.save(payment)

      return {
        success: false,
        paymentId: payment.id,
        transactionId: '',
        status: 'failed',
        amount,
        processedAt: new Date(),
        error: error.message
      }
    }
  }
}

// ============================================================================
// Repository/Gateway Interfaces
// ============================================================================

export interface PaymentRepository {
  save(payment: any): Promise<void>
  findById(id: string): Promise<any | null>
  findByInvoice(invoiceId: string): Promise<any[]>
}

export interface InvoiceRepository {
  markAsPaid(invoiceId: string, paymentId: string): Promise<void>
}

export interface PaymentGateway {
  charge(data: {
    amount: number
    currency: string
    method: string
    data: Record<string, any>
    saveCard?: boolean
  }): Promise<{
    transactionId: string
    status: 'success' | 'failed'
    response: any
  }>
}
