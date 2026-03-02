import { NextRequest, NextResponse } from 'next/server';
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
        checkIn: true,
        autoApproved: true,
        source: true
      }
    });

    // Calculate auto-approval data
    const autoApprovalData = calculateAutoApprovalData(reservations, period, start, end);
    
    return NextResponse.json({
      success: true,
      data: autoApprovalData
    });

  } catch (error) {
    console.error('Get auto-approval analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function calculateAutoApprovalData(reservations: any[], period: string, start: Date, end: Date) {
  // Group by month and calculate auto-approval rates
  const monthlyData = new Map();
  
  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    const monthKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { total: 0, autoApproved: 0 });
    }
    
    const monthData = monthlyData.get(monthKey);
    monthData.total++;
    
    if (reservation.autoApproved) {
      monthData.autoApproved++;
    }
  });

  // Convert to array and calculate rates
  const sortedMonthlyData = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      rate: data.total > 0 ? (data.autoApproved / data.total) * 100 : 0,
      total: data.total,
      autoApproved: data.autoApproved
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate current rate
  const totalReservations = reservations.length;
  const totalAutoApproved = reservations.filter(r => r.autoApproved).length;
  const currentRate = totalReservations > 0 ? (totalAutoApproved / totalReservations) * 100 : 0;

  // Calculate trend and change
  const rates = sortedMonthlyData.map(d => d.rate);
  let trend = "stable";
  let change = 0;
  
  if (rates.length >= 2) {
    const recent = rates.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, rates.length);
    const previous = rates.slice(-6, -3).reduce((sum, val) => sum + val, 0) / Math.min(3, rates.length - 3);
    
    if (recent > previous * 1.05) {
      trend = "up";
      change = ((recent - previous) / previous) * 100;
    } else if (recent < previous * 0.95) {
      trend = "down";
      change = ((previous - recent) / previous) * 100;
    }
  }

  return {
    rate: currentRate,
    trend,
    change,
    monthly: sortedMonthlyData.map(d => d.rate)
  };
}
