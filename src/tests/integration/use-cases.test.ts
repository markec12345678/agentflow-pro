/**
 * Integration Tests: Use Cases
 * 
 * Testi za core use case-e.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { GetGuests } from '@/core/use-cases/get-guests'
import { GetProperty } from '@/core/use-cases/get-property'
import { CalculatePrice } from '@/core/use-cases/calculate-price'
import { Property } from '@/core/domain/tourism/entities/property'
import { Money } from '@/core/domain/shared/value-objects/money'
import { Address } from '@/core/domain/shared/value-objects/address'

describe('Use Cases Integration', () => {
  describe('GetGuests', () => {
    let useCase: GetGuests
    let mockGuestRepository: any
    let mockPropertyRepository: any

    beforeEach(() => {
      mockGuestRepository = {
        findByProperties: jest.fn(),
        countByProperties: jest.fn()
      }
      mockPropertyRepository = {
        findByUser: jest.fn(),
        hasAccess: jest.fn()
      }
      useCase = new GetGuests(mockGuestRepository, mockPropertyRepository)
    })

    it('should get guests for user properties', async () => {
      // Arrange
      mockPropertyRepository.findByUser.mockResolvedValue([
        { id: 'prop_1' },
        { id: 'prop_2' }
      ])
      mockGuestRepository.findByProperties.mockResolvedValue([
        { id: 'guest_1', name: 'Janez Novak', email: 'janez@example.com', propertyId: 'prop_1' },
        { id: 'guest_2', name: 'Maja Horvat', email: 'maja@example.com', propertyId: 'prop_2' }
      ])
      mockGuestRepository.countByProperties.mockResolvedValue(2)

      // Act
      const result = await useCase.execute({
        userId: 'user_123',
        limit: 20,
        offset: 0
      })

      // Assert
      expect(result.guests).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(mockPropertyRepository.findByUser).toHaveBeenCalledWith('user_123')
      expect(mockGuestRepository.findByProperties).toHaveBeenCalled()
    })

    it('should filter guests by search query', async () => {
      // Arrange
      mockPropertyRepository.findByUser.mockResolvedValue([{ id: 'prop_1' }])
      mockGuestRepository.findByProperties.mockResolvedValue([
        { id: 'guest_1', name: 'Janez Novak', email: 'janez@example.com' }
      ])
      mockGuestRepository.countByProperties.mockResolvedValue(1)

      // Act
      const result = await useCase.execute({
        userId: 'user_123',
        searchQuery: 'janez',
        limit: 20,
        offset: 0
      })

      // Assert
      expect(result.guests).toHaveLength(1)
      expect(mockGuestRepository.findByProperties).toHaveBeenCalledWith(
        ['prop_1'],
        expect.objectContaining({
          searchQuery: 'janez'
        })
      )
    })

    it('should handle pagination', async () => {
      // Arrange
      mockPropertyRepository.findByUser.mockResolvedValue([{ id: 'prop_1' }])
      mockGuestRepository.findByProperties.mockResolvedValue([
        { id: 'guest_1', name: 'Guest 1' },
        { id: 'guest_2', name: 'Guest 2' }
      ])
      mockGuestRepository.countByProperties.mockResolvedValue(50)

      // Act
      const result = await useCase.execute({
        userId: 'user_123',
        limit: 2,
        offset: 0
      })

      // Assert
      expect(result.guests).toHaveLength(2)
      expect(result.total).toBe(50)
      expect(result.hasMore).toBe(true)
    })

    it('should throw error if user does not have property access', async () => {
      // Arrange
      mockPropertyRepository.hasAccess.mockResolvedValue(false)

      // Act & Assert
      await expect(
        useCase.execute({
          userId: 'user_123',
          propertyId: 'prop_456'
        })
      ).rejects.toThrow('Access denied to property')
    })
  })

  describe('GetProperty', () => {
    let useCase: GetProperty
    let mockPropertyRepository: any

    beforeEach(() => {
      mockPropertyRepository = {
        findById: jest.fn(),
        hasAccess: jest.fn()
      }
      useCase = new GetProperty(mockPropertyRepository)
    })

    it('should get property details', async () => {
      // Arrange
      mockPropertyRepository.hasAccess.mockResolvedValue(true)
      mockPropertyRepository.findById.mockResolvedValue({
        id: 'prop_123',
        name: 'Test Property',
        type: 'apartment',
        status: 'active',
        basePrice: 100,
        currency: 'EUR',
        amenities: [
          { id: 'amenity_1', name: 'WiFi', category: 'internet' }
        ],
        rooms: [
          { id: 'room_1', name: 'Room 1', type: 'double', maxOccupancy: 2, baseRate: 100 }
        ],
        policies: [
          { id: 'policy_1', type: 'cancellation', description: 'Free cancellation', active: true }
        ]
      })

      // Act
      const result = await useCase.execute({
        propertyId: 'prop_123',
        userId: 'user_123'
      })

      // Assert
      expect(result.property.name).toBe('Test Property')
      expect(result.amenities).toHaveLength(1)
      expect(result.rooms).toHaveLength(1)
      expect(result.policies).toHaveLength(1)
    })

    it('should throw error if property not found', async () => {
      // Arrange
      mockPropertyRepository.hasAccess.mockResolvedValue(true)
      mockPropertyRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'prop_456',
          userId: 'user_123'
        })
      ).rejects.toThrow('Property not found')
    })

    it('should throw error if user does not have access', async () => {
      // Arrange
      mockPropertyRepository.hasAccess.mockResolvedValue(false)

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'prop_123',
          userId: 'user_123'
        })
      ).rejects.toThrow('Access denied')
    })
  })

  describe('CalculatePrice', () => {
    let useCase: CalculatePrice

    beforeEach(() => {
      useCase = new CalculatePrice()
    })

    it('should calculate price for 7 nights', () => {
      // Arrange
      const property = new Property({
        id: 'prop_123',
        name: 'Test Property',
        type: 'apartment',
        status: 'active',
        address: new Address('Test St 1', 'Ljubljana', '1000', 'Slovenia'),
        description: 'Test',
        baseRate: new Money(100, 'EUR'),
        amenities: [],
        rooms: [],
        policies: []
      })

      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act
      const result = useCase.execute({
        property,
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert
      expect(result.nights).toBe(7)
      expect(result.basePrice.amount).toBe(700) // 7 nights * 100 EUR
      expect(result.totalPrice.amount).toBeGreaterThan(700) // With taxes
    })

    it('should apply long-stay discount for 7+ nights', () => {
      // Arrange
      const property = new Property({
        id: 'prop_123',
        name: 'Test Property',
        type: 'apartment',
        status: 'active',
        address: new Address('Test St 1', 'Ljubljana', '1000', 'Slovenia'),
        description: 'Test',
        baseRate: new Money(100, 'EUR'),
        amenities: [],
        rooms: [],
        policies: []
      })

      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08') // 7 nights

      // Act
      const result = useCase.execute({
        property,
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert - should have discount applied
      expect(result.discounts.amount).toBeGreaterThan(0)
    })

    it('should throw error if check-out is before check-in', () => {
      // Arrange
      const property = new Property({
        id: 'prop_123',
        name: 'Test Property',
        type: 'apartment',
        status: 'active',
        address: new Address('Test St 1', 'Ljubljana', '1000', 'Slovenia'),
        description: 'Test',
        baseRate: new Money(100, 'EUR'),
        amenities: [],
        rooms: [],
        policies: []
      })

      const checkIn = new Date('2026-07-08')
      const checkOut = new Date('2026-07-01')

      // Act & Assert
      expect(() =>
        useCase.execute({
          property,
          checkIn,
          checkOut,
          guests: 2
        })
      ).toThrow('Check-in must be before check-out')
    })
  })
})
