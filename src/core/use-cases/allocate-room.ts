/**
 * Use Case: Allocate Room
 * 
 * Dodeli sobo gostu ob check-in-u ali booking-u.
 * Upošteva preference, availability in room type.
 */

import { Reservation } from '../domain/tourism/entities/reservation'
import { Room } from '../domain/tourism/entities/room'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface AllocateRoomInput {
  reservationId: string
  propertyId: string
  checkIn: Date
  checkOut: Date
  guests: number
  preferences?: {
    floor?: 'low' | 'high'
    view?: 'sea' | 'mountain' | 'city' | 'garden'
    bedType?: 'single' | 'double' | 'queen' | 'king'
    smoking?: boolean
    accessibility?: boolean
  }
  upgradeAllowed?: boolean
}

export interface AllocateRoomOutput {
  success: boolean
  roomId: string
  roomNumber: string
  roomType: string
  floor?: string
  notes?: string
  upgraded: boolean
  upgradeReason?: string
}

export interface RoomAllocationResult {
  allocatedRoom: Room
  alternativeRooms: Room[]
  conflicts: string[]
}

// ============================================================================
// Use Case Class
// ============================================================================

export class AllocateRoom {
  constructor(
    private roomRepository: RoomRepository,
    private reservationRepository: ReservationRepository,
    private availabilityRepository: AvailabilityRepository
  ) {}

