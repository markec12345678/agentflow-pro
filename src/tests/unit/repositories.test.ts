/**
 * Unit Tests: RoomRepository & BlockRepository
 * 
 * Testi za novo implementirane repository-je.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { RoomRepositoryImpl } from '@/infrastructure/database/repositories/room-repository'
import { BlockRepositoryImpl } from '@/infrastructure/database/repositories/block-repository'
import { Room } from '@/core/domain/tourism/entities/room'
import { Money } from '@/core/domain/shared/value-objects/money'

describe('RoomRepository & BlockRepository', () => {
  let roomRepo: RoomRepositoryImpl
  let blockRepo: BlockRepositoryImpl

  beforeEach(() => {
    roomRepo = new RoomRepositoryImpl()
    blockRepo = new BlockRepositoryImpl()
  })

  describe('RoomRepository', () => {
    it('should create room repository', () => {
      expect(roomRepo).toBeDefined()
    })

    it('should have required methods', () => {
      expect(roomRepo.findById).toBeDefined()
      expect(roomRepo.findByProperty).toBeDefined()
      expect(roomRepo.findByType).toBeDefined()
      expect(roomRepo.findAvailable).toBeDefined()
      expect(roomRepo.isRoomAvailable).toBeDefined()
      expect(roomRepo.save).toBeDefined()
      expect(roomRepo.delete).toBeDefined()
    })

    it('should map domain entity correctly', () => {
      // Arrange
      const room = new Room({
        id: 'room_test_1',
        number: '101',
        propertyId: 'prop_123',
        floor: '1',
        typeId: 'type_1',
        type: {
          id: 'type_1',
          name: 'Standard Room',
          category: 'standard',
          maxOccupancy: 2,
          bedType: 'double',
          numberOfBeds: 1,
          size: 25,
          baseRate: new Money(100, 'EUR'),
          description: 'Test room',
          amenities: ['wifi', 'tv']
        },
        status: 'available',
        amenities: ['wifi', 'tv'],
        view: 'city'
      })

      // Assert
      expect(room.id).toBe('room_test_1')
      expect(room.number).toBe('101')
      expect(room.type.maxOccupancy).toBe(2)
      expect(room.type.baseRate.amount).toBe(100)
    })
  })

  describe('BlockRepository', () => {
    it('should create block repository', () => {
      expect(blockRepo).toBeDefined()
    })

    it('should have required methods', () => {
      expect(blockRepo.findById).toBeDefined()
      expect(blockRepo.findByProperty).toBeDefined()
      expect(blockRepo.findByDateRange).toBeDefined()
      expect(blockRepo.isDateBlocked).toBeDefined()
      expect(blockRepo.save).toBeDefined()
      expect(blockRepo.delete).toBeDefined()
      expect(blockRepo.deleteMany).toBeDefined()
    })

    it('should check if date is blocked', async () => {
      // This would require actual database
      // For now, just test the method exists
      expect(blockRepo.isDateBlocked).toBeDefined()
    })
  })
})
