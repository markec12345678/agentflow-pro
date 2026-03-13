/**
 * Use Case: Process Refund
 * 
 * Process refund for payment.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface ProcessRefundInput {
  paymentId: string
  userId: string
  amount?: number // Full refund if not specified
  reason: string
}

export interface ProcessRefundOutput {
  success: boolean
  refundId: string
  transactionId: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  processedAt: Date
  error?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class ProcessRefund {
  constructor(
    private refundRepository: RefundRepository,
    private paymentRepository: PaymentRepository = new PaymentRepositoryImpl(),
    private paymentGateway: PaymentGateway
  ) {}

  /**
   * Process refund
   */
  async execute(input: ProcessRefundInput): Promise<ProcessRefundOutput> {
    const { paymentId, userId, amount, reason } = input

    // 1. Get payment
    const payment = await this.paymentRepository.findById(paymentId)
    if (!payment) {
      throw new Error('Payment not found')
    }

    // 2. Validate refund amount
    const refundAmount = amount || payment.amount
    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount')
    }

    // 3. Create refund record
    const refund = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentId,
      userId,
      amount: refundAmount,
      reason,
      status: 'pending' as const,
      createdAt: new Date()
    }

    await this.refundRepository.save(refund)

    // 4. Process refund through gateway
    try {
      const gatewayResult = await this.paymentGateway.refund({
        transactionId: payment.transactionId,
        amount: refundAmount,
        reason
      })

      // 5. Update refund status
      refund.status = 'completed'
      refund.transactionId = gatewayResult.transactionId
      refund.processedAt = new Date()
      await this.refundRepository.save(refund)

      // 6. Update payment status
      await this.paymentRepository.markAsRefunded(paymentId, refund.id, refundAmount)

      return {
        success: true,
        refundId: refund.id,
        transactionId: gatewayResult.transactionId,
        amount: refundAmount,
        status: 'completed',
        processedAt: refund.processedAt
      }
    } catch (error: any) {
      // 7. Handle error
      refund.status = 'failed'
      refund.metadata = { error: error.message }
      await this.refundRepository.save(refund)

      return {
        success: false,
        refundId: refund.id,
        transactionId: '',
        amount: refundAmount,
        status: 'failed',
        processedAt: new Date(),
        error: error.message
      }
    }
  }
}

// ============================================================================
// Repository/Gateway Interfaces
// ============================================================================

export interface RefundRepository {
  save(refund: any): Promise<void>
  findById(id: string): Promise<any | null>
  findByPayment(paymentId: string): Promise<any[]>
}

export interface PaymentRepository {
  findById(id: string): Promise<any | null>
  markAsRefunded(paymentId: string, refundId: string, amount: number): Promise<void>
}

export interface PaymentGateway {
  refund(data: {
    transactionId: string
    amount: number
    reason: string
  }): Promise<{
    transactionId: string
    status: 'success' | 'failed'
    response: any
  }>
}
