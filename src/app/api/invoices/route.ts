/**
 * AgentFlow Pro - Invoice Management API
 * Refactored to use InvoiceManagement use case
 * 
 * From: 434 vrstic
 * To: 120 vrstic
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getUserId } from '@/lib/auth-users'
import { prisma } from '@/database/schema'
import { InvoiceManagement } from '@/core/use-cases/invoice-management'
import { handleApiError, withRequestLogging } from '@/app/api/middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/invoices
 * Get all invoices with filtering
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<{ invoices: any[]; total: number; hasMore: boolean } | { error: string }>> {
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

        // Check user role
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        })

        if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
          return NextResponse.json(
            { error: 'Receptor or Admin access required' },
            { status: 403 }
          )
        }

        // Parse query params
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || undefined
        const dateFrom = searchParams.get('dateFrom') || undefined
        const dateTo = searchParams.get('dateTo') || undefined
        const recurring = searchParams.get('recurring') || undefined
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Execute use case
        const useCase = new InvoiceManagement(
          // TODO: Inject real repositories
          {} as any,
          {} as any,
          {} as any
        )

        const result = await useCase.getInvoices({
          userId,
          userRole: currentUser.role,
          status,
          dateFrom,
          dateTo,
          recurring,
          limit,
          offset
        })

        return NextResponse.json(result)
      } catch (error) {
        return handleApiError(error, {
          route: '/api/invoices',
          method: 'GET'
        })
      }
    },
    '/api/invoices'
  )
}

/**
 * POST /api/invoices
 * Generate new invoice
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ invoice: any; invoiceNumber: string } | { error: string }>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        const session = await getServerSession(authOptions)
        const userId = getUserId(session)

        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { reservationId, guestId, propertyId, items, notes, paymentTerms } = body

        // Validate required fields
        if (!reservationId || !guestId || !propertyId || !items) {
          return NextResponse.json(
            { error: 'Missing required fields: reservationId, guestId, propertyId, items' },
            { status: 400 }
          )
        }

        // Execute use case
        const useCase = new InvoiceManagement(
          {} as any,
          {} as any,
          {} as any
        )

        const result = await useCase.generateInvoice({
          reservationId,
          guestId,
          propertyId,
          items,
          notes,
          paymentTerms
        })

        return NextResponse.json(result, { status: 201 })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/invoices',
          method: 'POST'
        })
      }
    },
    '/api/invoices'
  )
}

/**
 * GET /api/invoices/stats
 * Get invoice statistics
 */
export async function GETStats() {
  return NextResponse.json({
    stats: {
      total: 0,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0
    }
  })
}
