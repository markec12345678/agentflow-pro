import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, createErrorResponse, createSuccessResponse } from '@/lib/api-middleware';
import { prisma } from '@/database/schema';
import { z } from 'zod';

export const dynamic = "force-dynamic";

// Zod schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
});

/**
 * GET /api/user/profile
 * Get user profile (Bearer token auth, for Public API)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = validateAuth(request);
    const userId = auth.userId;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: userId }],
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse({ message: 'User not found', status: 404 }, 'User not found'),
        { status: 404 }
      );
    }

    const onboarding = await prisma.onboarding.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { industry: true, workspaceName: true, role: true },
    });

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      onboarding: onboarding ?? null,
    };

    return NextResponse.json(createSuccessResponse(profile));
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(error, 'Failed to get user profile'),
      { status: (error as any).status || 500 }
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

    // Validate input with Zod
    const validatedData = updateProfileSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: auth.userId }, { email: auth.userId }],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse({ message: 'User not found', status: 404 }, 'User not found'),
        { status: 404 }
      );
    }

    const updateData: { name?: string } = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        createErrorResponse({ message: 'No valid fields to update', status: 400 }, 'No valid fields'),
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(createSuccessResponse(updated, 'Profile updated successfully'));
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(error, 'Failed to update profile'),
      { status: (error as any).status || 500 }
    );
  }
}
