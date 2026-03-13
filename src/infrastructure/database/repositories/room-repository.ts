/**
 * Room Repository Implementation
 * 
 * Prisma-based repository for Room entity.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { Room } from '@/core/domain/tourism/entities/room'
import { Money } from '@/core/domain/shared/value-objects/money'
import type { RoomRepository } from '@/core/use-cases/allocate-room'

export class RoomRepositoryImpl implements RoomRepository {
  /**
   * Find room by ID
   */
  async findById(id: string): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        type: true,
        property: true
      }
    })

    if (!room) return null

    return this.mapToDomain(room)
  }

  /**
   * Find rooms by property
   */
  async findByProperty(propertyId: string): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      include: {
        type: true,
        property: true
      }
    })

    return rooms.map(room => this.mapToDomain(room))
  }

  /**
   * Find rooms by type
   */
  async findByType(propertyId: string, roomTypeId: string): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      where: {
        propertyId,
        roomTypeId
      },
      include: {
        type: true,
        property: true
      }
    })

    return rooms.map(room => this.mapToDomain(room))
  }

  /**
   * Find available rooms for date range
   */
  async findAvailable(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number
  ): Promise<Room[]> {
    // Get all rooms for property
    const rooms = await this.findByProperty(propertyId)

    // Filter by capacity
    const roomsWithCapacity = rooms.filter(room => 
      room.type.maxOccupancy >= guests
    )

    // Filter by availability
    const availableRooms: Room[] = []
    
    for (const room of roomsWithCapacity) {
      const isAvailable = await this.isRoomAvailable(room.id, checkIn, checkOut)
      if (isAvailable) {
        availableRooms.push(room)
      }
    }

    return availableRooms
  }

  /**
   * Check if room is available for date range
   */
  async isRoomAvailable(
    roomId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> {
    // Check for existing reservations
    const conflictingReservations = await prisma.reservation.count({
      where: {
        roomId,
        OR: [
          {
            checkIn: { lte: checkOut },
            checkOut: { gte: checkIn }
          }
        ],
        status: {
          in: ['confirmed', 'checked_in', 'checked_out']
        }
      }
    })

    if (conflictingReservations > 0) {
      return false
    }

    // Check for blocked dates
    const blockedDates = await prisma.blockedDate.count({
      where: {
        roomId,
        date: {
          gte: checkIn,
          lte: checkOut
        }
      }
    })

    return blockedDates === 0
  }

  /**
   * Save room
   */
  async save(room: Room): Promise<void> {
    const data = this.mapToPrisma(room)

    await prisma.room.upsert({
      where: { id: room.id },
      update: data,
      create: data
    })
  }

  /**
   * Delete room
   */
  async delete(id: string): Promise<void> {
    await prisma.room.delete({
      where: { id }
    })
  }

  /**
   * Map Prisma data to domain entity
   */
  private mapToDomain(prismaRoom: any): Room {
    return new Room({
      id: prismaRoom.id,
      number: prismaRoom.number,
      propertyId: prismaRoom.propertyId,
      floor: prismaRoom.floor,
      typeId: prismaRoom.roomTypeId,
      type: {
        id: prismaRoom.type.id,
        name: prismaRoom.type.name,
        category: prismaRoom.type.category as any,
        maxOccupancy: prismaRoom.type.maxOccupancy,
        bedType: prismaRoom.type.bedType as any,
        numberOfBeds: prismaRoom.type.numberOfBeds,
        size: prismaRoom.type.size,
        baseRate: new Money(prismaRoom.type.baseRate, 'EUR'),
        description: prismaRoom.type.description,
        amenities: prismaRoom.type.amenities || []
      },
      status: prismaRoom.status as any,
      view: prismaRoom.view as any,
      accessible: prismaRoom.accessible,
      smoking: prismaRoom.smoking,
      connectingRooms: prismaRoom.connectingRooms,
      amenities: prismaRoom.amenities || [],
      notes: prismaRoom.notes,
      lastCleanedAt: prismaRoom.lastCleanedAt,
      lastInspectedAt: prismaRoom.lastInspectedAt
    })
  }

  /**
   * Map domain entity to Prisma data
   */
  private mapToPrisma(room: Room): any {
    return {
      id: room.id,
      number: room.number,
      propertyId: room.propertyId,
      roomTypeId: room.typeId,
      floor: room.floor,
      status: room.status,
      view: room.view,
      accessible: room.accessible,
      smoking: room.smoking,
      connectingRooms: room.connectingRooms,
      amenities: room.amenities,
      notes: room.notes,
      lastCleanedAt: room.lastCleanedAt,
      lastInspectedAt: room.lastInspectedAt
    }
  }
}
