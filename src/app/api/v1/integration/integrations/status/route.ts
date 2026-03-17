import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface IntegrationStatus {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  lastTestTime: string | null;
  responseTime: number | null;
  errorMessage?: string;
  configured: boolean;
}

/**
 * GET /api/integrations/status
 * Get all integration statuses
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

    // Get user's integration configurations
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

    // Mock integration statuses (in real implementation, these would come from database or recent tests)
    const statuses: IntegrationStatus[] = [
      {
        id: "stripe",
        name: "Stripe",
        status: user.stripeConfig ? "connected" : "disconnected",
        lastTestTime: user.stripeConfig ? new Date(Date.now() - 10 * 60 * 1000).toISOString() : null,
        responseTime: user.stripeConfig ? 245 : null,
        configured: !!user.stripeConfig
      },
      {
        id: "sendgrid",
        name: "SendGrid",
        status: user.sendGridConfig ? "connected" : "disconnected",
        lastTestTime: user.sendGridConfig ? new Date(Date.now() - 5 * 60 * 1000).toISOString() : null,
        responseTime: user.sendGridConfig ? 189 : null,
        configured: !!user.sendGridConfig
      },
      {
        id: "sentry",
        name: "Sentry",
        status: user.sentryConfig ? "connected" : "disconnected",
        lastTestTime: user.sentryConfig ? new Date(Date.now() - 15 * 60 * 1000).toISOString() : null,
        responseTime: user.sentryConfig ? 156 : null,
        configured: !!user.sentryConfig
      },
      {
        id: "github",
        name: "GitHub",
        status: user.githubConfig ? "connected" : "disconnected",
        lastTestTime: user.githubConfig ? new Date(Date.now() - 30 * 60 * 1000).toISOString() : null,
        responseTime: user.githubConfig ? 423 : null,
        configured: !!user.githubConfig
      },
      {
        id: "vercel",
        name: "Vercel",
        status: user.vercelConfig ? "connected" : "disconnected",
        lastTestTime: user.vercelConfig ? new Date(Date.now() - 2 * 60 * 1000).toISOString() : null,
        responseTime: user.vercelConfig ? 134 : null,
        configured: !!user.vercelConfig
      },
      {
        id: "firecrawl",
        name: "Firecrawl",
        status: user.firecrawlConfig ? "error" : "disconnected",
        lastTestTime: user.firecrawlConfig ? new Date(Date.now() - 60 * 60 * 1000).toISOString() : null,
        responseTime: null,
        errorMessage: user.firecrawlConfig ? "API rate limit exceeded" : undefined,
        configured: !!user.firecrawlConfig
      }
    ];

    return NextResponse.json({
      success: true,
      data: { 
        statuses,
        summary: {
          total: statuses.length,
          connected: statuses.filter(s => s.status === "connected").length,
          errors: statuses.filter(s => s.status === "error").length,
          configured: statuses.filter(s => s.configured).length
        }
      }
    });

  } catch (error) {
    logger.error('Get integration statuses error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
