/**
 * API Route: Check Availability
 * 
 * GET /api/tourism/availability
 * POST /api/tourism/availability
 * 
 * Preveri razpoložljivost sobe za določene datume.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CheckAvailability } from '@/core/use-cases/check-availability'
import { handleApiError, withRequestLogging } from '@/app/api/middleware'

// ============================================================================
// Request/Response Types
// ============================================================================

interface AvailabilityRequest {
  roomId: string
  checkIn: string // ISO date
  checkOut: string // ISO date
  guests: number
}

interface AvailabilityResponse {
  available: boolean
  dateRange: {
    start: string
    end: string
  }
  nightlyRates: Array<{
    date: string
    rate: number
    status: string
  }>
  totalPrice: number
  minStay: number
  maxStay: number
  restrictions: {
    closedToArrival: boolean
    closedToDeparture: boolean
  }
  message?: string
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<AvailabilityResponse | { error: string }>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        
        const roomId = searchParams.get('roomId')
        const checkIn = searchParams.get('checkIn')
        const checkOut = searchParams.get('checkOut')
        const guests = searchParams.get('guests')

        // Validate required params
        if (!roomId || !checkIn || !checkOut || !guests) {
          return NextResponse.json(
            { error: 'Missing required parameters: roomId, checkIn, checkOut, guests' },
            { status: 400 }
          )
        }

        // TODO: Initialize availability repository
        // const availabilityRepo = new AvailabilityRepositoryImpl()
        // const checkAvailability = new CheckAvailability(availabilityRepo)

        // TODO: Execute use case
        // const result = await checkAvailability.execute({
        //   roomId,
        //   checkIn: new Date(checkIn),
        //   checkOut: new Date(checkOut),
        //   guests: parseInt(guests)
        // })

        // Mock response for now
        const mockResponse: AvailabilityResponse = {
          available: true,
          dateRange: {
            start: checkIn,
            end: checkOut
          },
          nightlyRates: [
            { date: checkIn, rate: 100, status: 'available' },
            { date: checkOut, rate: 100, status: 'available' }
          ],
          totalPrice: 200,
          minStay: 2,
          maxStay: 30,
          restrictions: {
            closedToArrival: false,
            closedToDeparture: false
          },
          message: 'Soba je na voljo'
        }

        return NextResponse.json(mockResponse)
      } catch (error) {
        return handleApiError(error, {
          route: '/api/tourism/availability',
          method: 'GET'
        })
      }
    },
    '/api/tourism/availability'
  )
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<AvailabilityResponse | { error: string }>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        const body: AvailabilityRequest = await request.json()

        // Validate body
        if (!body.roomId || !body.checkIn || !body.checkOut || !body.guests) {
          return NextResponse.json(
            { error: 'Missing required fields: roomId, checkIn, checkOut, guests' },
            { status: 400 }
          )
        }

        // TODO: Initialize availability repository
        // const availabilityRepo = new AvailabilityRepositoryImpl()
        // const checkAvailability = new CheckAvailability(availabilityRepo)

        // TODO: Execute use case
        // const result = await checkAvailability.execute({
        //   roomId: body.roomId,
        //   checkIn: new Date(body.checkIn),
        //   checkOut: new Date(body.checkOut),
        //   guests: body.guests
        // })

        // Mock response for now
        const mockResponse: AvailabilityResponse = {
          available: true,
          dateRange: {
            start: body.checkIn,
            end: body.checkOut
          },
          nightlyRates: [
            { date: body.checkIn, rate: 100, status: 'available' }
          ],
          totalPrice: 100,
          minStay: 2,
          maxStay: 30,
          restrictions: {
            closedToArrival: false,
            closedToDeparture: false
          },
          message: 'Soba je na voljo'
        }

        return NextResponse.json(mockResponse)
      } catch (error) {
        return handleApiError(error, {
          route: '/api/tourism/availability',
          method: 'POST'
        })
      }
    },
    '/api/tourism/availability'
  )
}
