import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface IntegrationConfig {
  [key: string]: any;
}

/**
 * GET /api/integrations/config
 * Get all integration configurations
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
        stripeConfig: true,
        sendGridConfig: true,
        sentryConfig: true,
        githubConfig: true,
        vercelConfig: true,
        firecrawlConfig: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Return safe configurations (hide sensitive data)
    const safeConfigs = {
      stripe: user.stripeConfig && typeof user.stripeConfig === 'object' ? {
        apiKey: (user.stripeConfig as any).apiKey ? "•••••••••••••••" : "",
        webhookUrl: (user.stripeConfig as any).webhookUrl || ""
      } : null,
      sendgrid: user.sendGridConfig && typeof user.sendGridConfig === 'object' ? {
        apiKey: (user.sendGridConfig as any).apiKey ? "•••••••••••••••" : "",
        fromEmail: (user.sendGridConfig as any).fromEmail || ""
      } : null,
      sentry: user.sentryConfig && typeof user.sentryConfig === 'object' ? {
        dsn: (user.sentryConfig as any).dsn ? "•••••••••••••••" : "",
        environment: (user.sentryConfig as any).environment || "production"
      } : null,
      github: user.githubConfig && typeof user.githubConfig === 'object' ? {
        token: (user.githubConfig as any).token ? "•••••••••••••••" : "",
        repository: (user.githubConfig as any).repository || ""
      } : null,
      vercel: user.vercelConfig && typeof user.vercelConfig === 'object' ? {
        projectId: (user.vercelConfig as any).projectId || "",
        teamId: (user.vercelConfig as any).teamId || ""
      } : null,
      firecrawl: user.firecrawlConfig && typeof user.firecrawlConfig === 'object' ? {
        apiKey: (user.firecrawlConfig as any).apiKey ? "•••••••••••••••" : "",
        baseUrl: (user.firecrawlConfig as any).baseUrl || "https://api.firecrawl.dev"
      } : null
    };

    return NextResponse.json({
      success: true,
      data: { configs: safeConfigs }
    });

  } catch (error) {
    console.error('Get integration configs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/config
 * Update integration configuration
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
    const { integrationId, config } = body;

    if (!integrationId || !config) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Integration ID and config are required' } },
        { status: 400 }
      );
    }

    // Validate integration ID
    const validIntegrations = ["stripe", "sendgrid", "sentry", "github", "vercel", "firecrawl"];
    if (!validIntegrations.includes(integrationId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INTEGRATION', message: 'Invalid integration ID' } },
        { status: 400 }
      );
    }

    // Get current configuration to preserve sensitive data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeConfig: true,
        sendGridConfig: true,
        sentryConfig: true,
        githubConfig: true,
        vercelConfig: true,
        firecrawlConfig: true
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Merge with existing configuration
    let updateData: any = {};
    let currentConfig: IntegrationConfig = {};

    switch (integrationId) {
      case "stripe":
        currentConfig = (currentUser.stripeConfig as any) || {};
        updateData.stripeConfig = { ...currentConfig, ...config };
        break;
      case "sendgrid":
        currentConfig = (currentUser.sendGridConfig as any) || {};
        updateData.sendGridConfig = { ...currentConfig, ...config };
        break;
      case "sentry":
        currentConfig = (currentUser.sentryConfig as any) || {};
        updateData.sentryConfig = { ...currentConfig, ...config };
        break;
      case "github":
        currentConfig = (currentUser.githubConfig as any) || {};
        updateData.githubConfig = { ...currentConfig, ...config };
        break;
      case "vercel":
        currentConfig = (currentUser.vercelConfig as any) || {};
        updateData.vercelConfig = { ...currentConfig, ...config };
        break;
      case "firecrawl":
        currentConfig = (currentUser.firecrawlConfig as any) || {};
        updateData.firecrawlConfig = { ...currentConfig, ...config };
        break;
    }

    // Update user configuration
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Return safe configuration
    const safeConfig = Object.keys(config).reduce((acc, key) => {
      if (key.includes('key') || key.includes('token') || key.includes('dsn')) {
        acc[key] = "•••••••••••••••";
      } else {
        acc[key] = config[key];
      }
      return acc;
    }, {} as any);

    return NextResponse.json({
      success: true,
      data: { 
        integrationId,
        config: safeConfig,
        message: "Configuration updated successfully"
      }
    });

  } catch (error) {
    console.error('Update integration config error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
