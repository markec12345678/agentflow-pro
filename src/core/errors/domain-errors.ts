/**
 * Domain Errors
 * 
 * Standardizirani errorji za domain layer.
 */

// ============================================================================
// Base Domain Error
// ============================================================================

export abstract class DomainError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly metadata?: Record<string, any>

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.statusCode = statusCode
    this.metadata = metadata

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON(): { code: string; message: string; statusCode: number; metadata?: any } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata
    }
  }
}

// ============================================================================
// Not Found Error (404)
// ============================================================================

export class NotFoundError extends DomainError {
  constructor(
    entity: string,
    id: string,
    metadata?: Record<string, any>
  ) {
    super(
      'NOT_FOUND',
      `${entity} with ID ${id} not found`,
      404,
      { entity, id, ...metadata }
    )
    this.name = 'NotFoundError'
  }
}

// ============================================================================
// Validation Error (400)
// ============================================================================

export class ValidationError extends DomainError {
  public readonly field?: string
  public readonly value?: any

  constructor(
    message: string,
    field?: string,
    value?: any
  ) {
    super(
      'VALIDATION_ERROR',
      message,
      400,
      { field, value }
    )
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

// ============================================================================
// Business Rule Error (409)
// ============================================================================

export class BusinessRuleError extends DomainError {
  constructor(
    message: string,
    metadata?: Record<string, any>
  ) {
    super(
      'BUSINESS_RULE_VIOLATION',
      message,
      409,
      metadata
    )
    this.name = 'BusinessRuleError'
  }
}

// ============================================================================
// Payment Error (402)
// ============================================================================

export class PaymentError extends DomainError {
  constructor(
    message: string,
    metadata?: Record<string, any>
  ) {
    super(
      'PAYMENT_ERROR',
      message,
      402,
      metadata
    )
    this.name = 'PaymentError'
  }
}

// ============================================================================
// Unauthorized Error (401)
// ============================================================================

export class UnauthorizedError extends DomainError {
  constructor(
    message: string = 'Unauthorized',
    metadata?: Record<string, any>
  ) {
    super(
      'UNAUTHORIZED',
      message,
      401,
      metadata
    )
    this.name = 'UnauthorizedError'
  }
}

// ============================================================================
// Forbidden Error (403)
// ============================================================================

export class ForbiddenError extends DomainError {
  constructor(
    message: string = 'Forbidden',
    metadata?: Record<string, any>
  ) {
    super(
      'FORBIDDEN',
      message,
      403,
      metadata
    )
    this.name = 'ForbiddenError'
  }
}

// ============================================================================
// Conflict Error (409)
// ============================================================================

export class ConflictError extends DomainError {
  constructor(
    message: string,
    metadata?: Record<string, any>
  ) {
    super(
      'CONFLICT',
      message,
      409,
      metadata
    )
    this.name = 'ConflictError'
  }
}

// ============================================================================
// Internal Server Error (500)
// ============================================================================

export class InternalError extends DomainError {
  constructor(
    message: string = 'Internal server error',
    metadata?: Record<string, any>
  ) {
    super(
      'INTERNAL_ERROR',
      message,
      500,
      metadata
    )
    this.name = 'InternalError'
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDomainError(error: any): error is DomainError {
  return error instanceof DomainError
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError
}

export function isBusinessRuleError(error: any): error is BusinessRuleError {
  return error instanceof BusinessRuleError
}

export function isPaymentError(error: any): error is PaymentError {
  return error instanceof PaymentError
}
