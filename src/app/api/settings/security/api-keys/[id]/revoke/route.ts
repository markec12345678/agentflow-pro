import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/security/api-keys/[id]/revoke
 * Revoke an API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const keyId = resolvedParams.id;
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

    // Get API key details (in real implementation)
    const mockAPIKey = {
      id: keyId,
      name: "Production API Key",
      key: "sk_live_1234567890abcdef",
      permissions: ["read", "write"],
      isActive: true
    };

    if (!mockAPIKey) {
      return NextResponse.json(
        { success: false, error: { code: 'KEY_NOT_FOUND', message: 'API key not found' } },
        { status: 404 }
      );
    }

    if (!mockAPIKey.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'KEY_ALREADY_REVOKED', message: 'API key is already revoked' } },
        { status: 400 }
      );
    }

    // Revoke API key (in real implementation)
    console.log('Revoked API key:', keyId);

    // Log activity
    await logActivity(userId, "API Key Revoked", `Revoked API key: ${mockAPIKey.name}`, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'API key revoked successfully',
        keyId,
        revokedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Revoke API key error:', error);
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
