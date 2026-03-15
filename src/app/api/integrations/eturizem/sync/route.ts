import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/eturizem/sync
 * Trigger manual sync with eTurizem
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

    const body = await request.json();
    const { type = "manual", propertyIds } = body;

    // Get user's eTurizem configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        eturizemConfig: true
      }
    });

    if (!user?.eturizemConfig) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CONFIG', message: 'eTurizem not configured' } },
        { status: 400 }
      );
    }

    const config = user.eturizemConfig as any;
    
    // Validate API key
    if (!config.apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_API_KEY', message: 'API key not configured' } },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let syncResult = {
      totalProperties: 0,
      syncedProperties: 0,
      failedProperties: 0,
      errors: [] as string[]
    };

    try {
      // Get properties to sync
      const properties = await prisma.property.findMany({
        where: propertyIds ? { id: { in: propertyIds } } : {},
        include: {
          reservations: true,
          rooms: true
        }
      });

      syncResult.totalProperties = properties.length;

      // Simulate sync process (in real implementation, this would call eTurizem API)
      for (const property of properties) {
        try {
          // Mock API call to eTurizem
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Simulate some failures for testing
          if (Math.random() < 0.2) {
            throw new Error("API rate limit exceeded");
          }

          // Update property sync status
          await prisma.property.update({
            where: { id: property.id },
            data: {
              eturizemSyncedAt: new Date(),
              eturizemSyncStatus: "success"
            }
          });

          syncResult.syncedProperties++;
        } catch (error) {
          syncResult.failedProperties++;
          syncResult.errors.push(`${property.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Update property error status
          await prisma.property.update({
            where: { id: property.id },
            data: {
              eturizemSyncStatus: "error",
              eturizemLastError: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }

      // Log sync result
      const duration = Date.now() - startTime;
      
      // Store sync log (in real implementation, this would be stored in database)
      logger.info(`eTurizem sync completed:`, {
        type,
        duration,
        ...syncResult
      });

      return NextResponse.json({
        success: true,
        data: {
          syncId: `sync_${Date.now()}`,
          type,
          status: syncResult.failedProperties > 0 ? "partial" : "success",
          duration: Math.floor(duration / 1000),
          ...syncResult
        }
      });

    } catch (error) {
      logger.error('eTurizem sync error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'SYNC_ERROR', 
            message: error instanceof Error ? error.message : 'Sync failed' 
          } 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Manual sync error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
