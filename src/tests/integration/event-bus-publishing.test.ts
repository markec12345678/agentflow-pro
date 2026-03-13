/**
 * Integration Tests: Event Bus Publishing
 * 
 * Testi za event publishing v use case-ih.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { CreateReservation } from '@/core/use-cases/create-reservation'
import { CancelReservation } from '@/core/use-cases/cancel-reservation'
import { InMemoryEventBus } from '@/infrastructure/messaging/in-memory-event-bus'
import { Property } from '@/core/domain/tourism/entities/property'
import { Guest } from '@/core/domain/guest/entities/guest'
import { Money } from '@/core/domain/shared/value-objects/money'
import { Address } from '@/core/domain/shared/value-objects/address'
import { ReservationCreated, ReservationCancelled } from '@/core/domain/tourism/events/reservation-events'

describe('Event Bus Publishing Integration', () => {
  let eventBus: InMemoryEventBus

  beforeEach(() => {
    eventBus = new InMemoryEventBus()
  })

  describe('CreateReservation with Event Publishing', () => {
    it('should publish ReservationCreated event on success', async () => {
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

      const guest = Guest.create({
        id: 'guest_456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      const useCase = new CreateReservation(eventBus)
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act
      const result = await useCase.execute({
        propertyId: property.id,
        property,
        guestId: guest.id,
        guest,
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert
      expect(result.reservation).toBeDefined()
      expect(result.confirmationCode).toMatch(/^[A-Z0-9]{6}$/)

      // Verify event was published
      const events = await eventBus.findByAggregateId(result.reservation.id)
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(ReservationCreated)
      
      const reservationCreatedEvent = events[0] as ReservationCreated
      expect(reservationCreatedEvent.reservationId).toBe(result.reservation.id)
      expect(reservationCreatedEvent.propertyId).toBe(property.id)
      expect(reservationCreatedEvent.guestId).toBe(guest.id)
      expect(reservationCreatedEvent.checkIn).toEqual(checkIn)
      expect(reservationCreatedEvent.checkOut).toEqual(checkOut)
      expect(reservationCreatedEvent.guests).toBe(2)
    })

    it('should not publish event if event bus is not provided', async () => {
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

      const guest = Guest.create({
        id: 'guest_456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      const useCase = new CreateReservation() // No event bus
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act
      const result = await useCase.execute({
        propertyId: property.id,
        property,
        guestId: guest.id,
        guest,
        checkIn,
        checkOut,
        guests: 2
      })

      // Assert
      expect(result.reservation).toBeDefined()
      
      // Verify NO events were published
      const events = await eventBus.findByAggregateId(result.reservation.id)
      expect(events).toHaveLength(0)
    })
  })

  describe('CancelReservation with Event Publishing', () => {
    it('should publish ReservationCancelled event on success', async () => {
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

      const guest = Guest.create({
        id: 'guest_456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      // First create a reservation
      const createUseCase = new CreateReservation(eventBus)
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      
      const createResult = await createUseCase.execute({
        propertyId: property.id,
        property,
        guestId: guest.id,
        guest,
        checkIn,
        checkOut,
        guests: 2
      })

      // Clear events from creation
      eventBus.clear()

      // Now cancel the reservation
      const cancelUseCase = new CancelReservation(eventBus)

      // Act
      const cancelResult = await cancelUseCase.execute({
        reservation: createResult.reservation,
        property,
        cancelledBy: 'guest',
        reason: 'Test cancellation'
      })

      // Assert
      expect(cancelResult.reservation.status).toBe('cancelled')
      expect(cancelResult.refundAmount.amount).toBeGreaterThan(0)

      // Verify event was published
      const events = await eventBus.findByAggregateId(createResult.reservation.id)
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(ReservationCancelled)
      
      const reservationCancelledEvent = events[0] as ReservationCancelled
      expect(reservationCancelledEvent.reservationId).toBe(createResult.reservation.id)
      expect(reservationCancelledEvent.reason).toBe('Test cancellation')
      expect(reservationCancelledEvent.cancelledBy).toBe('guest')
    })

    it('should handle multiple events in order', async () => {
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

      const guest = Guest.create({
        id: 'guest_456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      const createUseCase = new CreateReservation(eventBus)
      const cancelUseCase = new CancelReservation(eventBus)
      
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act - Create and cancel
      const createResult = await createUseCase.execute({
        propertyId: property.id,
        property,
        guestId: guest.id,
        guest,
        checkIn,
        checkOut,
        guests: 2
      })

      const cancelResult = await cancelUseCase.execute({
        reservation: createResult.reservation,
        property,
        cancelledBy: 'guest',
        reason: 'Test cancellation'
      })

      // Assert - Verify both events in order
      const events = await eventBus.findByAggregateId(createResult.reservation.id)
      expect(events).toHaveLength(2)
      expect(events[0]).toBeInstanceOf(ReservationCreated)
      expect(events[1]).toBeInstanceOf(ReservationCancelled)
      
      // Verify order
      expect(events[0].occurredAt).toBeLessThanOrEqual(events[1].occurredAt)
    })
  })

  describe('Event Handler Integration', () => {
    it('should trigger event handlers when events are published', async () => {
      // Arrange
      const handler = jest.fn()
      eventBus.subscribe(ReservationCreated, handler)

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

      const guest = Guest.create({
        id: 'guest_456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      const useCase = new CreateReservation(eventBus)
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')

      // Act
      await useCase.execute({
        propertyId: property.id,
        property,
        guestId: guest.id,
        guest,
        checkIn,
        checkOut,
        guests: 2
      })

      // Wait for async event processing
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(expect.any(ReservationCreated))
    })
  })
})
