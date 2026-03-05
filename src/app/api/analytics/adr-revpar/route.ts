import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/adr-revpar
 * Get ADR and RevPAR analytics data
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
          adr: { current: 0, average: 0, trend: "stable", change: 0 },
          revpar: { current: 0, average: 0, trend: "stable", change: 0 }
        }
      });
    }

    // Calculate total room count
    const totalRooms = properties.reduce((sum, property) => {
      return sum + property.rooms.length;
    }, 0);

    // Calculate date range (default to last 30 days)
    const now = new Date();
    let start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : now;

    // Get reservations for the period
    const propertyIds = properties.map(p => p.id);
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

    // Calculate ADR and RevPAR
    const metrics = calculateADRRevPAR(reservations, totalRooms, start, end);
    
    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Get ADR/RevPAR analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function calculateADRRevPAR(reservations: any[], totalRooms: number, start: Date, end: Date) {
  // Calculate total revenue and occupied room nights
  let totalRevenue = 0;
  let occupiedRoomNights = 0;
  const dailyData = new Map();

  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate total paid for this reservation
    const totalPaid = reservation.payments.reduce((sum: number, payment: any) => {
      return sum + (payment.status === 'completed' ? payment.amount : 0);
    }, 0);
    
    totalRevenue += totalPaid;
    occupiedRoomNights += nights;
    
    // Calculate daily ADR
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn);
      currentDate.setDate(checkIn.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { revenue: 0, occupiedRooms: 0 });
      }
      
      const dayData = dailyData.get(dateKey);
      dayData.revenue += totalPaid / nights;
      dayData.occupiedRooms += 1;
    }
  });

  // Calculate total available room nights
  const totalNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const availableRoomNights = totalRooms * totalNights;

  // Calculate current ADR and RevPAR
  const currentADR = occupiedRoomNights > 0 ? totalRevenue / occupiedRoomNights : 0;
  const currentRevPAR = availableRoomNights > 0 ? totalRevenue / availableRoomNights : 0;

  // Calculate historical averages (using daily data)
  const dailyADRValues = Array.from(dailyData.values())
    .filter(day => day.occupiedRooms > 0)
    .map(day => day.revenue / day.occupiedRooms);
  
  const dailyRevPARValues = Array.from(dailyData.values())
    .map(day => day.revenue / totalRooms);

  const averageADR = dailyADRValues.length > 0 
    ? dailyADRValues.reduce((sum, val) => sum + val, 0) / dailyADRValues.length 
    : currentADR;
    
  const averageRevPAR = dailyRevPARValues.length > 0
    ? dailyRevPARValues.reduce((sum, val) => sum + val, 0) / dailyRevPARValues.length
    : currentRevPAR;

  // Calculate trends (comparing recent period to previous period)
  const adrTrend = calculateTrend(dailyADRValues);
  const revparTrend = calculateTrend(dailyRevPARValues);

  return {
    adr: {
      current: currentADR,
      average: averageADR,
      trend: adrTrend.trend,
      change: adrTrend.change
    },
    revpar: {
      current: currentRevPAR,
      average: averageRevPAR,
      trend: revparTrend.trend,
      change: revparTrend.change
    }
  };
}
}

function calculateTrend(values: number[]): { trend: string; change: number } {
  if (values.length < 6) {
    return { trend: "stable", change: 0 };
  }

  const recent = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
  const previous = values.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
  
  let trend = "stable";
  let change = 0;
  
  if (recent > previous * 1.05) {
    trend = "up";
    change = ((recent - previous) / previous) * 100;
  } else if (recent < previous * 0.95) {
    trend = "down";
    change = ((previous - recent) / previous) * 100;
  }
  
  return { trend, change };
}
