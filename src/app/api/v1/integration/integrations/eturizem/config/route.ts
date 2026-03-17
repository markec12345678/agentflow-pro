import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface EturizemConfig {
  apiKey: string;
  baseUrl: string;
  autoSyncEnabled: boolean;
  syncInterval: number;
  retryAttempts: number;
  timeout: number;
}

/**
 * GET /api/integrations/eturizem/config
 * Get eTurizem configuration
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        eturizemConfig: true
      }
    });

    const defaultConfig: EturizemConfig = {
      apiKey: "",
      baseUrl: "https://api.eturizem.si",
      autoSyncEnabled: true,
      syncInterval: 4,
      retryAttempts: 3,
      timeout: 30
    };

    const config: EturizemConfig = (user?.eturizemConfig as any) || defaultConfig;

    // Hide API key in response for security
    const safeConfig = {
      ...config,
      apiKey: config.apiKey ? "•••••••••••••••" : ""
    };

    return NextResponse.json({
      success: true,
      data: { config: safeConfig }
    });

  } catch (error) {
    logger.error('Get eTurizem config error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/eturizem/config
 * Update eTurizem configuration
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
    const { config } = body;

    // Validate configuration
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid configuration data' } },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!config.baseUrl || typeof config.baseUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BASE_URL', message: 'Invalid base URL' } },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(config.baseUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BASE_URL', message: 'Invalid URL format' } },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (config.syncInterval !== undefined && (config.syncInterval < 1 || config.syncInterval > 24)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INTERVAL', message: 'Sync interval must be between 1 and 24 hours' } },
        { status: 400 }
      );
    }

    if (config.retryAttempts !== undefined && (config.retryAttempts < 1 || config.retryAttempts > 10)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RETRIES', message: 'Retry attempts must be between 1 and 10' } },
        { status: 400 }
      );
    }

    if (config.timeout !== undefined && (config.timeout < 5 || config.timeout > 300)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TIMEOUT', message: 'Timeout must be between 5 and 300 seconds' } },
        { status: 400 }
      );
    }

    // Get current config to preserve API key if not provided
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { eturizemConfig: true }
    });

    const currentConfig: EturizemConfig = (currentUser?.eturizemConfig as any) || {};
    
    // Merge with existing config, preserving API key if not provided
    const updatedConfig: EturizemConfig = {
      apiKey: config.apiKey || currentConfig.apiKey || "",
      baseUrl: config.baseUrl || currentConfig.baseUrl || "https://api.eturizem.si",
      autoSyncEnabled: config.autoSyncEnabled !== undefined ? config.autoSyncEnabled : currentConfig.autoSyncEnabled ?? true,
      syncInterval: config.syncInterval || currentConfig.syncInterval || 4,
      retryAttempts: config.retryAttempts || currentConfig.retryAttempts || 3,
      timeout: config.timeout || currentConfig.timeout || 30
    };

    // Update user configuration
    await prisma.user.update({
      where: { id: userId },
      data: {
        eturizemConfig: updatedConfig as any
      }
    });

    // Return safe config (hide API key)
    const safeConfig = {
      ...updatedConfig,
      apiKey: updatedConfig.apiKey ? "•••••••••••••••" : ""
    };

    return NextResponse.json({
      success: true,
      data: { config: safeConfig }
    });

  } catch (error) {
    logger.error('Update eTurizem config error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
