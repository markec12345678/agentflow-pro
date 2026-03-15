/**
 * API Route: Create Reservation
 * 
 * POST /api/tourism/reservations
 * 
 * Ustvari novo rezervacijo z uporabo CreateReservation use case-a.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CreateReservation } from '@/core/use-cases/create-reservation'
import { PropertyRepositoryImpl } from '@/infrastructure/database/repositories/property-repository'
import { GuestRepositoryImpl } from '@/infrastructure/database/repositories/guest-repository'
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories/reservation-repository'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// ============================================================================
// Request/Response Types
// ============================================================================

interface CreateReservationRequest {
  propertyId: string
  guestId: string
  checkIn: string // ISO date
  checkOut: string // ISO date
  guests: number
  notes?: string
  specialRequests?: string[]
}

interface CreateReservationResponse {
  success: true
  reservation: any
  confirmationCode: string
  totalPrice: {
    amount: number
    currency: string
  }
  amountDue: {
    amount: number
    currency: string
  }
  message: string
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateReservationResponse | { error: string }>> {
  try {
    // 1. Parse request body
    const body: CreateReservationRequest = await request.json()
    
    // 2. Validate required fields
    if (!body.propertyId || !body.guestId || !body.checkIn || !body.checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, guestId, checkIn, checkOut' },
        { status: 400 }
      )
    }

    // 3. Initialize repositories
    const propertyRepo = new PropertyRepositoryImpl()
    const guestRepo = new GuestRepositoryImpl()
    const reservationRepo = new ReservationRepositoryImpl()

    // 4. Load property
    const property = await propertyRepo.findById(body.propertyId)
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // 5. Load guest
    const guest = await guestRepo.findById(body.guestId)
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // 6. Execute use case
    const createReservation = new CreateReservation()
    const result = await createReservation.execute({
      property,
      propertyId: body.propertyId,
      guest,
      guestId: body.guestId,
      checkIn: new Date(body.checkIn),
      checkOut: new Date(body.checkOut),
      guests: body.guests,
      notes: body.notes,
      specialRequests: body.specialRequests
    })

    // 7. Save reservation
    await reservationRepo.save(result.reservation)

    // 8. Update guest with special requests
    if (body.specialRequests) {
      body.specialRequests.forEach(request => {
        guest.addSpecialRequest(request)
      })
      await guestRepo.save(guest)
    }

    // 9. Publish event (handled by use case internally)
    // Event will trigger: confirmation email, calendar update, manager notification

    // 10. Return response
    return NextResponse.json({
      success: true,
      reservation: result.reservation.toJSON(),
      confirmationCode: result.confirmationCode,
      totalPrice: result.totalPrice.toJSON(),
      amountDue: result.amountDue.toJSON(),
      message: 'Rezervacija je bila uspešno ustvarjena. Potrditveni email je bil poslan.'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create reservation error:', error)

    // Handle specific errors
    if (error.message.includes('not available')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict - property not available
      )
    }

    if (error.message.includes('must be before') || 
        error.message.includes('cannot be in the past') ||
        error.message.includes('Minimum stay') ||
        error.message.includes('Maximum stay')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET Handler (List reservations)
// ============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ reservations: any[] } | { error: string }>> {
  try {
    const reservationRepo = new ReservationRepositoryImpl()
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const guestId = searchParams.get('guestId')
    const status = searchParams.get('status')
    
    // Build filters
    const filters: any = {}
    if (propertyId) filters.propertyId = propertyId
    if (guestId) filters.guestId = guestId
    if (status) filters.status = status
    
    // Fetch reservations
    const reservations = await reservationRepo.find(filters)
    
    return NextResponse.json({
      reservations: reservations.map(r => r.toJSON())
    })

  } catch (error: any) {
    console.error('Get reservations error:', error)
    return NextResponse.json(
      { error: 'Failed to get reservations' },
      { status: 500 }
    )
  }
}
