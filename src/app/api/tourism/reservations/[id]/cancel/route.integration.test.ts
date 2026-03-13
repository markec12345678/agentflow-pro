/**
 * Integration Test: Cancel Reservation API
 * 
 * Testira celoten API flow za preklic rezervacije.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { POST, GET } from '@/app/api/tourism/reservations/[id]/cancel/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/infrastructure/database/prisma'

// ============================================================================
// Test Setup
// ============================================================================

describe('Cancel Reservation API - Integration', () => {
  const testReservationId = 'test-reservation-123'
  const testPropertyId = 'test-property-456'
  const testGuestId = 'test-guest-789'

  // Setup test data before each test
  beforeEach(async () => {
    // Create test property
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

    // Create test guest
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

    // Create test reservation (7 days from now)
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + 7)
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 14)

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
  })

  // Cleanup after each test
  afterEach(async () => {
    // Delete test data
    await prisma.reservation.deleteMany({
      where: { id: testReservationId }
    })
    await prisma.guest.deleteMany({
      where: { id: testGuestId }
    })
    await prisma.property.deleteMany({
      where: { id: testPropertyId }
    })
  })

  // ============================================================================
  // POST /api/tourism/reservations/[id]/cancel Tests
  // ============================================================================

  describe('POST /api/tourism/reservations/[id]/cancel', () => {
    it('should successfully cancel reservation with refund', async () => {
      // Arrange
      const requestBody = {
        reason: 'Emergency - flight cancelled',
        cancelledBy: 'guest' as const
      }

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/tourism/reservations/${testReservationId}/cancel`),
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      // Act
      const response = await POST(request, { params: { id: testReservationId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.reservation).toBeDefined()
      expect(data.reservation.status).toBe('cancelled')
      expect(data.refundAmount).toBeDefined()
      expect(data.refundAmount.amount).toBeGreaterThan(0)
      expect(data.cancellationFee).toBeDefined()
    })

    it('should return 404 for non-existent reservation', async () => {
      // Arrange
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

    it('should reject cancellation for checked-in reservation', async () => {
      // Arrange - Update reservation to checked_in
      await prisma.reservation.update({
        where: { id: testReservationId },
        data: { status: 'checked_in' }
      })

      const requestBody = {
        reason: 'Test',
        cancelledBy: 'guest' as const
      }

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/tourism/reservations/${testReservationId}/cancel`),
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      // Act
      const response = await POST(request, { params: { id: testReservationId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot be cancelled')
    })

    it('should require reason and cancelledBy fields', async () => {
      // Arrange
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/tourism/reservations/${testReservationId}/cancel`),
        {
          method: 'POST',
          body: JSON.stringify({}) // Missing required fields
        }
      )

      // Act
      const response = await POST(request, { params: { id: testReservationId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should calculate full refund for host cancellation', async () => {
      // Arrange
      const requestBody = {
        reason: 'Property maintenance',
        cancelledBy: 'host' as const
      }

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/tourism/reservations/${testReservationId}/cancel`),
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      // Act
      const response = await POST(request, { params: { id: testReservationId } })
      const data = await response.json()

      // Assert - Host cancellation = full refund
      expect(response.status).toBe(200)
      expect(data.refundAmount.amount).toBe(700) // Full amount
      expect(data.cancellationFee.amount).toBe(0)
    })
  })

  // ============================================================================
  // GET /api/tourism/reservations/[id]/cancel Tests
  // ============================================================================

  describe('GET /api/tourism/reservations/[id]/cancel', () => {
    it('should return cancellation policy', async () => {
      // Arrange
      const request = new NextRequest(
        new URL(`http://localhost:3000/api/tourism/reservations/${testReservationId}/cancel`)
      )

      // Act
      const response = await GET(request, { params: { id: testReservationId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.policy).toBeDefined()
      expect(data.policy.type).toBe('moderate')
      expect(data.policy.fullRefundDays).toBe(7)
      expect(data.policy.partialRefundDays).toBe(3)
      expect(data.policy.partialRefundPercent).toBe(50)
    })

    it('should calculate eligible refund based on days until check-in', async () => {
      // Arrange - Create reservation 10 days from now (eligible for full refund)
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() + 10)
      const checkOut = new Date()
      checkOut.setDate(checkOut.getDate() + 17)

      const futureReservationId = 'future-reservation'
      await prisma.reservation.create({
        data: {
          id: futureReservationId,
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

      const request = new NextRequest(
        new URL(`http://localhost:3000/api/tourism/reservations/${futureReservationId}/cancel`)
      )

      // Act
      const response = await GET(request, { params: { id: futureReservationId } })
      const data = await response.json()

      // Assert - 10 days > 7 days = full refund
      expect(response.status).toBe(200)
      expect(data.policy.eligibleRefund).toBe('100%')

      // Cleanup
      await prisma.reservation.delete({ where: { id: futureReservationId } })
    })

    it('should return 404 for non-existent reservation', async () => {
      // Arrange
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
