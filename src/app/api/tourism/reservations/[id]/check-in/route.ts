/**
 * API Route: Process Check-In
 * 
 * POST /api/tourism/reservations/[id]/check-in
 * 
 * Opravi check-in gosta z uporabo ProcessCheckIn use case-a.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/infrastructure/observability/logger';
import { ProcessCheckIn } from '@/core/use-cases/process-check-in'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories/reservation-repository'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories/property-repository'
import { GuestRepositoryImpl } from '@/infrastructure/database/repositories/guest-repository'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// ============================================================================
// Request Type
// ============================================================================

interface CheckInRequest {
  checkInTime?: string // ISO date
  specialRequests?: string[]
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: true; reservation: any; roomNumber?: string; accessCode?: string } | { error: string }>> {
  try {
    // 1. Parse request body
    const body: CheckInRequest = await request.json()

    // 2. Initialize repositories
    const reservationRepo = new ReservationRepositoryImpl()
    const propertyRepo = new PropertyRepositoryImpl()
    const guestRepo = new GuestRepositoryImpl()

    // 3. Load reservation
    const reservation = await reservationRepo.findById(params.id)
    
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // 4. Load property and guest
    const property = await propertyRepo.findById(reservation.propertyId)
    const guest = await guestRepo.findById(reservation.guestId)
    
    if (!property || !guest) {
      return NextResponse.json(
        { error: 'Property or guest not found' },
        { status: 404 }
      )
    }

    // 5. Execute use case
    const processCheckIn = new ProcessCheckIn()
    const result = await processCheckIn.execute({
      reservation,
      guest,
      property,
      checkInTime: body.checkInTime ? new Date(body.checkInTime) : undefined,
      specialRequests: body.specialRequests
    })

    // 6. Save changes
    await reservationRepo.save(result.reservation)

    // 7. Publish event
    await eventBus.publish(result.event)

    // 8. Return response
    return NextResponse.json({
      success: true,
      reservation: result.reservation.toJSON(),
      roomNumber: result.roomNumber,
      accessCode: result.accessCode
    })

  } catch (error: any) {
    logger.error('Check-in error:', error)

    if (error.message.includes('not ready for check-in')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.message.includes('Guest mismatch') || 
        error.message.includes('ID verification')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    if (error.message.includes('Too early') || 
        error.message.includes('date has passed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    if (error.message.includes('Payment required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    )
  }
}
