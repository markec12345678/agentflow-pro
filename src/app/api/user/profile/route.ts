import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, createErrorResponse, createSuccessResponse } from '@/lib/api-middleware';

export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile
 * Get user profile with usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = validateAuth(request);

    // TODO: Implement user profile retrieval
    const profile = {
      id: auth.userId,
      email: auth.email,
      role: auth.role,
      // Add more user data as needed
    };

    return NextResponse.json(createSuccessResponse(profile));
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(error, 'Failed to get user profile'),
      { status: error.status || 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = validateAuth(request);
    const body = await request.json();

    // TODO: Implement profile update
    const updatedProfile = {
      id: auth.userId,
      ...body,
    };

    return NextResponse.json(createSuccessResponse(updatedProfile, 'Profile updated successfully'));
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(error, 'Failed to update profile'),
      { status: error.status || 500 }
    );
  }
}
