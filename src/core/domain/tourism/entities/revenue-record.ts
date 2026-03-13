/**
 * Domain Entity: RevenueRecord
 * 
 * Dnevni zapis prihodka po kategorijah.
 * Uporablja se za financial analytics in reporting.
 */

import { Money } from '../shared/value-objects/money'

export type RevenueCategory = 'room' | 'food_beverage' | 'services' | 'extras' | 'refund'
export type RevenueSource = 'reservation' | 'walk_in' | 'upgrade' | 'cancellation' | 'other'

export interface RevenueRecordData {
  id: string
  propertyId: string
  date: Date
  category: RevenueCategory
  source: RevenueSource
  grossAmount: Money
  netAmount: Money
  taxAmount: Money
  refunds: Money
  discounts: Money
  numberOfTransactions: number
  averageTransactionValue: Money
  metadata?: Record<string, any>
}

export class RevenueRecord {
  public readonly id: string
  public readonly propertyId: string
  public readonly date: Date
  public readonly category: RevenueCategory
  public readonly source: RevenueSource
  public grossAmount: Money
  public netAmount: Money
  public taxAmount: Money
  public refunds: Money
  public discounts: Money
  public numberOfTransactions: number
  public averageTransactionValue: Money
  public metadata?: Record<string, any>

  constructor(data: RevenueRecordData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.date = data.date
    this.category = data.category
    this.source = data.source
    this.grossAmount = data.grossAmount
    this.netAmount = data.netAmount
    this.taxAmount = data.taxAmount
    this.refunds = data.refunds
    this.discounts = data.discounts
    this.numberOfTransactions = data.numberOfTransactions
    this.averageTransactionValue = data.averageTransactionValue
    this.metadata = data.metadata
  }

  /**
   * Dodaj transakcijo
   */
  addTransaction(amount: Money, taxRate: number = 22): void {
    const tax = amount.multiply(taxRate / 100)
    const net = amount.subtract(tax)

    this.grossAmount = this.grossAmount.add(amount)
    this.taxAmount = this.taxAmount.add(tax)
    this.netAmount = this.netAmount.add(net)
    this.numberOfTransactions += 1

    // Recalculate average
    this.averageTransactionValue = new Money(
      this.grossAmount.amount / this.numberOfTransactions,
      'EUR'
    )
  }

  /**
   * Dodaj refundacijo
   */
  addRefund(amount: Money): void {
    this.refunds = this.refunds.add(amount)
    this.grossAmount = this.grossAmount.subtract(amount)
  }

  /**
   * Dodaj popust
   */
  addDiscount(amount: Money): void {
    this.discounts = this.discounts.add(amount)
  }

  /**
   * Izračunaj skupni neto prihodek
   */
  totalNetRevenue(): Money {
    return this.netAmount.subtract(this.refunds)
  }

  /**
   * Izračunaj skupni bruto prihodek
   */
  totalGrossRevenue(): Money {
    return this.grossAmount
  }

  /**
   * Izračunaj effective tax rate
   */
  effectiveTaxRate(): number {
    if (this.grossAmount.amount === 0) return 0
    return (this.taxAmount.amount / this.grossAmount.amount) * 100
  }

  /**
   * Izračunaj refund rate
   */
  refundRate(): number {
    if (this.grossAmount.amount === 0) return 0
    return (this.refunds.amount / this.grossAmount.amount) * 100
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): RevenueRecordData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      date: this.date,
      category: this.category,
      source: this.source,
      grossAmount: this.grossAmount,
      netAmount: this.netAmount,
      taxAmount: this.taxAmount,
      refunds: this.refunds,
      discounts: this.discounts,
      numberOfTransactions: this.numberOfTransactions,
      averageTransactionValue: this.averageTransactionValue,
      metadata: this.metadata
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      date: this.date.toISOString(),
      grossAmount: this.grossAmount.toJSON(),
      netAmount: this.netAmount.toJSON(),
      taxAmount: this.taxAmount.toJSON(),
      refunds: this.refunds.toJSON(),
      discounts: this.discounts.toJSON(),
      averageTransactionValue: this.averageTransactionValue.toJSON()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): RevenueRecord {
    return new RevenueRecord({
      ...json,
      date: new Date(json.date),
      grossAmount: Money.fromJSON(json.grossAmount),
      netAmount: Money.fromJSON(json.netAmount),
      taxAmount: Money.fromJSON(json.taxAmount),
      refunds: Money.fromJSON(json.refunds),
      discounts: Money.fromJSON(json.discounts),
      averageTransactionValue: Money.fromJSON(json.averageTransactionValue)
    })
  }

  /**
   * Ustvari nov revenue record
   */
  static create(
    propertyId: string,
    date: Date,
    category: RevenueCategory,
    source: RevenueSource
  ): RevenueRecord {
    return new RevenueRecord({
      id: `rev_${date.toISOString().split('T')[0]}_${category}_${source}`,
      propertyId,
      date,
      category,
      source,
      grossAmount: Money.zero('EUR'),
      netAmount: Money.zero('EUR'),
      taxAmount: Money.zero('EUR'),
      refunds: Money.zero('EUR'),
      discounts: Money.zero('EUR'),
      numberOfTransactions: 0,
      averageTransactionValue: Money.zero('EUR')
    })
  }
}
