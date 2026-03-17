import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';
import { triggerAlert } from '@/alerts/smartAlerts';
import { z } from 'zod';

export const dynamic = "force-dynamic";

// Zod schema for creating alerts
const createAlertSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  message: z.string().min(1, 'Message required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  type: z.string().max(50),
  propertyId: z.string().cuid().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/alerts
 * Get all alerts for the user
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (severity && severity !== 'all') {
      where.severity = severity;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get alerts with pagination
    const [alerts, total] = await Promise.all([
      prisma.alertEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.alertEvent.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Create a new alert
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
    
    // Validate input with Zod
    const validatedData = createAlertSchema.parse(body);

    // Create alert
    const alert = await prisma.alertEvent.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        severity: validatedData.severity,
        status: 'active',
        userId,
        propertyId: validatedData.propertyId,
        metadata: validatedData.metadata,
      },
    });

    // Trigger smart alert if needed
    await triggerAlert(type, {
      propertyId,
      userId,
      value: metadata?.value,
      detail: message,
      count: metadata?.count,
      lastError: metadata?.lastError
    });

    return NextResponse.json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    logger.error('Create alert error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
