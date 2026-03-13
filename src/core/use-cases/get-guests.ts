/**
 * Use Case: Get Guests
 * 
 * Get guests with filtering and search.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetGuestsInput {
  userId: string
  propertyId?: string
  searchQuery?: string
  limit?: number
  offset?: number
}

export interface GetGuestsOutput {
  guests: GuestDTO[]
  total: number
  hasMore: boolean
}

export interface GuestDTO {
  id: string
  name: string
  email: string
  phone?: string
  propertyId: string
  totalStays: number
  totalSpent: number
  lastStayAt?: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetGuests {
  constructor(
    private guestRepository: GuestRepository,
    private propertyRepository: PropertyRepository
  ) {}

  /**
   * Get guests with filtering
   */
  async execute(input: GetGuestsInput): Promise<GetGuestsOutput> {
    const { userId, propertyId, searchQuery, limit = 20, offset = 0 } = input

    // 1. Get accessible property IDs
    const propertyIds = await this.getPropertyIds(userId, propertyId)

    // 2. Get guests
    const guests = await this.guestRepository.findByProperties(propertyIds, {
      searchQuery,
      limit,
      offset
    })

    // 3. Get total count
    const total = await this.guestRepository.countByProperties(propertyIds, {
      searchQuery
    })

    // 4. Map to DTO
    const guestDTOs = guests.map(this.mapToDTO)

    return {
      guests: guestDTOs,
      total,
      hasMore: offset + guests.length < total
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get property IDs user has access to
   */
  private async getPropertyIds(userId: string, propertyId?: string): Promise<string[]> {
    if (propertyId) {
      // Verify user has access to this property
      const hasAccess = await this.propertyRepository.hasAccess(userId, propertyId)
      if (!hasAccess) {
        throw new Error('Access denied to property')
      }
      return [propertyId]
    }

    // Get all properties for user
    const properties = await this.propertyRepository.findByUser(userId)
    return properties.map(p => p.id)
  }

  /**
   * Map guest entity to DTO
   */
  private mapToDTO(guest: any): GuestDTO {
    return {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      propertyId: guest.propertyId,
      totalStays: guest.totalStays || 0,
      totalSpent: guest.totalSpent || 0,
      lastStayAt: guest.lastStayAt
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface GuestRepository {
  findByProperties(
    propertyIds: string[],
    options?: {
      searchQuery?: string
      limit?: number
      offset?: number
    }
  ): Promise<any[]>

  countByProperties(
    propertyIds: string[],
    options?: {
      searchQuery?: string
    }
  ): Promise<number>
}

export interface PropertyRepository {
  findByUser(userId: string): Promise<any[]>
  hasAccess(userId: string, propertyId: string): Promise<boolean>
}
