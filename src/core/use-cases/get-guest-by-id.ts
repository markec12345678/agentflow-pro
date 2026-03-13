/**
 * Use Case: Get Guest By ID
 * 
 * Get guest details by ID.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetGuestByIdInput {
  guestId: string
  userId: string
}

export interface GetGuestByIdOutput {
  guest: GuestDTO
  reservations: ReservationSummary[]
  totalSpent: number
  totalStays: number
}

export interface GuestDTO {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface ReservationSummary {
  id: string
  propertyId: string
  checkIn: Date
  checkOut: Date
  status: string
  totalPrice: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetGuestById {
  constructor(
    private guestRepository: GuestRepository,
    private reservationRepository: ReservationRepository
  ) {}

  /**
   * Get guest by ID
   */
  async execute(input: GetGuestByIdInput): Promise<GetGuestByIdOutput> {
    const { guestId, userId } = input

    // 1. Get guest
    const guest = await this.guestRepository.findById(guestId)
    if (!guest) {
      throw new Error('Guest not found')
    }

    // 2. Get guest reservations
    const reservations = await this.reservationRepository.findByGuest(guestId)

    // 3. Calculate statistics
    const totalSpent = reservations.reduce((sum, r) => sum + r.totalPrice, 0)
    const totalStays = reservations.filter(r => r.status === 'completed').length

    return {
      guest: this.mapGuestToDTO(guest),
      reservations: reservations.map(this.mapReservationToSummary),
      totalSpent,
      totalStays
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapGuestToDTO(guest: any): GuestDTO {
    return {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      createdAt: guest.createdAt,
      metadata: guest.metadata
    }
  }

  private mapReservationToSummary(reservation: any): ReservationSummary {
    return {
      id: reservation.id,
      propertyId: reservation.propertyId,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      status: reservation.status,
      totalPrice: reservation.totalPrice
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface GuestRepository {
  findById(id: string): Promise<any | null>
}

export interface ReservationRepository {
  findByGuest(guestId: string): Promise<any[]>
}
