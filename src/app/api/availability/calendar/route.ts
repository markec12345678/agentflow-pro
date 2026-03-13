/**
 * API Route: Availability Calendar
 * 
 * GET    /api/availability/calendar - Get availability calendar
 * POST   /api/availability/block - Block dates
 * DELETE /api/availability/block/[id] - Unblock dates
 * PUT    /api/availability/block/[id]/extend - Extend block
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getUserId } from '@/lib/auth-users'
import { BlockDates } from '@/core/use-cases/block-dates'
import { CheckAvailability } from '@/core/use-cases/check-availability'
import { handleApiError, withRequestLogging } from '@/app/api/middleware'

/**
 * GET /api/availability/calendar
 * Get availability calendar for property
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
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const roomId = searchParams.get('roomId')
        const type = searchParams.get('type')

        // Validate required params
        if (!propertyId || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required parameters: propertyId, startDate, endDate' },
            { status: 400 }
          )
        }

        // Parse dates
        const start = new Date(startDate)
        const end = new Date(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          )
        }

        // Get blocked dates
        const useCase = new BlockDates({} as any) // TODO: Inject real repository
        
        const result = await useCase.getBlockedDates({
          propertyId,
          roomId: roomId || undefined,
          startDate: start,
          endDate: end,
          type: type || undefined
        })

        return NextResponse.json({
          success: true,
          data: result
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/availability/calendar',
          method: 'GET'
        })
      }
    },
    '/api/availability/calendar'
  )
}

/**
 * POST /api/availability/block
 * Block dates for room or property
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
          propertyId,
          roomId,
          roomTypeId,
          startDate,
          endDate,
          type,
          reason,
          notes,
          recurring
        } = body

        // Validate required fields
        if (!propertyId || !startDate || !endDate || !type) {
          return NextResponse.json(
            { error: 'Missing required fields: propertyId, startDate, endDate, type' },
            { status: 400 }
          )
        }

        // Execute use case
        const useCase = new BlockDates({} as any) // TODO: Inject real repository
        
        const result = await useCase.execute({
          propertyId,
          roomId,
          roomTypeId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type,
          reason,
          notes,
          userId,
          recurring
        })

        if (result.success) {
          return NextResponse.json({
            success: true,
            data: result
          }, { status: 201 })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Conflicts found',
            conflicts: result.conflicts
          }, { status: 409 })
        }
      } catch (error) {
        return handleApiError(error, {
          route: '/api/availability/block',
          method: 'POST'
        })
      }
    },
    '/api/availability/block'
  )
}

/**
 * DELETE /api/availability/block/[id]
 * Unblock dates
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params

        // Execute use case
        const useCase = new BlockDates({} as any) // TODO: Inject real repository
        
        await useCase.unblock({
          blockId: id,
          userId
        })

        return NextResponse.json({
          success: true,
          message: 'Block removed successfully'
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/availability/block',
          method: 'DELETE'
        })
      }
    },
    '/api/availability/block'
  )
}

/**
 * PUT /api/availability/block/[id]/extend
 * Extend existing block
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params
        const body = await request.json()
        const { days } = body

        if (!days || days <= 0) {
          return NextResponse.json(
            { error: 'Invalid days parameter' },
            { status: 400 }
          )
        }

        // Execute use case
        const useCase = new BlockDates({} as any) // TODO: Inject real repository
        
        await useCase.extendBlock(id, days)

        return NextResponse.json({
          success: true,
          message: 'Block extended successfully'
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/availability/block',
          method: 'PUT'
        })
      }
    },
    '/api/availability/block'
  )
}
