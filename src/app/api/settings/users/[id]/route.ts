import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * PUT /api/settings/users/[id]
 * Update user role, status, or permissions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Updates are required' } },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Prevent admin from changing their own role to non-admin
    if (targetUserId === userId && updates.role && updates.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'SELF_ROLE_CHANGE', message: 'Cannot change your own admin role' } },
        { status: 400 }
      );
    }

    // Validate role change
    if (updates.role) {
      const validRoles = ["receptor", "director", "admin"];
      if (!validRoles.includes(updates.role)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role' } },
          { status: 400 }
        );
      }
    }

    // Validate status change
    if (updates.status) {
      const validStatuses = ["active", "inactive", "pending"];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status' } },
          { status: 400 }
        );
      }
    }

    // Update user (in real implementation)
    console.log('Updating user:', targetUserId, updates);

    // Log activity
    await logActivity(userId, "User Updated", `Updated user: ${targetUser.name}`, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: { message: 'User updated successfully' }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/users/[id]
 * Deactivate or delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (targetUserId === userId) {
      return NextResponse.json(
        { success: false, error: { code: 'SELF_DELETE', message: 'Cannot delete your own account' } },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Deactivate user (in real implementation)
    console.log('Deactivating user:', targetUserId);

    // Log activity
    await logActivity(userId, "User Deactivated", `Deactivated user: ${targetUser.name}`, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: { message: 'User deactivated successfully' }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
