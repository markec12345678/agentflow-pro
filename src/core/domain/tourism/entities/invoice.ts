/**
 * Domain Entity: Invoice
 * 
 * Račun za rezervacijo ali storitev.
 * Vsebuje postavke, davke in plačilne pogoje.
 */

import { Money } from '../shared/value-objects/money'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type InvoiceType = 'reservation' | 'service' | 'refund' | 'adjustment'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: Money
  totalPrice: Money
  taxRate: number // Percentage (e.g., 22 for 22% VAT)
}

export interface InvoiceData {
  id: string
  invoiceNumber: string
  type: InvoiceType
  status: InvoiceStatus
  reservationId?: string
  guestId: string
  propertyId: string
  issueDate: Date
  dueDate: Date
  items: InvoiceItem[]
  subtotal: Money
  taxAmount: Money
  totalAmount: Money
  paidAmount: Money
  notes?: string
  metadata?: Record<string, any>
}

export class Invoice {
  public readonly id: string
  public invoiceNumber: string
  public readonly type: InvoiceType
  public status: InvoiceStatus
  public readonly reservationId?: string
  public readonly guestId: string
  public readonly propertyId: string
  public readonly issueDate: Date
  public readonly dueDate: Date
  public items: InvoiceItem[]
  public subtotal: Money
  public taxAmount: Money
  public totalAmount: Money
  public paidAmount: Money
  public notes?: string
  public metadata?: Record<string, any>

  constructor(data: InvoiceData) {
    this.id = data.id
    this.invoiceNumber = data.invoiceNumber
    this.type = data.type
    this.status = data.status
    this.reservationId = data.reservationId
    this.guestId = data.guestId
    this.propertyId = data.propertyId
    this.issueDate = data.issueDate
    this.dueDate = data.dueDate
    this.items = data.items
    this.subtotal = data.subtotal
    this.taxAmount = data.taxAmount
    this.totalAmount = data.totalAmount
    this.paidAmount = data.paidAmount
    this.notes = data.notes
    this.metadata = data.metadata
  }

  /**
   * Dodaj postavko na račun
   */
  addItem(description: string, quantity: number, unitPrice: Money, taxRate: number = 22): void {
    const item: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description,
      quantity,
      unitPrice,
      totalPrice: unitPrice.multiply(quantity),
      taxRate
    }

    this.items.push(item)
    this.recalculateTotals()
  }

  /**
   * Odstrani postavko iz računa
   */
  removeItem(itemId: string): boolean {
    const index = this.items.findIndex(item => item.id === itemId)
    if (index !== -1) {
      this.items.splice(index, 1)
      this.recalculateTotals()
      return true
    }
    return false
  }

  /**
   * Posodobi status plačila
   */
  updatePaidAmount(amount: Money): void {
    this.paidAmount = this.paidAmount.add(amount)
    
    if (this.paidAmount.amount >= this.totalAmount.amount) {
      this.status = 'paid'
    } else if (this.paidAmount.amount > 0) {
      this.status = 'pending'
    }
  }

  /**
   * Označi račun kot plačan
   */
  markAsPaid(): void {
    this.paidAmount = this.totalAmount
    this.status = 'paid'
  }

  /**
   * Označi račun kot preklican
   */
  markAsCancelled(): void {
    this.status = 'cancelled'
  }

  /**
   * Označi račun kot refundiran
   */
  markAsRefunded(): void {
    this.status = 'refunded'
  }

  /**
   * Preveri ali je račun zapadel
   */
  isOverdue(): boolean {
    return this.status !== 'paid' && this.status !== 'cancelled' && new Date() > this.dueDate
  }

  /**
   * Izračunaj znesek ki ga je še treba plačati
   */
  amountDue(): Money {
    return this.totalAmount.subtract(this.paidAmount)
  }

  /**
   * Preveri ali je račun v celoti plačan
   */
  isFullyPaid(): boolean {
    return this.paidAmount.amount >= this.totalAmount.amount
  }

  /**
   * Ponovno izračunaj vse vsote
   */
  private recalculateTotals(): void {
    // Izračunaj subtotal
    this.subtotal = this.items.reduce((sum, item) => {
      return sum.add(item.totalPrice)
    }, Money.zero('EUR'))

    // Izračunaj davek
    let totalTax = Money.zero('EUR')
    for (const item of this.items) {
      const itemTax = item.totalPrice.multiply(item.taxRate / 100)
      totalTax = totalTax.add(itemTax)
    }
    this.taxAmount = totalTax

    // Izračunaj total
    this.totalAmount = this.subtotal.add(this.taxAmount)
  }

  /**
   * Generiraj PDF vsebino (placeholder)
   */
  generatePDFContent(): string {
    return `
      INVOICE ${this.invoiceNumber}
      ============================
      
      Issue Date: ${this.issueDate.toISOString().split('T')[0]}
      Due Date: ${this.dueDate.toISOString().split('T')[0]}
      Status: ${this.status.toUpperCase()}
      
      Bill To: Guest ${this.guestId}
      Property: ${this.propertyId}
      ${this.reservationId ? `Reservation: ${this.reservationId}` : ''}
      
      ITEMS:
      ${this.items.map(item => 
        `- ${item.description}: ${item.quantity} x ${item.unitPrice.toString()} = ${item.totalPrice.toString()}`
      ).join('\n')}
      
      Subtotal: ${this.subtotal.toString()}
      Tax: ${this.taxAmount.toString()}
      Total: ${this.totalAmount.toString()}
      Paid: ${this.paidAmount.toString()}
      Amount Due: ${this.amountDue().toString()}
      
      ${this.notes ? `Notes: ${this.notes}` : ''}
    `
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): InvoiceData {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      type: this.type,
      status: this.status,
      reservationId: this.reservationId,
      guestId: this.guestId,
      propertyId: this.propertyId,
      issueDate: this.issueDate,
      dueDate: this.dueDate,
      items: this.items,
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      totalAmount: this.totalAmount,
      paidAmount: this.paidAmount,
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
      subtotal: this.subtotal.toJSON(),
      taxAmount: this.taxAmount.toJSON(),
      totalAmount: this.totalAmount.toJSON(),
      paidAmount: this.paidAmount.toJSON(),
      issueDate: this.issueDate.toISOString(),
      dueDate: this.dueDate.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Invoice {
    return new Invoice({
      ...json,
      subtotal: Money.fromJSON(json.subtotal),
      taxAmount: Money.fromJSON(json.taxAmount),
      totalAmount: Money.fromJSON(json.totalAmount),
      paidAmount: Money.fromJSON(json.paidAmount),
      issueDate: new Date(json.issueDate),
      dueDate: new Date(json.dueDate)
    })
  }

  /**
   * Ustvari nov račun
   */
  static create(data: Omit<InvoiceData, 'id' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'paidAmount'>): Invoice {
    const invoice = new Invoice({
      ...data,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      subtotal: Money.zero('EUR'),
      taxAmount: Money.zero('EUR'),
      totalAmount: Money.zero('EUR'),
      paidAmount: Money.zero('EUR')
    })

    // Add items and recalculate
    for (const item of data.items) {
      invoice.addItem(item.description, item.quantity, item.unitPrice, item.taxRate)
    }

    return invoice
  }
}
