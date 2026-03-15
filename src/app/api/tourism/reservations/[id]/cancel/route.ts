/**
 * API Route: Cancel Reservation
 * 
 * POST /api/tourism/reservations/[id]/cancel
 * 
 * Prekliči rezervacijo z uporabo CancelReservation use case-a.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/infrastructure/observability/logger';
import { CancelReservation } from '@/core/use-cases/cancel-reservation'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories/reservation-repository'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories/property-repository'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// ============================================================================
// Request/Response Types
// ============================================================================

interface CancelRequest {
  reason: string
  cancelledBy: 'guest' | 'host' | 'system'
}

interface CancelResponse {
  success: true
  reservation: any
  refundAmount: {
    amount: number
    currency: string
  }
  cancellationFee: {
    amount: number
    currency: string
  }
  message: string
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<CancelResponse | { error: string }>> {
  try {
    // 1. Parse request body
    const body: CancelRequest = await request.json()
    
    if (!body.reason || !body.cancelledBy) {
      return NextResponse.json(
        { error: 'Missing required fields: reason, cancelledBy' },
        { status: 400 }
      )
    }

    // 2. Initialize repositories
    const reservationRepo = new ReservationRepositoryImpl()
    const propertyRepo = new PropertyRepositoryImpl()

    // 3. Load reservation
    const reservation = await reservationRepo.findById(params.id)
    
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // 4. Load property
    const property = await propertyRepo.findById(reservation.propertyId)
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // 5. Execute use case
    const cancelReservation = new CancelReservation()
    const result = await cancelReservation.execute({
      reservation,
      property,
      cancelledBy: body.cancelledBy,
      reason: body.reason
    })

    // 6. Save changes
    await reservationRepo.save(result.reservation)

    // 7. Publish event
    await eventBus.publish(result.event)

    // 8. Send notification (TODO: Implement email service)
    // await sendCancellationEmail({ ... })

    // 9. Return response
    return NextResponse.json({
      success: true,
      reservation: result.reservation.toJSON(),
      refundAmount: result.refundAmount.toJSON(),
      cancellationFee: result.cancellationFee.toJSON(),
      message: body.cancelledBy === 'guest'
        ? 'Vaša rezervacija je bila preklicana.'
        : 'Rezervacija je bila preklicana.'
    })

  } catch (error: any) {
    logger.error('Cancel reservation error:', error)

    // Handle specific errors
    if (error.message.includes('cannot be cancelled')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET Handler (Get cancellation policy)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ policy: any } | { error: string }>> {
  try {
    const reservationRepo = new ReservationRepositoryImpl()
    const propertyRepo = new PropertyRepositoryImpl()

    const reservation = await reservationRepo.findById(params.id)
    
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const property = await propertyRepo.findById(reservation.propertyId)
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Calculate refund based on current date
    const daysUntilCheckIn = Math.ceil(
      (reservation.dateRange.start.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Moderate policy (default)
    const policy = {
      type: 'moderate',
      fullRefundDays: 7,
      partialRefundDays: 3,
      partialRefundPercent: 50,
      daysUntilCheckIn,
      eligibleRefund: daysUntilCheckIn >= 7
        ? '100%'
        : daysUntilCheckIn >= 3
        ? '50%'
        : '0%'
    }

    return NextResponse.json({ policy })

  } catch (error: any) {
    logger.error('Get cancellation policy error:', error)
    return NextResponse.json(
      { error: 'Failed to get cancellation policy' },
      { status: 500 }
    )
  }
}
