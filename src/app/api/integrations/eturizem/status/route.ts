import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/eturizem/status
 * Get eTurizem sync status
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

    // Get user's eTurizem configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        eturizemConfig: true
      }
    });

    const config = user?.eturizemConfig as any;
    
    // Get properties sync status
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        eturizemId: true,
        eturizemSyncStatus: true,
        eturizemSyncedAt: true,
        eturizemLastError: true
      }
    });

    const totalProperties = properties.length;
    const syncedProperties = properties.filter(p => p.eturizemSyncStatus === "success").length;
    const failedProperties = properties.filter(p => p.eturizemSyncStatus === "error").length;
    const pendingProperties = properties.filter(p => !p.eturizemSyncStatus || p.eturizemSyncStatus === "pending").length;

    // Calculate next sync time
    let nextSyncTime = null;
    if (config?.autoSyncEnabled && config?.syncInterval) {
      const lastSync = properties
        .filter(p => p.eturizemSyncedAt)
        .map(p => new Date(p.eturizemSyncedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      
      if (lastSync) {
        nextSyncTime = new Date(lastSync.getTime() + config.syncInterval * 60 * 60 * 1000).toISOString();
      }
    }

    // Determine overall status
    let status: "success" | "error" | "pending" | "disabled" = "disabled";
    if (!config?.apiKey) {
      status = "disabled";
    } else if (failedProperties > 0) {
      status = "error";
    } else if (pendingProperties > 0) {
      status = "pending";
    } else if (syncedProperties > 0) {
      status = "success";
    }

    const lastSyncTime = properties
      .filter(p => p.eturizemSyncedAt)
      .map(p => p.eturizemSyncedAt!)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return NextResponse.json({
      success: true,
      data: {
        status,
        lastSyncTime,
        nextSyncTime,
        totalProperties,
        syncedProperties,
        failedProperties,
        pendingProperties,
        configured: !!config?.apiKey,
        autoSyncEnabled: config?.autoSyncEnabled || false,
        syncInterval: config?.syncInterval || 4
      }
    });

  } catch (error) {
    logger.error('Get eTurizem status error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
