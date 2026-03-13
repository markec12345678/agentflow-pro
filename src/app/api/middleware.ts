/**
 * API Middleware
 * 
 * Global error handling in logging za API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  logApiRequest, 
  logUnknownError, 
  logDomainError 
} from '@/infrastructure/observability/logger'
import { DomainError } from '@/core/errors/domain-errors'

// ============================================================================
// Error Handler
// ============================================================================

export function handleApiError(
  error: unknown,
  context: {
    route: string
    method: string
    userId?: string
  }
): NextResponse {
  // Logiraj error
  if (error instanceof DomainError) {
    logDomainError(error, {
      route: context.route,
      method: context.method,
      userId: context.userId
    })

    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        ...(error.metadata && { details: error.metadata })
      },
      { status: error.statusCode }
    )
  }

  // Unknown error
  logUnknownError(error, {
    route: context.route,
    method: context.method,
    userId: context.userId
  })

  return NextResponse.json(
    {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    },
    { status: 500 }
  )
}

// ============================================================================
// Request Logger Middleware
// ============================================================================

export async function withRequestLogging<T>(
  request: NextRequest,
  handler: () => Promise<T>,
  route: string
): Promise<T> {
  const start = Date.now()
  const method = request.method
  const url = request.url

  try {
    const result = await handler()
    
    const duration = Date.now() - start
    
    logApiRequest(method, url, 200, duration, {
      route,
      success: true
    })

    return result
  } catch (error) {
    const duration = Date.now() - start
    
    // Get status code from error
    let statusCode = 500
    if (error instanceof DomainError) {
      statusCode = error.statusCode
    }

    logApiRequest(method, url, statusCode, duration, {
      route,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    throw error
  }
}

// ============================================================================
// Validate Request Body
// ============================================================================

export function validateRequestBody<T extends Record<string, any>>(
  body: unknown,
  schema: {
    parse: (data: unknown) => T
  },
  route: string
): T {
  try {
    return schema.parse(body)
  } catch (error: any) {
    if (error.errors) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Request body validation failed',
        400,
        {
          route,
          errors: error.errors.map((e: any) => ({
            field: e.path?.join('.'),
            message: e.message
          }))
        }
      )
    }
    throw error
  }
}
