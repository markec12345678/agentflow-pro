import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/occupancy
 * Get occupancy analytics data
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

    // Get user's properties with room counts
    const properties = await prisma.property.findMany({
      where: { userId },
      include: {
        rooms: {
          select: { id: true, capacity: true }
        }
      }
    });

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          average: 0,
          trend: "stable",
          change: 0,
          data: []
        }
      });
    }

    // Calculate total room capacity
    const totalCapacity = properties.reduce((sum, property) => {
      return sum + property.rooms.reduce((roomSum, room) => roomSum + room.capacity, 0);
    }, 0);

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

    // Get reservations for the period
    const propertyIds = properties.map(p => p.id);
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        OR: [
          { checkIn: { gte: start, lte: end } },
          { checkOut: { gte: start, lte: end } },
          { checkIn: { lte: start }, checkOut: { gte: end } }
        ],
        status: 'confirmed'
      },
      select: {
        checkIn: true,
        checkOut: true,
        guest: true
      }
    });

    // Calculate occupancy data
    const occupancyData = calculateOccupancyData(reservations, totalCapacity, period, start, end);
    
    return NextResponse.json({
      success: true,
      data: occupancyData
    });

  } catch (error) {
    console.error('Get occupancy analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function calculateOccupancyData(reservations: any[], totalCapacity: number, period: string, start: Date, end: Date) {
  // Group by period and calculate occupancy
  const occupancyByPeriod = new Map();
  
  // Generate all periods in the range
  const periods = generatePeriods(start, end, period);
  periods.forEach(period => {
    occupancyByPeriod.set(period, { occupied: 0, available: totalCapacity });
  });

  // Calculate occupied rooms for each reservation
  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const guestCount = reservation.guests || 1;
    
    // Find all periods this reservation affects
    periods.forEach(periodKey => {
      const periodStart = getPeriodStart(periodKey, period);
      const periodEnd = getPeriodEnd(periodKey, period);
      
      // Check if reservation overlaps with this period
      if (checkIn < periodEnd && checkOut > periodStart) {
        const current = occupancyByPeriod.get(periodKey);
        current.occupied += Math.min(guestCount, totalCapacity - current.occupied);
      }
    });
  });

  // Convert to array and calculate occupancy rates
  const sortedData = Array.from(occupancyByPeriod.entries())
    .map(([period, data]) => ({
      period,
      occupancy: data.available > 0 ? (data.occupied / data.available) * 100 : 0,
      occupied: data.occupied,
      available: data.available
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Calculate average occupancy
  const occupancyRates = sortedData.map(d => d.occupancy);
  const averageOccupancy = occupancyRates.length > 0 
    ? occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length 
    : 0;

  // Calculate trend and change
  let trend = "stable";
  let change = 0;
  
  if (occupancyRates.length >= 2) {
    const recent = occupancyRates.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, occupancyRates.length);
    const previous = occupancyRates.slice(-6, -3).reduce((sum, val) => sum + val, 0) / Math.min(3, occupancyRates.length - 3);
    
    if (recent > previous * 1.05) {
      trend = "up";
      change = ((recent - previous) / previous) * 100;
    } else if (recent < previous * 0.95) {
      trend = "down";
      change = ((previous - recent) / previous) * 100;
    }
  }

  return {
    average: averageOccupancy,
    trend,
    change,
    data: sortedData
  };
}

function generatePeriods(start: Date, end: Date, period: string): string[] {
  const periods: string[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    let periodKey: string;
    
    switch (period) {
      case 'day':
        periodKey = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        periodKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
        break;
      case 'year':
        periodKey = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        periodKey = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
    }
    
    if (!periods.includes(periodKey)) {
      periods.push(periodKey);
    }
  }
  
  return periods;
}

function getPeriodStart(periodKey: string, period: string): Date {
  switch (period) {
    case 'day':
      return new Date(periodKey + 'T00:00:00.000Z');
    case 'week':
      return new Date(periodKey + 'T00:00:00.000Z');
    case 'month':
      const [year, month] = periodKey.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    case 'year':
      return new Date(parseInt(periodKey), 0, 1);
    default:
      return new Date(periodKey + 'T00:00:00.000Z');
  }
}

function getPeriodEnd(periodKey: string, period: string): Date {
  switch (period) {
    case 'day':
      return new Date(periodKey + 'T23:59:59.999Z');
    case 'week':
      const weekEnd = new Date(periodKey + 'T00:00:00.000Z');
      weekEnd.setDate(weekEnd.getDate() + 6);
      return new Date(weekEnd.toISOString().split('T')[0] + 'T23:59:59.999Z');
    case 'month':
      const [year, month] = periodKey.split('-');
      const lastDay = new Date(parseInt(year), parseInt(month), 0);
      return new Date(lastDay.toISOString().split('T')[0] + 'T23:59:59.999Z');
    case 'year':
      return new Date(parseInt(periodKey), 11, 31, 23, 59, 59, 999);
    default:
      return new Date(periodKey + 'T23:59:59.999Z');
  }
}
