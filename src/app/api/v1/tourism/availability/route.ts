/**
 * API Route: Check Availability
 * 
 * GET  /api/availability - Check availability for dates
 * POST /api/availability/block - Block dates
 * PUT  /api/availability/update - Update availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getUserId } from '@/lib/auth-users'
import { CheckAvailability } from '@/core/use-cases/check-availability'
import { AllocateRoom } from '@/core/use-cases/allocate-room'
import { handleApiError, withRequestLogging } from '@/app/api/middleware'

/**
 * GET /api/availability
 * Check availability for property
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        
        const propertyId = searchParams.get('propertyId')
        const checkIn = searchParams.get('checkIn')
        const checkOut = searchParams.get('checkOut')
        const guests = searchParams.get('guests')
        const roomType = searchParams.get('roomType')

        // Validate required params
        if (!propertyId || !checkIn || !checkOut) {
          return NextResponse.json(
            { error: 'Missing required parameters: propertyId, checkIn, checkOut' },
            { status: 400 }
          )
        }

        // Parse dates
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          )
        }

        // Execute use case
        const useCase = new CheckAvailability(
          {} as any, // TODO: Inject real repositories
          {} as any,
          {} as any
        )

        const result = await useCase.execute({
          propertyId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: guests ? parseInt(guests) : undefined,
          roomType: roomType || undefined
        })

        return NextResponse.json({
          success: true,
          data: result
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/availability',
          method: 'GET'
        })
      }
    },
    '/api/availability'
  )
}

/**
 * POST /api/availability/allocate
 * Allocate room for reservation
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        const session = await getServerSession(authOptions)
        const userId = getUserId(session)
        
        if (!userId) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        const body = await request.json()
        const {
          reservationId,
          propertyId,
          checkIn,
          checkOut,
          guests,
          preferences,
          upgradeAllowed
        } = body

        // Validate required fields
        if (!reservationId || !propertyId || !checkIn || !checkOut || !guests) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          )
        }

        // Execute use case
        const useCase = new AllocateRoom(
          {} as any, // TODO: Inject real repositories
          {} as any,
          {} as any
        )

        const result = await useCase.execute({
          reservationId,
          propertyId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests: parseInt(guests),
          preferences,
          upgradeAllowed: upgradeAllowed ?? true
        })

        return NextResponse.json({
          success: true,
          data: result
        }, { status: 201 })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/v1/tourism/availability/allocate',
          method: 'POST'
        })
      }
    },
    '/api/v1/tourism/availability/allocate'
  )
}
