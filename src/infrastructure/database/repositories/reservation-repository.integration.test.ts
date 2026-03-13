/**
 * Integration Test: Reservation Repository
 * 
 * Testira repository operacije z pravo database.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories/reservation-repository'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories/property-repository'
import { GuestRepositoryImpl } from '@/infrastructure/database/repositories/guest-repository'
import { prisma } from '@/infrastructure/database/prisma'
import { Money } from '@/core/domain/shared/value-objects/money'
import { DateRange } from '@/core/domain/shared/value-objects/date-range'

describe('Reservation Repository - Integration', () => {
  const testReservationId = 'test-res-123'
  const testPropertyId = 'test-prop-456'
  const testGuestId = 'test-guest-789'
  
  let reservationRepo: ReservationRepositoryImpl
  let propertyRepo: PropertyRepositoryImpl
  let guestRepo: GuestRepositoryImpl

  beforeEach(async () => {
    reservationRepo = new ReservationRepositoryImpl()
    propertyRepo = new PropertyRepositoryImpl()
    guestRepo = new GuestRepositoryImpl()

    // Setup test data
    await prisma.property.create({
      data: {
        id: testPropertyId,
        name: 'Test Property',
        type: 'apartment',
        status: 'active',
        baseRate: 100,
        city: 'Ljubljana',
        country: 'Slovenia'
      }
    })

    await prisma.guest.create({
      data: {
        id: testGuestId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Guest',
        loyaltyPoints: 0,
        tier: 'bronze',
        totalStays: 0,
        totalSpent: 0
      }
    })
  })

  afterEach(async () => {
    // Cleanup
    await prisma.reservation.deleteMany({ where: { id: testReservationId } })
    await prisma.guest.deleteMany({ where: { id: testGuestId } })
    await prisma.property.deleteMany({ where: { id: testPropertyId } })
  })

  describe('CRUD Operations', () => {
    it('should create and retrieve reservation', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      const reservation = await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: new Money(700, 'EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act
      const found = await reservationRepo.findById(testReservationId)

      // Assert
      expect(found).toBeDefined()
      expect(found?.id).toBe(testReservationId)
      expect(found?.guestId).toBe(testGuestId)
      expect(found?.guests).toBe(2)
      expect(found?.status).toBe('confirmed')
    })

    it('should update reservation', async () => {
      // Arrange - Create first
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'pending',
        paymentStatus: 'unpaid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: Money.zero('EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act - Update
      const reservation = await reservationRepo.findById(testReservationId)
      reservation!.status = 'confirmed'
      reservation!.paymentStatus = 'paid'
      await reservationRepo.save(reservation!)

      // Assert
      const updated = await reservationRepo.findById(testReservationId)
      expect(updated?.status).toBe('confirmed')
      expect(updated?.paymentStatus).toBe('paid')
    })

    it('should delete reservation', async () => {
      // Arrange - Create first
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'pending',
        paymentStatus: 'unpaid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: Money.zero('EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act - Delete
      await reservationRepo.delete(testReservationId)

      // Assert
      const found = await reservationRepo.findById(testReservationId)
      expect(found).toBeNull()
    })
  })

  describe('Query Operations', () => {
    it('should find reservations by guest', async () => {
      // Arrange - Create multiple reservations
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: new Money(700, 'EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act
      const reservations = await reservationRepo.findByGuest(testGuestId)

      // Assert
      expect(reservations).toHaveLength(1)
      expect(reservations[0].guestId).toBe(testGuestId)
    })

    it('should find reservations by property', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: new Money(700, 'EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act
      const reservations = await reservationRepo.findByProperty(testPropertyId)

      // Assert
      expect(reservations).toHaveLength(1)
      expect(reservations[0].propertyId).toBe(testPropertyId)
    })

    it('should filter reservations by status', async () => {
      // Arrange - Create reservations with different statuses
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: new Money(700, 'EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act
      const confirmed = await reservationRepo.find({ status: 'confirmed' })
      const pending = await reservationRepo.find({ status: 'pending' })

      // Assert
      expect(confirmed).toHaveLength(1)
      expect(pending).toHaveLength(0)
    })

    it('should filter reservations by date range', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await reservationRepo.save({
        id: testReservationId,
        propertyId: testPropertyId,
        guestId: testGuestId,
        dateRange: new DateRange(checkIn, checkOut),
        guests: 2,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalPrice: new Money(700, 'EUR'),
        paidAmount: new Money(700, 'EUR'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Act - Search overlapping date range
      const reservations = await reservationRepo.find({
        dateRange: {
          start: new Date('2026-07-05'),
          end: new Date('2026-07-12')
        }
      })

      // Assert
      expect(reservations).toHaveLength(1)
    })
  })

  describe('Domain Mapping', () => {
    it('should map Prisma data to Domain Reservation', async () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      await prisma.reservation.create({
        data: {
          id: testReservationId,
          propertyId: testPropertyId,
          guestId: testGuestId,
          checkIn,
          checkOut,
          guests: 2,
          status: 'confirmed',
          paymentStatus: 'paid',
          totalPrice: 700,
          paidAmount: 700
        }
      })

      // Act
      const reservation = await reservationRepo.findById(testReservationId)

      // Assert - Domain object should have correct methods
      expect(reservation).toBeDefined()
      expect(reservation?.isActive()).toBe(true)
      expect(reservation?.isPaid()).toBe(true)
      expect(reservation?.canBeCancelled()).toBe(true)
      expect(reservation?.nights()).toBe(7)
      expect(reservation?.totalPrice.amount).toBe(700)
    })
  })
})
