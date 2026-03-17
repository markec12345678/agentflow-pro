/**
 * API Route: Alert Rules
 * Refactored to use AlertRuleManagement use case
 * 
 * From: 126 vrstic
 * To: ~70 vrstic (-44%)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getUserId } from '@/lib/auth-users'
import { AlertRuleManagement } from '@/core/use-cases/alert-rule-management'
import { handleApiError, withRequestLogging } from '@/app/api/middleware'

/**
 * GET /api/alerts/rules
 * Get all alert rules
 */
export async function GET(
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

        const { searchParams } = new URL(request.url)
        const enabled = searchParams.get('enabled')
        const severity = searchParams.get('severity')

        const useCase = new AlertRuleManagement({} as any)
        const result = await useCase.getRules({
          userId,
          enabled: enabled === 'true',
          severity: severity || undefined
        })

        return NextResponse.json({ success: true, data: result })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/v1/alerts/rules',
          method: 'GET'
        })
      }
    },
    '/api/v1/alerts/rules'
  )
}

/**
 * POST /api/alerts/rules
 * Create new alert rule
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
          name,
          eventType,
          threshold,
          severity,
          enabled,
          channels,
          cooldownMinutes,
          escalateAfterMinutes,
          escalateTo
        } = body

        const useCase = new AlertRuleManagement({} as any)
        const result = await useCase.create({
          userId,
          name,
          eventType,
          threshold,
          severity,
          enabled,
          channels,
          cooldownMinutes,
          escalateAfterMinutes,
          escalateTo
        })

        return NextResponse.json(result, { status: 201 })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/v1/alerts/rules',
          method: 'POST'
        })
      }
    },
    '/api/v1/alerts/rules'
  )
}
