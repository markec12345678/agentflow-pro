/**
 * Domain Entity: Payment
 * 
 * Plačilo za račun ali rezervacijo.
 * Vsebuje informacije o transakciji, statusu in refundacijah.
 */

import { Money } from '../shared/value-objects/money'

export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'paypal' | 'stripe'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentType = 'charge' | 'refund'

export interface PaymentData {
  id: string
  invoiceId?: string
  reservationId?: string
  guestId: string
  amount: Money
  refundAmount?: Money
  method: PaymentMethod
  type: PaymentType
  status: PaymentStatus
  transactionId?: string
  providerResponse?: Record<string, any>
  processedAt?: Date
  refundedAt?: Date
  notes?: string
  metadata?: Record<string, any>
}

export class Payment {
  public readonly id: string
  public readonly invoiceId?: string
  public readonly reservationId?: string
  public readonly guestId: string
  public amount: Money
  public refundAmount?: Money
  public method: PaymentMethod
  public type: PaymentType
  public status: PaymentStatus
  public transactionId?: string
  public providerResponse?: Record<string, any>
  public processedAt?: Date
  public refundedAt?: Date
  public notes?: string
  public metadata?: Record<string, any>

  constructor(data: PaymentData) {
    this.id = data.id
    this.invoiceId = data.invoiceId
    this.reservationId = data.reservationId
    this.guestId = data.guestId
    this.amount = data.amount
    this.refundAmount = data.refundAmount
    this.method = data.method
    this.type = data.type
    this.status = data.status
    this.transactionId = data.transactionId
    this.providerResponse = data.providerResponse
    this.processedAt = data.processedAt
    this.refundedAt = data.refundedAt
    this.notes = data.notes
    this.metadata = data.metadata
  }

  /**
   * Označi plačilo kot uspešno obdelano
   */
  markAsProcessed(transactionId: string, providerResponse?: Record<string, any>): void {
    this.status = 'completed'
    this.transactionId = transactionId
    this.providerResponse = providerResponse
    this.processedAt = new Date()
  }

  /**
   * Označi plačilo kot neuspešno
   */
  markAsFailed(error?: string): void {
    this.status = 'failed'
    if (error) {
      this.notes = error
    }
  }

  /**
   * Začni refundacijo
   */
  initiateRefund(amount: Money): void {
    if (this.status !== 'completed') {
      throw new Error('Can only refund completed payments')
    }

    if (amount.amount > this.amount.amount) {
      throw new Error('Refund amount cannot exceed original payment')
    }

    this.refundAmount = amount
    this.status = amount.amount >= this.amount.amount ? 'refunded' : 'partially_refunded'
  }

  /**
   * Dokončaj refundacijo
   */
  completeRefund(refundTransactionId: string): void {
    if (!this.refundAmount) {
      throw new Error('No refund initiated')
    }

    this.status = this.refundAmount.amount >= this.amount.amount ? 'refunded' : 'partially_refunded'
    this.refundedAt = new Date()
    this.transactionId = refundTransactionId
  }

  /**
   * Preveri ali je plačilo v celoti refundirano
   */
  isFullyRefunded(): boolean {
    return this.status === 'refunded' || (this.refundAmount && this.refundAmount.amount >= this.amount.amount)
  }

  /**
   * Preveri ali je delno refundirano
   */
  isPartiallyRefunded(): boolean {
    return this.status === 'partially_refunded'
  }

  /**
   * Preveri ali je plačilo uspešno
   */
  isSuccess(): boolean {
    return this.status === 'completed' || this.status === 'refunded' || this.status === 'partially_refunded'
  }

  /**
   * Izračunaj znesek ki ga je mogoče refundirati
   */
  refundableAmount(): Money {
    if (!this.isSuccess()) {
      return Money.zero('EUR')
    }

    if (!this.refundAmount) {
      return this.amount
    }

    return this.amount.subtract(this.refundAmount)
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): PaymentData {
    return {
      id: this.id,
      invoiceId: this.invoiceId,
      reservationId: this.reservationId,
      guestId: this.guestId,
      amount: this.amount,
      refundAmount: this.refundAmount,
      method: this.method,
      type: this.type,
      status: this.status,
      transactionId: this.transactionId,
      providerResponse: this.providerResponse,
      processedAt: this.processedAt,
      refundedAt: this.refundedAt,
      notes: this.notes,
      metadata: this.metadata
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      amount: this.amount.toJSON(),
      refundAmount: this.refundAmount?.toJSON(),
      processedAt: this.processedAt?.toISOString(),
      refundedAt: this.refundedAt?.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Payment {
    return new Payment({
      ...json,
      amount: Money.fromJSON(json.amount),
      refundAmount: json.refundAmount ? Money.fromJSON(json.refundAmount) : undefined,
      processedAt: json.processedAt ? new Date(json.processedAt) : undefined,
      refundedAt: json.refundedAt ? new Date(json.refundedAt) : undefined
    })
  }

  /**
   * Ustvari novo plačilo
   */
  static create(data: Omit<PaymentData, 'id' | 'status'>): Payment {
    return new Payment({
      ...data,
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    })
  }
}
