/**
 * Logger Infrastructure
 * 
 * Structured logging s Pino.
 */

import pino from 'pino'
import { DomainError } from '@/core/errors/domain-errors'

// ============================================================================
// Logger Configuration
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Pretty print v developmentu
  transport: isDevelopment && !isTest
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,

  // Base fields za vse log-e
  base: {
    service: 'agentflow-pro',
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  },

  // Custom serializers
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Logiraj domain error
 */
export function logDomainError(
  error: DomainError,
  context?: Record<string, any>
): void {
  const logLevel = error.statusCode >= 500 ? 'error' : 'warn'

  logger[logLevel]({
    err: error,
    code: error.code,
    statusCode: error.statusCode,
    metadata: error.metadata,
    ...context
  }, `Domain Error: ${error.message}`)
}

/**
 * Logiraj unknown error
 */
export function logUnknownError(
  error: unknown,
  context?: Record<string, any>
): void {
  if (error instanceof DomainError) {
    logDomainError(error, context)
  } else if (error instanceof Error) {
    logger.error({
      err: error,
      ...context
    }, `Unexpected Error: ${error.message}`)
  } else {
    logger.error({
      error: String(error),
      ...context
    }, 'Unknown error occurred')
  }
}

/**
 * Logiraj API request
 */
export function logApiRequest(
  method: string,
  url: string,
  statusCode: number,
  durationMs: number,
  additional?: Record<string, any>
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

  logger[level]({
    type: 'api_request',
    method,
    url,
    statusCode,
    durationMs,
    ...additional
  }, `${method} ${url} ${statusCode}`)
}

/**
 * Logiraj use case execution
 */
export function logUseCase(
  useCaseName: string,
  durationMs: number,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const level = success ? 'debug' : 'error'

  logger[level]({
    type: 'use_case',
    useCaseName,
    durationMs,
    success,
    ...metadata
  }, `Use Case: ${useCaseName}`)
}

/**
 * Logiraj event publishing
 */
export function logEvent(
  eventType: string,
  eventId: string,
  aggregateId: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const level = success ? 'debug' : 'error'

  logger[level]({
    type: 'domain_event',
    eventType,
    eventId,
    aggregateId,
    success,
    ...metadata
  }, `Domain Event: ${eventType}`)
}

// ============================================================================
// Export
// ============================================================================

export type Logger = typeof logger
