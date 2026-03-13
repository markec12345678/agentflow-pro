/**
 * Use Case: Process Check-In
 * 
 * Opravi check-in gosta.
 * Preveri identiteto, izroči ključe, posodobi status.
 */

import { Reservation } from '../tourism/entities/reservation'
import { Guest } from '../guest/entities/guest'
import { Property } from '../tourism/entities/property'
import { ReservationCheckedIn } from '../tourism/events/reservation-events'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface ProcessCheckInInput {
  reservation: Reservation
  guest: Guest
  property: Property
  checkInTime?: Date
  specialRequests?: string[]
}

export interface ProcessCheckInOutput {
  reservation: Reservation
  checkedInAt: Date
  event: ReservationCheckedIn
  roomNumber?: string
  accessCode?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class ProcessCheckIn {
  /**
   * Opravi check-in gosta
   */
  async execute(input: ProcessCheckInInput): Promise<ProcessCheckInOutput> {
    const { reservation, guest, property, checkInTime, specialRequests } = input

    // 1. Validacija
    this.validateCheckIn(reservation, guest)

    // 2. Preveri identiteto gosta
    await this.verifyGuestIdentity(guest)

    // 3. Preveri plačilo
    this.verifyPayment(reservation)

    // 4. Dodeli sobo (če še ni)
    const roomAssignment = await this.assignRoom(property, reservation)

    // 5. Generiraj access code (za smart lock)
    const accessCode = this.generateAccessCode()

    // 6. Opravi check-in
    reservation.checkIn()

    // 7. Ustvari dogodek
    const event = new ReservationCheckedIn(
      reservation.id,
      checkInTime || new Date()
    )

    // 8. Obdelaj special requests
    if (specialRequests) {
      await this.handleSpecialRequests(reservation, specialRequests)
    }

    // 9. Pošlji welcome message
    await this.sendWelcomeMessage(guest, roomAssignment, accessCode)

    return {
      reservation,
      checkedInAt: new Date(),
      event,
      roomNumber: roomAssignment?.roomNumber,
      accessCode
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj ali je mogoč check-in
   */
  private validateCheckIn(reservation: Reservation, guest: Guest): void {
    if (!reservation.canCheckIn()) {
      throw new Error('Reservation is not ready for check-in')
    }

    if (reservation.guestId !== guest.id) {
      throw new Error('Guest mismatch')
    }

    const today = new Date()
    const checkInDate = reservation.dateRange.start
    
    // Dovoli check-in dan prej ali na dan check-in
    const oneDayBefore = new Date(checkInDate)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    
    if (today < oneDayBefore) {
      throw new Error('Too early for check-in')
    }

    if (today > reservation.dateRange.end) {
      throw new Error('Check-in date has passed')
    }
  }

  /**
   * Verificiraj identiteto gosta
   */
  private async verifyGuestIdentity(guest: Guest): Promise<void> {
    // TODO: Implement ID verification
    // - Preveri ID dokument
    // - Scan passport
    // - Verify against booking
    
    if (!guest.idDocument) {
      // Zahtevaj ID dokument
      throw new Error('Guest ID verification required')
    }

    // Preveri ali je ID veljaven
    if (guest.idDocument.expiryDate && guest.idDocument.expiryDate < new Date()) {
      throw new Error('Guest ID document has expired')
    }
  }

  /**
   * Verificiraj plačilo
   */
  private verifyPayment(reservation: Reservation): void {
    if (!reservation.isPaid()) {
      // Dovoli check-in z delnim plačilom (po policy-ju)
      if (reservation.paymentStatus === 'unpaid') {
        throw new Error('Payment required before check-in')
      }
    }
  }

  /**
   * Dodeli sobo gostu
   */
  private async assignRoom(
    property: Property,
    reservation: Reservation
  ): Promise<{ roomNumber: string; floor?: string } | null> {
    // TODO: Implement room assignment logic
    // - Najdi available room
    // - Preveri preferences gosta
    // - Dodeli sobo
    
    // Za zdaj vrni null (room je že dodeljen v reservation)
    return null
  }

  /**
   * Generiraj access code za smart lock
   */
  private generateAccessCode(): string {
    // Generiraj 6-mesten PIN
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Obdelaj special requests
   */
  private async handleSpecialRequests(
    reservation: Reservation,
    requests: string[]
  ): Promise<void> {
    // TODO: Implement special requests handling
    // - Late check-out
    // - Extra towels
    // - Airport shuttle
    // - Cribs, etc.
    
    for (const request of requests) {
      reservation.addNote(`Special request: ${request}`)
    }
  }

  /**
   * Pošlji welcome message
   */
  private async sendWelcomeMessage(
    guest: Guest,
    room: { roomNumber?: string } | null,
    accessCode: string
  ): Promise<void> {
    // TODO: Send welcome SMS/WhatsApp/Email
    const message = `Dobrodošli ${guest.getFullName()}! 
Vaša soba: ${room?.roomNumber || 'TBD'}
Access code: ${accessCode}
WiFi: AgentFlow_Guest
Password: Welcome2026

Veselo bivanje!`

    // await sendSMS(guest.phone, message)
    // await sendEmail(guest.email, 'Dobrodošli!', message)
  }
}
