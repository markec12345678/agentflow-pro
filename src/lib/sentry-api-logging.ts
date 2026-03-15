/**
 * Sentry API Logging Utility
 * Placeholder for production error tracking
 */

export function withSentryLogging<T extends (...args: any[]) => any>(fn: T): T {
  // In production, this would wrap with Sentry error handling
  // For now, just pass through
  return fn;
}

export function logApiError(error: Error, context?: any): void {
  logger.error('API Error:', error.message, context);
}

export type ApiOperations = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
