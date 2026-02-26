import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';

export const dynamic = "force-dynamic";

/**
 * Middleware to validate authentication
 */
export function validateAuth(request: NextRequest): { userId: string; email: string; role: string } {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    const error = new Error('Authorization token is required');
    (error as any).code = 'TOKEN_REQUIRED';
    (error as any).status = 401;
    throw error;
  }

  try {
    return AuthService.validateSession(token);
  } catch (error) {
    const authError = error as Error;
    (authError as any).code = 'INVALID_TOKEN';
    (authError as any).status = 401;
    throw authError;
  }
}

/**
 * Middleware to check permissions
 */
export function checkPermission(
  request: NextRequest,
  resource: string,
  action: string,
  scope: 'own' | 'team' | 'global' = 'own'
): { userId: string; email: string; role: string } {
  const auth = validateAuth(request);
  
  // TODO: Implement permission checking with user data
  // For now, just return auth data
  
  return auth;
}

/**
 * Error response helper
 */
export function createErrorResponse(error: any, defaultMessage: string, defaultStatus: number = 500) {
  console.error('API Error:', error);

  const status = error.status || defaultStatus;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || defaultMessage;

  return {
    success: false,
    error: {
      code,
      message,
      field: error.field,
    },
  };
}

/**
 * Success response helper
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message,
  };
}
