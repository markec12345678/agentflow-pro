import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/channels
 * Get booking channel breakdown
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

    // Calculate date range (default to last 30 days)
    const now = new Date();
    let start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : now;

    // Get user's properties
    const properties = await prisma.property.findMany({
      where: { userId },
      select: { id: true }
    });

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          direct: 0,
          bookingcom: 0,
          airbnb: 0,
          expedia: 0,
          other: 0
        }
      });
    }

    const propertyIds = properties.map(p => p.id);

    // Get reservations for the period
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: start, lte: end },
        status: 'confirmed'
      },
      select: {
        channel: true
      }
    });

    // Calculate channel breakdown
    const channelData = calculateChannelBreakdown(reservations);
    
    return NextResponse.json({
      success: true,
      data: channelData
    });

  } catch (error) {
    console.error('Get channels analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function calculateChannelBreakdown(reservations: any[]) {
  const channels = {
    direct: 0,
    bookingcom: 0,
    airbnb: 0,
    expedia: 0,
    other: 0
  };

  reservations.forEach(reservation => {
    const channel = (reservation.channel || 'other').toLowerCase();

    switch (channel) {
      case 'direct':
      case 'website':
      case 'phone':
        channels.direct++;
        break;
      case 'booking.com':
      case 'bookingcom':
        channels.bookingcom++;
        break;
      case 'airbnb':
        channels.airbnb++;
        break;
      case 'expedia':
        channels.expedia++;
        break;
      default:
        channels.other++;
    }
  });

  // Convert to percentages
  const total = Object.values(channels).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return channels;
  }

  const percentages = Object.fromEntries(
    Object.entries(channels).map(([key, count]) => [
      key,
      total > 0 ? (count / total) * 100 : 0
    ])
  );

  return percentages;
}
