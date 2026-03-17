import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/demographics
 * Get guest demographics analytics
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
          countries: [],
          ageGroups: [],
          stayDuration: []
        }
      });
    }

    const propertyIds = properties.map(p => p.id);

    // Get reservations with guest data for the period
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: start, lte: end },
        status: 'confirmed'
      },
      include: {
        guest: {
          select: {
            countryCode: true,
            dateOfBirth: true
          }
        }
      }
    });

    // Calculate demographics
    const demographics = calculateDemographics(reservations);
    
    return NextResponse.json({
      success: true,
      data: demographics
    });

  } catch (error) {
    logger.error('Get demographics analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

function calculateDemographics(reservations: any[]) {
  const countries = new Map<string, number>();
  const ageGroups = new Map<string, number>();
  const stayDurations = new Map<string, number>();

  reservations.forEach(reservation => {
    // Country data
    const country = reservation.guest?.countryCode || 'Unknown';
    countries.set(country, (countries.get(country) || 0) + 1);

    // Age group data
    if (reservation.guest?.dateOfBirth) {
      const birthYear = new Date(reservation.guest.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      let ageGroup: string;
      if (age < 25) ageGroup = '18-24';
      else if (age < 35) ageGroup = '25-34';
      else if (age < 45) ageGroup = '35-44';
      else if (age < 55) ageGroup = '45-54';
      else ageGroup = '55+';
      
      ageGroups.set(ageGroup, (ageGroups.get(ageGroup) || 0) + 1);
    }

    // Stay duration data
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    let durationGroup: string;
    if (nights <= 2) durationGroup = '1-2 noči';
    else if (nights <= 4) durationGroup = '3-4 noči';
    else if (nights <= 7) durationGroup = '5-7 noči';
    else durationGroup = '7+ noči';
    
    stayDurations.set(durationGroup, (stayDurations.get(durationGroup) || 0) + 1);
  });

  const totalGuests = reservations.length;

  // Convert to percentages and format
  const formatData = (data: Map<string, number>) => {
    return Array.from(data.entries())
      .map(([key, value]) => ({
        [data === countries ? 'country' : data === ageGroups ? 'group' : 'duration']: key,
        guests: value,
        percentage: totalGuests > 0 ? (value / totalGuests) * 100 : 0
      }))
      .sort((a, b) => b.guests - a.guests)
      .slice(0, 6); // Top 6
  };

  return {
    countries: formatData(countries) as any[],
    ageGroups: formatData(ageGroups) as any[],
    stayDuration: formatData(stayDurations) as any[]
  };
}
