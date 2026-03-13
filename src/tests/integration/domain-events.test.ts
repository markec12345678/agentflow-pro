/**
 * Integration Tests: Domain Events & Event Bus
 * 
 * Testi za event-driven arhitekturo.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { InMemoryEventBus, eventBus } from '@/infrastructure/messaging/in-memory-event-bus'
import {
  ReservationCreated,
  ReservationConfirmed,
  ReservationCancelled
} from '@/core/domain/tourism/events/reservation-events'
import { Money } from '@/core/domain/shared/value-objects/money'

describe('Domain Events Integration', () => {
  let testEventBus: InMemoryEventBus

  beforeEach(() => {
    // Create fresh event bus for each test
    testEventBus = new InMemoryEventBus()
  })

  describe('Event Bus', () => {
    it('should publish and handle event', async () => {
      // Arrange
      const handler = jest.fn()
      testEventBus.subscribe(ReservationCreated, handler)

      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      // Act
      await testEventBus.publish(event)

      // Assert
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should handle multiple events in queue', async () => {
      // Arrange
      const createdHandler = jest.fn()
      const confirmedHandler = jest.fn()
      const cancelledHandler = jest.fn()

      testEventBus.subscribe(ReservationCreated, createdHandler)
      testEventBus.subscribe(ReservationConfirmed, confirmedHandler)
      testEventBus.subscribe(ReservationCancelled, cancelledHandler)

      const createdEvent = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      const confirmedEvent = new ReservationConfirmed(
        'res_123',
        new Date(),
        'ABC123'
      )

      // Act
      await testEventBus.publishAll([createdEvent, confirmedEvent])

      // Assert
      expect(createdHandler).toHaveBeenCalledTimes(1)
      expect(confirmedHandler).toHaveBeenCalledTimes(1)
      expect(cancelledHandler).not.toHaveBeenCalled()
    })

    it('should continue processing if one handler fails', async () => {
      // Arrange
      const goodHandler = jest.fn()
      const badHandler = jest.fn().mockRejectedValue(new Error('Handler error'))

      testEventBus.subscribe(ReservationCreated, badHandler)
      testEventBus.subscribe(ReservationCreated, goodHandler)

      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      // Act & Assert - should not throw
      await expect(testEventBus.publish(event)).resolves.not.toThrow()
      expect(goodHandler).toHaveBeenCalledTimes(1)
      expect(badHandler).toHaveBeenCalledTimes(1)
    })

    it('should track event statistics', async () => {
      // Arrange
      const handler = jest.fn()
      testEventBus.subscribe(ReservationCreated, handler)

      const event1 = new ReservationCreated(
        'res_1',
        'prop_1',
        'guest_1',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      const event2 = new ReservationCreated(
        'res_2',
        'prop_2',
        'guest_2',
        new Date('2026-07-15'),
        new Date('2026-07-22'),
        3,
        new Money(900, 'EUR')
      )

      // Act
      await testEventBus.publish(event1)
      await testEventBus.publish(event2)

      // Assert
      const stats = testEventBus.getStats()
      expect(stats.queuedEvents).toBe(0) // All processed
      expect(stats.totalHandlers).toBe(1)
      expect(stats.eventTypes).toBe(1)
    })

    it('should unsubscribe handler', async () => {
      // Arrange
      const handler = jest.fn()
      testEventBus.subscribe(ReservationCreated, handler)
      testEventBus.unsubscribe(ReservationCreated, handler)

      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      // Act
      await testEventBus.publish(event)

      // Assert
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle events asynchronously', async () => {
      // Arrange
      const executionOrder: string[] = []
      
      const slowHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        executionOrder.push('slow')
      })

      const fastHandler = jest.fn().mockImplementation(() => {
        executionOrder.push('fast')
      })

      testEventBus.subscribe(ReservationCreated, slowHandler)
      testEventBus.subscribe(ReservationCreated, fastHandler)

      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      // Act
      await testEventBus.publish(event)

      // Assert - both handlers should be called
      expect(slowHandler).toHaveBeenCalledTimes(1)
      expect(fastHandler).toHaveBeenCalledTimes(1)
      expect(executionOrder).toContain('fast')
      expect(executionOrder).toContain('slow')
    })
  })

  describe('Event Structure', () => {
    it('should create ReservationCreated event with correct structure', () => {
      // Arrange
      const checkIn = new Date('2026-07-01')
      const checkOut = new Date('2026-07-08')
      const totalPrice = new Money(700, 'EUR')

      // Act
      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        checkIn,
        checkOut,
        2,
        totalPrice,
        { source: 'web' }
      )

      // Assert
      expect(event.eventId).toMatch(/evt_\d+_[a-z0-9]+/)
      expect(event.aggregateId).toBe('res_123')
      expect(event.aggregateType).toBe('Reservation')
      expect(event.reservationId).toBe('res_123')
      expect(event.propertyId).toBe('prop_456')
      expect(event.guestId).toBe('guest_789')
      expect(event.checkIn).toEqual(checkIn)
      expect(event.checkOut).toEqual(checkOut)
      expect(event.guests).toBe(2)
      expect(event.totalPrice).toEqual(totalPrice)
      expect(event.metadata).toEqual({ source: 'web' })
      expect(event.occurredAt).toBeInstanceOf(Date)
    })

    it('should create ReservationConfirmed event', () => {
      // Act
      const event = new ReservationConfirmed(
        'res_123',
        new Date('2026-06-15'),
        'ABC123'
      )

      // Assert
      expect(event.aggregateId).toBe('res_123')
      expect(event.confirmedAt).toBeInstanceOf(Date)
      expect(event.confirmationCode).toBe('ABC123')
    })

    it('should create ReservationCancelled event with refund', () => {
      // Act
      const event = new ReservationCancelled(
        'res_123',
        'Guest emergency',
        'guest',
        new Money(350, 'EUR')
      )

      // Assert
      expect(event.aggregateId).toBe('res_123')
      expect(event.reason).toBe('Guest emergency')
      expect(event.cancelledBy).toBe('guest')
      expect(event.refundAmount).toEqual(new Money(350, 'EUR'))
    })

    it('should create ReservationCancelled event without refund', () => {
      // Act
      const event = new ReservationCancelled(
        'res_123',
        'No-show',
        'host'
      )

      // Assert
      expect(event.aggregateId).toBe('res_123')
      expect(event.reason).toBe('No-show')
      expect(event.cancelledBy).toBe('host')
      expect(event.refundAmount).toBeUndefined()
    })
  })

  describe('Event Handler Registration', () => {
    it('should register multiple handlers for same event', async () => {
      // Arrange
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      const handler3 = jest.fn()

      testEventBus.subscribe(ReservationCreated, handler1)
      testEventBus.subscribe(ReservationCreated, handler2)
      testEventBus.subscribe(ReservationCreated, handler3)

      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      // Act
      await testEventBus.publish(event)

      // Assert
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })

    it('should get correct subscriber count', () => {
      // Arrange
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      testEventBus.subscribe(ReservationCreated, handler1)
      testEventBus.subscribe(ReservationCreated, handler2)

      // Assert
      expect(testEventBus.getSubscriberCount(ReservationCreated)).toBe(2)
    })

    it('should clear all handlers', async () => {
      // Arrange
      const handler = jest.fn()
      testEventBus.subscribe(ReservationCreated, handler)
      testEventBus.clear()

      const event = new ReservationCreated(
        'res_123',
        'prop_456',
        'guest_789',
        new Date('2026-07-01'),
        new Date('2026-07-08'),
        2,
        new Money(700, 'EUR')
      )

      // Act
      await testEventBus.publish(event)

      // Assert
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
