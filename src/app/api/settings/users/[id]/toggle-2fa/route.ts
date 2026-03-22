import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/users/[id]/toggle-2fa
 * Toggle 2FA for a user
 */
export async function POST(
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
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Enabled field must be boolean' } },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, twoFactorEnabled: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Prevent admin from disabling their own 2FA
    if (targetUserId === userId && !enabled) {
      return NextResponse.json(
        { success: false, error: { code: 'SELF_2FA_DISABLE', message: 'Cannot disable your own 2FA' } },
        { status: 400 }
      );
    }

    // Update 2FA status (in real implementation)
    console.log(`${enabled ? 'Enabling' : 'Disabling'} 2FA for user:`, targetUserId);

    // If enabling 2FA, generate setup link (in real implementation)
    let setupLink = null;
    if (enabled) {
      setupLink = generate2FASetupLink(targetUser.email);
      console.log('2FA setup link for', targetUser.email, ':', setupLink);
    }

    // Log activity
    await logActivity(userId, "2FA Changed", `${enabled ? 'Enabled' : 'Disabled'} 2FA for: ${targetUser.name}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully`,
        setupLink
      }
    });

  } catch (error) {
    console.error('Toggle 2FA error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function generate2FASetupLink(email: string): string {
  // Generate 2FA setup link (in real implementation, use TOTP library)
  return `${process.env.NEXTAUTH_URL}/setup-2fa?email=${encodeURIComponent(email)}&token=${Math.random().toString(36).substring(2, 15)}`;
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
