/**
 * Integration Test: Cancel Reservation API
 * 
 * Testira celoten flow: API → Use Case → Domain → Repository → Event
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { POST, GET } from '@/app/api/tourism/reservations/[id]/cancel/route'
import { NextRequest } from 'next/server'

// Mock repositories
jest.mock('@/infrastructure/database/repositories/reservation-repository')
jest.mock('@/infrastructure/database/repositories/property-repository')
jest.mock('@/infrastructure/messaging/in-memory-event-bus')

describe('Cancel Reservation API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/tourism/reservations/[id]/cancel', () => {
    it('should successfully cancel reservation and calculate refund', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-123',
        propertyId: 'prop-456',
        guestId: 'guest-789',
        status: 'confirmed',
        totalPrice: { amount: 500, currency: 'EUR' },
        canBeCancelled: () => true,
        cancel: jest.fn(),
        toJSON: () => mockReservation
      }

      const mockProperty = {
        id: 'prop-456',
        name: 'Test Property'
      }

      // Mock repositories
      const { ReservationRepositoryImpl } = require('@/infrastructure/database/repositories/reservation-repository')
      const { PropertyRepositoryImpl } = require('@/infrastructure/database/repositories/property-repository')

      ReservationRepositoryImpl.prototype.findById.mockResolvedValue(mockReservation)
      PropertyRepositoryImpl.prototype.findById.mockResolvedValue(mockProperty)

      const requestBody = {
        reason: 'Emergency',
        cancelledBy: 'guest' as const
      }

      const request = new NextRequest(
        new URL('http://localhost:3000/api/tourism/reservations/res-123/cancel'),
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      // Act
      const response = await POST(request, { params: { id: 'res-123' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.refundAmount).toBeDefined()
      expect(data.cancellationFee).toBeDefined()
      expect(mockReservation.cancel).toHaveBeenCalledWith('Emergency')
    })

    it('should reject cancellation if reservation cannot be cancelled', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-123',
        propertyId: 'prop-456',
        status: 'checked_in',
        canBeCancelled: () => false
      }

      const { ReservationRepositoryImpl } = require('@/infrastructure/database/repositories/reservation-repository')
      ReservationRepositoryImpl.prototype.findById.mockResolvedValue(mockReservation)

      const requestBody = {
        reason: 'Changed plans',
        cancelledBy: 'guest' as const
      }

      const request = new NextRequest(
        new URL('http://localhost:3000/api/tourism/reservations/res-123/cancel'),
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      // Act
      const response = await POST(request, { params: { id: 'res-123' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot be cancelled')
    })

    it('should return 404 if reservation not found', async () => {
      // Arrange
      const { ReservationRepositoryImpl } = require('@/infrastructure/database/repositories/reservation-repository')
      ReservationRepositoryImpl.prototype.findById.mockResolvedValue(null)

      const requestBody = {
        reason: 'Test',
        cancelledBy: 'guest' as const
      }

      const request = new NextRequest(
        new URL('http://localhost:3000/api/tourism/reservations/non-existent/cancel'),
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      // Act
      const response = await POST(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('Reservation not found')
    })

    it('should require reason and cancelledBy fields', async () => {
      // Arrange
      const request = new NextRequest(
        new URL('http://localhost:3000/api/tourism/reservations/res-123/cancel'),
        {
          method: 'POST',
          body: JSON.stringify({}) // Missing required fields
        }
      )

      // Act
      const response = await POST(request, { params: { id: 'res-123' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('GET /api/tourism/reservations/[id]/cancel', () => {
    it('should return cancellation policy', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-123',
        propertyId: 'prop-456',
        dateRange: {
          start: new Date('2026-07-01'),
          end: new Date('2026-07-08')
        }
      }

      const mockProperty = {
        id: 'prop-456'
      }

      const { ReservationRepositoryImpl } = require('@/infrastructure/database/repositories/reservation-repository')
      const { PropertyRepositoryImpl } = require('@/infrastructure/database/repositories/property-repository')

      ReservationRepositoryImpl.prototype.findById.mockResolvedValue(mockReservation)
      PropertyRepositoryImpl.prototype.findById.mockResolvedValue(mockProperty)

      const request = new NextRequest(
        new URL('http://localhost:3000/api/tourism/reservations/res-123/cancel')
      )

      // Act
      const response = await GET(request, { params: { id: 'res-123' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.policy).toBeDefined()
      expect(data.policy.type).toBe('moderate')
      expect(data.policy.eligibleRefund).toBeDefined()
    })

    it('should return 404 if reservation not found', async () => {
      // Arrange
      const { ReservationRepositoryImpl } = require('@/infrastructure/database/repositories/reservation-repository')
      ReservationRepositoryImpl.prototype.findById.mockResolvedValue(null)

      const request = new NextRequest(
        new URL('http://localhost:3000/api/tourism/reservations/non-existent/cancel')
      )

      // Act
      const response = await GET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('Reservation not found')
    })
  })
})
