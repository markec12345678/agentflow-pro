/**
 * API Route: Confirm Reservation
 * 
 * POST /api/tourism/reservations/[id]/confirm
 * 
 * Potrdi rezervacijo z uporabo ConfirmReservation use case-a.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/infrastructure/observability/logger';
import { ConfirmReservation } from '@/core/use-cases/confirm-reservation'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories/reservation-repository'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories/property-repository'
import { GuestRepositoryImpl } from '@/infrastructure/database/repositories/guest-repository'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: true; reservation: any; confirmationCode: string } | { error: string }>> {
  try {
    // 1. Initialize repositories
    const reservationRepo = new ReservationRepositoryImpl()
    const propertyRepo = new PropertyRepositoryImpl()
    const guestRepo = new GuestRepositoryImpl()

    // 2. Load reservation
    const reservation = await reservationRepo.findById(params.id)
    
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // 3. Load property and guest
    const property = await propertyRepo.findById(reservation.propertyId)
    const guest = await guestRepo.findById(reservation.guestId)
    
    if (!property || !guest) {
      return NextResponse.json(
        { error: 'Property or guest not found' },
        { status: 404 }
      )
    }

    // 4. Execute use case
    const confirmReservation = new ConfirmReservation()
    const result = await confirmReservation.execute({
      reservation,
      property,
      guest
    })

    // 5. Save changes
    await reservationRepo.save(result.reservation)

    // 6. Publish event
    await eventBus.publish(result.event)

    // 7. Return response
    return NextResponse.json({
      success: true,
      reservation: result.reservation.toJSON(),
      confirmationCode: result.confirmationCode
    })

  } catch (error: any) {
    logger.error('Confirm reservation error:', error)

    if (error.message.includes('Only pending')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.message.includes('payment')) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 } // Payment required
      )
    }

    return NextResponse.json(
      { error: 'Failed to confirm reservation' },
      { status: 500 }
    )
  }
}
