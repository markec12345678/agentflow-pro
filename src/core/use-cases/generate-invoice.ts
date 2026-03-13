/**
 * Use Case: Generate Invoice
 * 
 * Generiraj račun za rezervacijo.
 */

import { Invoice } from '../domain/tourism/entities/invoice'
import { Reservation } from '../domain/tourism/entities/reservation'
import { Money } from '../shared/value-objects/money'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GenerateInvoiceInput {
  reservation: Reservation
  guestId: string
  propertyId: string
  dueDate?: Date
  notes?: string
}

export interface GenerateInvoiceOutput {
  invoice: Invoice
  invoiceNumber: string
  totalAmount: Money
  dueDate: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GenerateInvoice {
  constructor(
    private invoiceRepository: InvoiceRepository
  ) {}

  /**
   * Generiraj račun za rezervacijo
   */
  async execute(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput> {
    const { reservation, guestId, propertyId, dueDate, notes } = input

    // 1. Validacija
    this.validateReservation(reservation)

    // 2. Izračunaj datume
    const issueDate = new Date()
    const invoiceDueDate = dueDate || this.calculateDueDate(issueDate)

    // 3. Ustvari račun
    const invoice = Invoice.create({
      type: 'reservation',
      status: 'pending',
      reservationId: reservation.id,
      guestId,
      propertyId,
      issueDate,
      dueDate: invoiceDueDate,
      items: [],
      notes: notes || this.generateNotes(reservation)
    })

    // 4. Dodaj postavke iz rezervacije
    this.addReservationItems(invoice, reservation)

    // 5. Dodaj takse
    this.addTaxes(invoice, reservation)

    // 6. Shrani račun
    await this.invoiceRepository.save(invoice)

    // 7. Vrni rezultat
    return {
      invoice,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      dueDate: invoiceDueDate
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj rezervacijo
   */
  private validateReservation(reservation: Reservation): void {
    if (!reservation.isPaid() && reservation.paymentStatus !== 'partially_paid') {
      throw new Error('Cannot generate invoice for unpaid reservation')
    }

    if (reservation.status === 'cancelled') {
      throw new Error('Cannot generate invoice for cancelled reservation')
    }
  }

  /**
   * Izračunaj zapadlost računa (privzeto 14 dni)
   */
  private calculateDueDate(issueDate: Date): Date {
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 14)
    return dueDate
  }

  /**
   * Generiraj opombe za račun
   */
  private generateNotes(reservation: Reservation): string {
    const nights = reservation.nights()
    return `Rezervacija za ${nights} nočitev, ${reservation.guests} gost(ov)`
  }

  /**
   * Dodaj postavke iz rezervacije
   */
  private addReservationItems(invoice: Invoice, reservation: Reservation): void {
    const nights = reservation.nights()
    const pricePerNight = reservation.pricePerNight()

    // Nastanitev
    invoice.addItem(
      `Nastanitev (${nights} nočitev)`,
      nights,
      pricePerNight,
      22 // 22% DDV
    )

    // Dodatne storitve (če obstajajo)
    // TODO: Add extra services from reservation
  }

  /**
   * Dodaj takse
   */
  private addTaxes(invoice: Invoice, reservation: Reservation): void {
    // Turistična taksa (€2 na osebo/noč)
    const nights = reservation.nights()
    const guests = reservation.guests
    const touristTaxPerNight = 2.00
    const totalTouristTax = nights * guests * touristTaxPerNight

    if (totalTouristTax > 0) {
      invoice.addItem(
        `Turistična taksa (${guests} oseb x ${nights} noči)`,
        1,
        new Money(totalTouristTax, 'EUR'),
        0 // Tourist tax is not subject to VAT
      )
    }
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>
  findByGuest(guestId: string): Promise<Invoice[]>
  findByReservation(reservationId: string): Promise<Invoice | null>
  save(invoice: Invoice): Promise<void>
  delete(id: string): Promise<void>
}