  /**
   * Dodeli sobo za rezervacijo
   */
  async execute(input: AllocateRoomInput): Promise<AllocateRoomOutput> {
    const { reservationId, propertyId, checkIn, checkOut, guests, preferences, upgradeAllowed } = input

    // 1. Pridobi rezervacijo
    const reservation = await this.reservationRepository.findById(reservationId)
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    // 2. Pridobi vse sobe za property
    const rooms = await this.roomRepository.findByProperty(propertyId)

    // 3. Pridobi availability za datume
    const availability = await this.availabilityRepository.checkAvailability(
      propertyId,
      checkIn,
      checkOut
    )

    // 4. Filtriraj sobe glede na kapaciteto
    const suitableRooms = this.filterByCapacity(rooms, guests)

    // 5. Filtriraj glede na availability
    const availableRooms = this.filterByAvailability(suitableRooms, availability, checkIn, checkOut)

    // 6. Filtriraj glede na preference
    const preferredRooms = preferences 
      ? this.filterByPreferences(availableRooms, preferences)
      : availableRooms

    // 7. Izberi najboljšo sobo
    const selectedRoom = this.selectBestRoom(preferredRooms, upgradeAllowed)

    if (!selectedRoom) {
      // Poskusi z upgrade-om če ni na voljo
      if (upgradeAllowed) {
        const upgradedRoom = this.findUpgrade(rooms, availability, checkIn, checkOut, guests)
        if (upgradedRoom) {
          return {
            success: true,
            roomId: upgradedRoom.id,
            roomNumber: upgradedRoom.number,
            roomType: upgradedRoom.type.name,
            floor: upgradedRoom.floor,
            notes: 'Complimentary upgrade due to room unavailability',
            upgraded: true,
            upgradeReason: 'Original room type not available'
          }
        }
      }

      throw new Error('No suitable rooms available')
    }

    // 8. Dodeli sobo
    await this.roomRepository.allocate(selectedRoom.id, reservationId, checkIn, checkOut)

    return {
      success: true,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.number,
      roomType: selectedRoom.type.name,
      floor: selectedRoom.floor,
      upgraded: false,
      notes: this.generateNotes(selectedRoom, preferences)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Filtriraj sobe glede na kapaciteto
   */
  private filterByCapacity(rooms: Room[], guests: number): Room[] {
    return rooms.filter(room => {
      const maxOccupancy = room.type.maxOccupancy || 0
      return maxOccupancy >= guests
    })
  }

  /**
   * Filtriraj sobe glede na availability
   */
  private filterByAvailability(
    rooms: Room[],
    availability: any,
    checkIn: Date,
    checkOut: Date
  ): Room[] {
    return rooms.filter(room => {
      // Preveri ali je soba na voljo za vse datume
      const isBlocked = availability.blockedRooms?.includes(room.id)
      const isOccupied = availability.occupiedRooms?.includes(room.id)
      
      return !isBlocked && !isOccupied
    })
  }

  /**
   * Filtriraj sobe glede na preference
   */
  private filterByPreferences(rooms: Room[], preferences: any): Room[] {
    return rooms.filter(room => {
      let score = 0

      // Floor preference
      if (preferences.floor) {
        const floorMatch = preferences.floor === 'high' 
          ? parseInt(room.floor) > 3
          : parseInt(room.floor) <= 3
        if (floorMatch) score += 2
      }

      // View preference
      if (preferences.view && room.view) {
        if (room.view.includes(preferences.view)) score += 3
      }

      // Bed type preference
      if (preferences.bedType) {
        if (room.type.bedType === preferences.bedType) score += 3
      }

      // Accessibility
      if (preferences.accessibility && !room.accessible) {
        return false
      }

      return score > 0
    })
  }

  /**
   * Izberi najboljšo sobo
   */
  private selectBestRoom(rooms: Room[], upgradeAllowed: boolean): Room | null {
    if (rooms.length === 0) return null

    // Sortiraj po score (višji floor, boljši view, itd.)
    const sorted = rooms.sort((a, b) => {
      const scoreA = this.calculateRoomScore(a)
      const scoreB = this.calculateRoomScore(b)
      return scoreB - scoreA
    })

    return sorted[0]
  }

  /**
   * Izračunaj score sobe
   */
  private calculateRoomScore(room: Room): number {
    let score = 0

    // Višji floor = višji score
    score += parseInt(room.floor) || 0

    // Boljši view = višji score
    if (room.view?.includes('sea')) score += 10
    if (room.view?.includes('mountain')) score += 8
    if (room.view?.includes('garden')) score += 5

    // Večja soba = višji score
    score += room.type.size || 0

    // Amenities
    if (room.amenities?.includes('balcony')) score += 3
    if (room.amenities?.includes('jacuzzi')) score += 5

    return score
  }

  /**
   * Najdi upgrade
   */
  private findUpgrade(
    rooms: Room[],
    availability: any,
    checkIn: Date,
    checkOut: Date,
    guests: number
  ): Room | null {
    // Filtriraj sobe višjega tipa
    const upgradeRooms = rooms.filter(room => {
      const isAvailable = !availability.blockedRooms?.includes(room.id) &&
                         !availability.occupiedRooms?.includes(room.id)
      const hasCapacity = room.type.maxOccupancy >= guests
      
      // Upgrade = višji room type
      const isUpgrade = room.type.category === 'deluxe' || 
                       room.type.category === 'suite' ||
                       room.type.size > 40

      return isAvailable && hasCapacity && isUpgrade
    })

    return this.selectBestRoom(upgradeRooms, true)
  }

  /**
   * Generiraj notes za dodelitev
   */
  private generateNotes(room: Room, preferences?: any): string {
    const notes: string[] = []

    if (preferences?.view) {
      notes.push(`View: ${room.view || 'N/A'}`)
    }

    if (preferences?.floor) {
      notes.push(`Floor: ${room.floor}`)
    }

    if (room.amenities?.length > 0) {
      notes.push(`Amenities: ${room.amenities.join(', ')}`)
    }

    return notes.join(' | ')
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface RoomRepository {
  findById(id: string): Promise<Room | null>
  findByProperty(propertyId: string): Promise<Room[]>
  findByType(propertyId: string, typeId: string): Promise<Room[]>
  allocate(roomId: string, reservationId: string, checkIn: Date, checkOut: Date): Promise<void>
  deallocate(roomId: string): Promise<void>
  getStatus(roomId: string, date: Date): Promise<'available' | 'occupied' | 'blocked' | 'maintenance'>
}

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>
}

export interface AvailabilityRepository {
  checkAvailability(propertyId: string, checkIn: Date, checkOut: Date): Promise<any>
  getBlockedRooms(propertyId: string, checkIn: Date, checkOut: Date): Promise<string[]>
  getOccupiedRooms(propertyId: string, checkIn: Date, checkOut: Date): Promise<string[]>
}
