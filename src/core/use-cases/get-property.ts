/**
 * Use Case: Get Property
 * 
 * Get property details by ID.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetPropertyInput {
  propertyId: string
  userId: string
}

export interface GetPropertyOutput {
  property: PropertyDTO
  amenities: AmenityDTO[]
  rooms: RoomDTO[]
  policies: PolicyDTO[]
}

export interface PropertyDTO {
  id: string
  name: string
  type: string
  status: string
  description?: string
  address?: {
    street: string
    city: string
    country: string
    postalCode: string
  }
  basePrice: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface AmenityDTO {
  id: string
  name: string
  category: string
}

export interface RoomDTO {
  id: string
  name: string
  type: string
  maxOccupancy: number
  baseRate: number
}

export interface PolicyDTO {
  id: string
  type: string
  description: string
  active: boolean
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetProperty {
  constructor(
    private propertyRepository: PropertyRepository
  ) {}

  /**
   * Get property by ID
   */
  async execute(input: GetPropertyInput): Promise<GetPropertyOutput> {
    const { propertyId, userId } = input

    // 1. Verify user has access
    const hasAccess = await this.propertyRepository.hasAccess(userId, propertyId)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    // 2. Get property
    const property = await this.propertyRepository.findById(propertyId)
    if (!property) {
      throw new Error('Property not found')
    }

    // 3. Map to DTOs
    return {
      property: this.mapPropertyToDTO(property),
      amenities: property.amenities?.map(this.mapAmenityToDTO) || [],
      rooms: property.rooms?.map(this.mapRoomToDTO) || [],
      policies: property.policies?.map(this.mapPolicyToDTO) || []
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapPropertyToDTO(property: any): PropertyDTO {
    return {
      id: property.id,
      name: property.name,
      type: property.type,
      status: property.status,
      description: property.description,
      address: property.address,
      basePrice: property.basePrice,
      currency: property.currency,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    }
  }

  private mapAmenityToDTO(amenity: any): AmenityDTO {
    return {
      id: amenity.id,
      name: amenity.name,
      category: amenity.category
    }
  }

  private mapRoomToDTO(room: any): RoomDTO {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      maxOccupancy: room.maxOccupancy,
      baseRate: room.baseRate
    }
  }

  private mapPolicyToDTO(policy: any): PolicyDTO {
    return {
      id: policy.id,
      type: policy.type,
      description: policy.description,
      active: policy.active
    }
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface PropertyRepository {
  findById(id: string): Promise<any | null>
  hasAccess(userId: string, propertyId: string): Promise<boolean>
}
