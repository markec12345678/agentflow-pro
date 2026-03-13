/**
 * Use Case: Check Availability
 * 
 * Preveri razpoložljivost sob za določene datume.
 * Upošteva vse rezervacije, block-ove in maintenance.
 */

import { Room } from '../domain/tourism/entities/room'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CheckAvailabilityInput {
  propertyId: string
  checkIn: Date
  checkOut: Date
  guests?: number
  roomType?: string
  includeBlocked?: boolean
}

export interface CheckAvailabilityOutput {
  available: boolean
  availableRooms: RoomAvailability[]
  totalRooms: number
  occupiedRooms: number
  blockedRooms: number
  maintenanceRooms: number
  occupancyRate: number
  alternativeDates?: AlternativeAvailability[]
}

export interface RoomAvailability {
  roomId: string
  roomNumber: string
  roomType: string
  floor: string
  maxOccupancy: number
  baseRate: number
  currency: string
  available: boolean
  status: 'available' | 'occupied' | 'blocked' | 'maintenance'
  amenities: string[]
  view?: string
}

export interface AlternativeAvailability {
  date: Date
  available: boolean
  occupancyRate: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CheckAvailability {
  constructor(
    private roomRepository: RoomRepository,
    private reservationRepository: ReservationRepository,
    private blockRepository: BlockRepository
  ) {}

  /**
   * Preveri razpoložljivost za property
   */
  async execute(input: CheckAvailabilityInput): Promise<CheckAvailabilityOutput> {
    const { propertyId, checkIn, checkOut, guests, roomType, includeBlocked } = input

    // 1. Pridobi vse sobe za property
    const allRooms = await this.roomRepository.findByProperty(propertyId)

    // 2. Filtriraj po room type če je podan
    const filteredRooms = roomType 
      ? await this.roomRepository.findByType(propertyId, roomType)
      : allRooms

    // 3. Pridobi vse rezervacije za datume
    const reservations = await this.reservationRepository.findByDateRange(
      propertyId,
      checkIn,
      checkOut
    )

    // 4. Pridobi vse block-ove za datume
    const blocks = await this.blockRepository.findByDateRange(
      propertyId,
      checkIn,
      checkOut
    )

    // 5. Izračunaj zasedenost
    const occupiedRoomIds = this.getOccupiedRoomIds(reservations)
    const blockedRoomIds = this.getBlockedRoomIds(blocks)
    const maintenanceRoomIds = this.getMaintenanceRoomIds(allRooms)

    // 6. Ustvari availability response
    const roomAvailability = this.buildRoomAvailability(
      filteredRooms,
      occupiedRoomIds,
      blockedRoomIds,
      maintenanceRoomIds
    )

    // 7. Filtriraj samo available če guests ni podan
    const availableRooms = guests
      ? roomAvailability.filter(room => {
          const canAccommodate = room.maxOccupancy >= guests
          return room.available && canAccommodate
        })
      : roomAvailability.filter(room => room.available)

    // 8. Izračunaj statistiko
    const totalRooms = filteredRooms.length
    const occupiedCount = occupiedRoomIds.length
    const blockedCount = blockedRoomIds.length
    const maintenanceCount = maintenanceRoomIds.length
    const availableCount = totalRooms - occupiedCount - blockedCount - maintenanceCount
    const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0

    // 9. Pridobi alternative dates če ni na voljo
    let alternativeDates: AlternativeAvailability[] = []
    if (availableRooms.length === 0) {
      alternativeDates = await this.findAlternativeDates(input)
    }

    return {
      available: availableRooms.length > 0,
      availableRooms,
      totalRooms,
      occupiedRooms: occupiedCount,
      blockedRooms: blockedCount,
      maintenanceRooms: maintenanceCount,
      occupancyRate,
      alternativeDates
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Pridobi ID-je zasedenih sob iz rezervacij
   */
  private getOccupiedRoomIds(reservations: any[]): string[] {
    const occupiedIds = new Set<string>()
    
    for (const reservation of reservations) {
      if (reservation.assignedRoomId) {
        occupiedIds.add(reservation.assignedRoomId)
      }
    }

    return Array.from(occupiedIds)
  }

  /**
   * Pridobi ID-je blokiranih sob
   */
  private getBlockedRoomIds(blocks: any[]): string[] {
    const blockedIds = new Set<string>()
    
    for (const block of blocks) {
      if (block.roomId) {
        blockedIds.add(block.roomId)
      }
    }

    return Array.from(blockedIds)
  }

  /**
   * Pridobi ID-je sob na maintenance
   */
  private getMaintenanceRoomIds(rooms: Room[]): string[] {
    return rooms
      .filter(room => room.status === 'maintenance' || room.status === 'out_of_order')
      .map(room => room.id)
  }

  /**
   * Zgradi room availability response
   */
  private buildRoomAvailability(
    rooms: Room[],
    occupiedIds: string[],
    blockedIds: string[],
    maintenanceIds: string[]
  ): RoomAvailability[] {
    return rooms.map(room => {
      const isOccupied = occupiedIds.includes(room.id)
      const isBlocked = blockedIds.includes(room.id)
      const isMaintenance = maintenanceIds.includes(room.id)

      const status = isMaintenance
        ? 'maintenance'
        : isBlocked
        ? 'blocked'
        : isOccupied
        ? 'occupied'
        : 'available'

      return {
        roomId: room.id,
        roomNumber: room.number,
        roomType: room.type.name,
        floor: room.floor,
        maxOccupancy: room.type.maxOccupancy,
        baseRate: room.type.baseRate.amount,
        currency: room.type.baseRate.currency,
        available: status === 'available',
        status,
        amenities: room.amenities,
        view: room.view
      }
    })
  }

  /**
   * Najdi alternativne datume
   */
  private async findAlternativeDates(
    input: CheckAvailabilityInput
  ): Promise<AlternativeAvailability[]> {
    const alternatives: AlternativeAvailability[] = []
    const { propertyId, checkIn, checkOut, guests } = input

    // Preveri +/- 3 dni
    for (let offset = -3; offset <= 3; offset++) {
      if (offset === 0) continue

      const alternativeCheckIn = new Date(checkIn)
      alternativeCheckIn.setDate(alternativeCheckIn.getDate() + offset)

      const alternativeCheckOut = new Date(checkOut)
      alternativeCheckOut.setDate(alternativeCheckOut.getDate() + offset)

      // Pridobi availability za alternativne datume
      const availability = await this.execute({
        ...input,
        checkIn: alternativeCheckIn,
        checkOut: alternativeCheckOut
      })

      alternatives.push({
        date: alternativeCheckIn,
        available: availability.available,
        occupancyRate: availability.occupancyRate
      })
    }

    return alternatives
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface RoomRepository {
  findById(id: string): Promise<Room | null>
  findByProperty(propertyId: string): Promise<Room[]>
  findByType(propertyId: string, typeId: string): Promise<Room[]>
}

export interface ReservationRepository {
  findById(id: string): Promise<any | null>
  findByDateRange(propertyId: string, checkIn: Date, checkOut: Date): Promise<any[]>
}

export interface BlockRepository {
  findById(id: string): Promise<any | null>
  findByDateRange(propertyId: string, checkIn: Date, checkOut: Date): Promise<any[]>
}
