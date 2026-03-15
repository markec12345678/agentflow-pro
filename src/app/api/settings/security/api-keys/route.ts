import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * GET /api/settings/security/api-keys
 * Get all API keys
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get API keys (in real implementation, this would fetch from database)
    const mockAPIKeys: APIKey[] = [
      {
        id: "1",
        name: "Production API Key",
        key: "sk_live_1234567890abcdef",
        permissions: ["read", "write"],
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: "2",
        name: "Test API Key",
        key: "sk_test_abcdef1234567890",
        permissions: ["read"],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: "3",
        name: "Analytics API Key",
        key: "sk_analytics_fedcba0987654321",
        permissions: ["read"],
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: "4",
        name: "Deprecated API Key",
        key: "sk_old_1357924680abcdef",
        permissions: ["read", "write"],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: false
      }
    ];

    return NextResponse.json({
      success: true,
      data: { apiKeys: mockAPIKeys }
    });

  } catch (error) {
    logger.error('Get API keys error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/security/api-keys
 * Generate new API key
 */
export async function POST(request: NextRequest) {
  try {
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
    const { name, permissions, expiresAt } = body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Name and permissions are required' } },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = ["read", "write", "delete", "admin"];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PERMISSIONS', message: 'Invalid permissions', details: invalidPermissions } },
        { status: 400 }
      );
    }

    // Generate API key
    const key = generateAPIKey();

    // Create API key (in real implementation)
    const newAPIKey: APIKey = {
      id: `key_${Date.now()}`,
      name,
      key,
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
      isActive: true
    };

    logger.info('Generated new API key:', { id: newAPIKey.id, name, permissions });

    // Log activity
    await logActivity(userId, "API Key Generated", `Generated API key: ${name}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'API key generated successfully',
        apiKey: newAPIKey
      }
    });

  } catch (error) {
    logger.error('Generate API key error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function generateAPIKey(): string {
  // Generate secure API key (in real implementation, use crypto module)
  const prefix = "sk_";
  const environment = Math.random() > 0.5 ? "live" : "test";
  const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${prefix}${environment}_${randomPart}`;
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
