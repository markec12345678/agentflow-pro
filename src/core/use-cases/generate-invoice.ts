/**
 * Use Case: Generate Invoice
 * 
 * Generate invoice for reservation.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GenerateInvoiceInput {
  reservationId: string
  userId: string
  includeTaxes?: boolean
  includeDiscounts?: boolean
}

export interface GenerateInvoiceOutput {
  invoice: InvoiceDTO
  invoiceNumber: string
  totalAmount: number
  dueDate: Date
}

export interface InvoiceDTO {
  id: string
  reservationId: string
  guestId: string
  propertyId: string
  items: InvoiceItem[]
  subtotal: number
  taxes: number
  discounts: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: Date
  createdAt: Date
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GenerateInvoice {
  constructor(
    private invoiceRepository: InvoiceRepository,
    private reservationRepository: ReservationRepository
  ) {}

  /**
   * Generate invoice
   */
  async execute(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput> {
    const { reservationId, userId, includeTaxes = true, includeDiscounts = true } = input

    // 1. Get reservation
    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    // 2. Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // 3. Calculate items
    const items = this.calculateItems(reservation)

    // 4. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxes = includeTaxes ? this.calculateTaxes(subtotal, reservation) : 0
    const discounts = includeDiscounts ? this.calculateDiscounts(subtotal, reservation) : 0
    const total = subtotal + taxes - discounts

    // 5. Create invoice
    const invoice: InvoiceDTO = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reservationId,
      guestId: reservation.guestId,
      propertyId: reservation.propertyId,
      items,
      subtotal,
      taxes,
      discounts,
      total,
      status: 'draft',
      dueDate: this.calculateDueDate(),
      createdAt: new Date()
    }

    // 6. Save invoice
    await this.invoiceRepository.save(invoice)

    return {
      invoice,
      invoiceNumber,
      totalAmount: total,
      dueDate: invoice.dueDate
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateItems(reservation: any): InvoiceItem[] {
    const nights = this.calculateNights(reservation.checkIn, reservation.checkOut)
    
    return [
      {
        description: `Accommodation (${nights} nights)`,
        quantity: nights,
        unitPrice: reservation.pricePerNight,
        total: nights * reservation.pricePerNight
      },
      ...(reservation.extraServices || []).map((service: any) => ({
        description: service.name,
        quantity: 1,
        unitPrice: service.price,
        total: service.price
      }))
    ]
  }

  private calculateTaxes(subtotal: number, reservation: any): number {
    const taxRate = reservation.taxRate || 0.22 // 22% VAT
    return subtotal * taxRate
  }

  private calculateDiscounts(subtotal: number, reservation: any): number {
    let discounts = 0

    // Long stay discount
    const nights = this.calculateNights(reservation.checkIn, reservation.checkOut)
    if (nights >= 7) {
      discounts += subtotal * 0.10 // 10% discount
    } else if (nights >= 3) {
      discounts += subtotal * 0.05 // 5% discount
    }

    // Early bird discount
    if (reservation.bookedInAdvance >= 60) {
      discounts += subtotal * 0.05 // 5% discount
    }

    return discounts
  }

  private calculateDueDate(): Date {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // 14 days
    return dueDate
  }

  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diffTime = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface InvoiceRepository {
  save(invoice: any): Promise<void>
  findById(id: string): Promise<any | null>
  findByReservation(reservationId: string): Promise<any[]>
}

export interface ReservationRepository {
  findById(id: string): Promise<any | null>
}
