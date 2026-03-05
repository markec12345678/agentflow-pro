import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/revenue
 * Get revenue analytics data
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

    const propertyIds = properties.map(p => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          revenue: 0,
          trend: "stable",
          change: 0,
          data: []
        }
      });
    }

    // Calculate date range
    const now = new Date();
    let start = new Date();
    let end = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'week':
          start = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          start = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Get reservations with payments
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: start, lte: end },
        status: 'confirmed'
      },
      include: {
        payments: true
      }
    });

    // Calculate revenue data
    const revenueData = calculateRevenueData(reservations, period, start, end);
    
    return NextResponse.json({
      success: true,
      data: revenueData
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function calculateRevenueData(reservations: any[], period: string, start: Date, end: Date) {
  // Group reservations by period and calculate revenue
  const revenueByPeriod = new Map();
  
  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    let periodKey: string;
    
    switch (period) {
      case 'day':
        periodKey = checkIn.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(checkIn);
        weekStart.setDate(checkIn.getDate() - checkIn.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        periodKey = checkIn.getFullYear().toString();
        break;
      default:
        periodKey = checkIn.toISOString().split('T')[0];
    }
    
    const totalPaid = reservation.payments.reduce((sum: number, payment: any) => {
      return sum + (payment.status === 'completed' ? payment.amount : 0);
    }, 0);
    
    if (!revenueByPeriod.has(periodKey)) {
      revenueByPeriod.set(periodKey, 0);
    }
    revenueByPeriod.set(periodKey, revenueByPeriod.get(periodKey) + totalPaid);
  });

  // Convert to array and sort
  const sortedData = Array.from(revenueByPeriod.entries())
    .map(([period, revenue]) => ({ period, revenue }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Calculate trend and change
  const revenueValues = sortedData.map(d => d.revenue);
  const totalRevenue = revenueValues.reduce((sum, val) => sum + val, 0);
  
  let trend = "stable";
  let change = 0;
  
  if (revenueValues.length >= 2) {
    const recent = revenueValues.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, revenueValues.length);
    const previous = revenueValues.slice(-6, -3).reduce((sum, val) => sum + val, 0) / Math.min(3, revenueValues.length - 3);
    
    if (recent > previous * 1.05) {
      trend = "up";
      change = ((recent - previous) / previous) * 100;
    } else if (recent < previous * 0.95) {
      trend = "down";
      change = ((previous - recent) / previous) * 100;
    }
  }

  return {
    total: totalRevenue,
    trend,
    change,
    data: sortedData
  };
}
