/**
 * Unit Test: CreateReservation Use Case
 * 
 * Testira business logic za kreiranje rezervacij.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { CreateReservation } from '@/core/use-cases/create-reservation'
import { Property } from '@/core/domain/tourism/entities/property'
import { Guest } from '@/core/domain/guest/entities/guest'
import { Money } from '@/core/domain/shared/value-objects/money'
import { Address } from '@/core/domain/shared/value-objects/address'
import { BusinessRuleError, NotFoundError } from '@/core/errors/domain-errors'

// ============================================================================
// Mock Repositories
// ============================================================================

class MockPropertyRepository {
  async findById(id: string) {
    if (id === 'property-not-found') return null
    
    return new Property({
      id,
      name: 'Test Property',
      type: 'apartment',
      status: 'active',
      address: new Address('Test St 1', 'Ljubljana', '1000', 'Slovenia'),
      description: 'Test',
      baseRate: new Money(100, 'EUR'),
      amenities: ['wifi', 'kitchen'],
      rooms: [],
      policies: []
    })
  }

  async findAll() { return [] }
  async save() {}
  async delete() {}
  async findAvailable() { return [] }
}

class MockGuestRepository {
  async findById(id: string) {
    if (id === 'guest-not-found') return null
    
    return Guest.create({
      id,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    })
  }

  async findByEmail() { return null }
  async save() {}
  async delete() {}
  async find() { return [] }
  async findWithLoyaltyPoints() { return [] }
}

// ============================================================================
// Tests
// ============================================================================

describe('CreateReservation Use Case', () => {
  let useCase: CreateReservation
  let propertyRepo: MockPropertyRepository
  let guestRepo: MockGuestRepository

  beforeEach(() => {
    propertyRepo = new MockPropertyRepository()
    guestRepo = new MockGuestRepository()
    useCase = new CreateReservation(propertyRepo as any, guestRepo as any)
  })

  describe('Success Scenarios', () => {
    it('should create reservation for valid input', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      // Act
      const result = await useCase.execute({
        propertyId: 'property-123',
        property: await propertyRepo.findById('property-123'),
        guestId: 'guest-456',
        guest: await guestRepo.findById('guest-456'),
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.reservation).toBeDefined()
      expect(result.confirmationCode).toMatch(/^[A-Z0-9]{6}$/)
      expect(result.totalPrice.amount).toBeGreaterThan(0)
    })

    it('should calculate correct price for 7 nights', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08') // 7 nights
      const baseRate = 100

      // Act
      const result = await useCase.execute({
        propertyId: 'property-123',
        property: await propertyRepo.findById('property-123'),
        guestId: 'guest-456',
        guest: await guestRepo.findById('guest-456'),
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert
      expect(result.totalPrice.amount).toBe(baseRate * 7) // 700 EUR
    })

    it('should apply long-stay discount for 7+ nights', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08') // 7 nights = 15% discount

      // Act
      const result = await useCase.execute({
        propertyId: 'property-123',
        property: await propertyRepo.findById('property-123'),
        guestId: 'guest-456',
        guest: await guestRepo.findById('guest-456'),
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert - should have discount applied
      expect(result.totalPrice.amount).toBeLessThan(100 * 7) // Less than 700
    })
  })

  describe('Error Scenarios', () => {
    it('should throw NotFoundError if property not found', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-not-found',
          property: null as any,
          guestId: 'guest-456',
          guest: await guestRepo.findById('guest-456'),
          checkIn,
          checkOut,
          guests: 2
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError if guest not found', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-123',
          property: await propertyRepo.findById('property-123'),
          guestId: 'guest-not-found',
          guest: null as any,
          checkIn,
          checkOut,
          guests: 2
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw BusinessRuleError if check-in is in the past', async () => {
      // Arrange
      const checkIn = new Date('2020-01-01') // Past
      const checkOut = new Date('2020-01-08')

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-123',
          property: await propertyRepo.findById('property-123'),
          guestId: 'guest-456',
          guest: await guestRepo.findById('guest-456'),
          checkIn,
          checkOut,
          guests: 2
        })
      ).rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError if check-out before check-in', async () => {
      // Arrange
      const checkIn = new Date('2026-07-08')
      const checkOut = new Date('2026-07-01') // Before check-in

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-123',
          property: await propertyRepo.findById('property-123'),
          guestId: 'guest-456',
          guest: await guestRepo.findById('guest-456'),
          checkIn,
          checkOut,
          guests: 2
        })
      ).rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError if stay is less than 2 nights', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-02') // 1 night only

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-123',
          property: await propertyRepo.findById('property-123'),
          guestId: 'guest-456',
          guest: await guestRepo.findById('guest-456'),
          checkIn,
          checkOut,
          guests: 2
        })
      ).rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError if stay is more than 30 nights', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-08-15') // 45 nights

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-123',
          property: await propertyRepo.findById('property-123'),
          guestId: 'guest-456',
          guest: await guestRepo.findById('guest-456'),
          checkIn,
          checkOut,
          guests: 2
        })
      ).rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError if guests is 0', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act & Assert
      await expect(
        useCase.execute({
          propertyId: 'property-123',
          property: await propertyRepo.findById('property-123'),
          guestId: 'guest-456',
          guest: await guestRepo.findById('guest-456'),
          checkIn,
          checkOut,
          guests: 0 // Invalid
        })
      ).rejects.toThrow(BusinessRuleError)
    })
  })
})
