import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/auto-approval
 * Get auto-approval rate analytics
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
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get user's properties
    const properties = await prisma.property.findMany({
      where: { userId },
      select: { id: true }
    });

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          rate: 0,
          trend: "stable",
          change: 0,
          monthly: []
        }
      });
    }

    const propertyIds = properties.map(p => p.id);

    // Calculate date range
    const now = new Date();
    let start = new Date();
    let end = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'month':
          start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Get reservations for the period
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: start, lte: end },
        status: 'confirmed'
      },
      select: {
        checkIn: true
      }
    });

    // Calculate auto-approval data
    const autoApprovalData = calculateAutoApprovalData(reservations, period, start, end);
    
    return NextResponse.json({
      success: true,
      data: autoApprovalData
    });

  } catch (error) {
    logger.error('Get auto-approval analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function calculateAutoApprovalData(reservations: any[], period: string, start: Date, end: Date) {
  // Note: auto-approval feature not yet implemented in database schema
  // Return placeholder data until schema is updated
  const totalReservations = reservations.length;
  
  if (totalReservations === 0) {
    return {
      rate: 0,
      trend: "stable" as const,
      change: 0,
      monthly: []
    };
  }

  // Group by month
  const monthlyData = new Map();

  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    const monthKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { total: 0 });
    }

    const monthData = monthlyData.get(monthKey);
    monthData.total++;
  });

  // Convert to array
  const sortedMonthlyData = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      rate: 0, // Placeholder until auto-approval is implemented
      total: data.total,
      autoApproved: 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    rate: 0, // Placeholder until auto-approval is implemented
    trend: "stable" as const,
    change: 0,
    monthly: sortedMonthlyData.map(d => d.rate)
  };
}
