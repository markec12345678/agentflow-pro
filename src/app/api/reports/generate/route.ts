import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface ReportRequest {
  templateId?: string;
  name?: string;
  description?: string;
  metrics: string[];
  properties: string[];
  dateRange: {
    start: string;
    end: string;
  };
  comparison?: {
    enabled: boolean;
    previousPeriod: boolean;
    yearOverYear: boolean;
  };
  format: "pdf" | "csv" | "excel";
}

/**
 * POST /api/reports/generate
 * Generate a report based on template or custom configuration
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
    const reportRequest: ReportRequest = body;

    if (!reportRequest.metrics || reportRequest.metrics.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Metrics are required' } },
        { status: 400 }
      );
    }

    if (!reportRequest.dateRange || !reportRequest.dateRange.start || !reportRequest.dateRange.end) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Date range is required' } },
        { status: 400 }
      );
    }

    // Get user's properties
    const properties = await prisma.property.findMany({
      where: { userId },
      select: { id: true, name: true }
    });

    if (properties.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_PROPERTIES', message: 'No properties found' } },
        { status: 404 }
      );
    }

    const propertyIds = properties.map(p => p.id);

    // Generate report data
    const reportData = await generateReportData(
      propertyIds,
      reportRequest.metrics,
      new Date(reportRequest.dateRange.start),
      new Date(reportRequest.dateRange.end),
      reportRequest.comparison
    );

    // Generate report file
    const reportFile = await generateReportFile(
      reportRequest.name || "Custom Report",
      reportData,
      reportRequest.format
    );

    // Create report record (in real implementation, this would be stored in database)
    const report = {
      id: `report_${Date.now()}`,
      templateId: reportRequest.templateId,
      name: reportRequest.name || "Custom Report",
      generatedAt: new Date().toISOString(),
      period: reportRequest.dateRange,
      status: "completed",
      fileUrl: reportFile.url,
      fileSize: reportFile.size,
      metrics: reportRequest.metrics,
      properties: reportRequest.properties,
      format: reportRequest.format
    };

    console.log('Generated report:', report);

    return NextResponse.json({
      success: true,
      data: { report }
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function generateReportData(
  propertyIds: string[],
  metrics: string[],
  startDate: Date,
  endDate: Date,
  comparison?: ReportRequest['comparison']
) {
  const data: any = {};

  // Get reservations for the period
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      checkIn: { gte: startDate, lte: endDate },
      status: 'confirmed'
    },
    include: {
      property: {
        select: { name: true }
      },
      guest: {
        select: {
          nationality: true,
          dateOfBirth: true
        }
      },
      payments: {
        select: {
          amount: true,
          status: true,
          method: true
        }
      }
    }
  });

  // Generate data for each requested metric
  for (const metric of metrics) {
    switch (metric) {
      case 'revenue':
        data.revenue = calculateRevenue(reservations);
        break;
      case 'occupancy':
        data.occupancy = await calculateOccupancy(propertyIds, startDate, endDate);
        break;
      case 'adr':
        data.adr = calculateADR(reservations);
        break;
      case 'revpar':
        data.revpar = calculateRevPAR(reservations, propertyIds, startDate, endDate);
        break;
      case 'booking_channels':
        data.bookingChannels = calculateBookingChannels(reservations);
        break;
      case 'guest_demographics':
        data.guestDemographics = calculateGuestDemographics(reservations);
        break;
      case 'auto_approval_rate':
        data.autoApprovalRate = calculateAutoApprovalRate(reservations);
        break;
    }
  }

  // Add comparison data if requested
  if (comparison?.enabled) {
    data.comparison = {};
    
    if (comparison.previousPeriod) {
      const previousStart = new Date(startDate);
      const previousEnd = new Date(endDate);
      const duration = endDate.getTime() - startDate.getTime();
      previousStart.setTime(previousStart.getTime() - duration);
      previousEnd.setTime(previousEnd.getTime() - duration);
      
      data.comparison.previousPeriod = await generateReportData(
        propertyIds,
        metrics,
        previousStart,
        previousEnd
      );
    }
    
    if (comparison.yearOverYear) {
      const yearAgoStart = new Date(startDate);
      const yearAgoEnd = new Date(endDate);
      yearAgoStart.setFullYear(yearAgoStart.getFullYear() - 1);
      yearAgoEnd.setFullYear(yearAgoEnd.getFullYear() - 1);
      
      data.comparison.yearOverYear = await generateReportData(
        propertyIds,
        metrics,
        yearAgoStart,
        yearAgoEnd
      );
    }
  }

  return data;
}

function calculateRevenue(reservations: any[]) {
  const totalRevenue = reservations.reduce((sum, reservation) => {
    const reservationRevenue = reservation.payments.reduce((paymentSum: number, payment: any) => {
      return paymentSum + (payment.status === 'completed' ? payment.amount : 0);
    }, 0);
    return sum + reservationRevenue;
  }, 0);

  return {
    total: totalRevenue,
    average: reservations.length > 0 ? totalRevenue / reservations.length : 0,
    byProperty: reservations.reduce((acc: any, reservation) => {
      const propertyName = reservation.property.name;
      if (!acc[propertyName]) acc[propertyName] = 0;
      
      const reservationRevenue = reservation.payments.reduce((paymentSum: number, payment: any) => {
        return paymentSum + (payment.status === 'completed' ? payment.amount : 0);
      }, 0);
      
      acc[propertyName] += reservationRevenue;
      return acc;
    }, {})
  };
}

async function calculateOccupancy(propertyIds: string[], startDate: Date, endDate: Date) {
  // Get total room capacity
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    include: {
      rooms: {
        select: { capacity: true }
      }
    }
  });

  const totalCapacity = properties.reduce((sum, property) => {
    return sum + property.rooms.reduce((roomSum, room) => roomSum + room.capacity, 0);
  }, 0);

  // Get occupied nights
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      OR: [
        { checkIn: { gte: startDate, lte: endDate } },
        { checkOut: { gte: startDate, lte: endDate } },
        { checkIn: { lte: startDate }, checkOut: { gte: endDate } }
      ],
      status: 'confirmed'
    },
    select: { checkIn: true, checkOut: true, guests: true }
  });

  let occupiedNights = 0;
  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    occupiedNights += Math.min(reservation.guests || 1, nights);
  });

  const totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const availableNights = totalCapacity * totalNights;

  return {
    rate: availableNights > 0 ? (occupiedNights / availableNights) * 100 : 0,
    occupiedNights,
    availableNights,
    totalCapacity
  };
}

function calculateADR(reservations: any[]) {
  let totalRevenue = 0;
  let occupiedNights = 0;

  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const reservationRevenue = reservation.payments.reduce((paymentSum: number, payment: any) => {
      return paymentSum + (payment.status === 'completed' ? payment.amount : 0);
    }, 0);
    
    totalRevenue += reservationRevenue;
    occupiedNights += nights;
  });

  return {
    current: occupiedNights > 0 ? totalRevenue / occupiedNights : 0,
    totalRevenue,
    occupiedNights
  };
}

async function calculateRevPAR(reservations: any[], propertyIds: string[], startDate: Date, endDate: Date) {
  const adrData = calculateADR(reservations);
  
  // Get total room count
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    include: {
      rooms: {
        select: { id: true }
      }
    }
  });

  const totalRooms = properties.reduce((sum, property) => sum + property.rooms.length, 0);
  const totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const availableRoomNights = totalRooms * totalNights;

  return {
    current: availableRoomNights > 0 ? adrData.totalRevenue / availableRoomNights : 0,
    totalRevenue: adrData.totalRevenue,
    availableRoomNights,
    totalRooms
  };
}

function calculateBookingChannels(reservations: any[]) {
  const channels: Record<string, number> = {};

  reservations.forEach(reservation => {
    const channel = (reservation.source || 'other').toLowerCase();
    if (!channels[channel]) channels[channel] = 0;
    channels[channel]++;
  });

  const total = reservations.length;
  const percentages = Object.fromEntries(
    Object.entries(channels).map(([channel, count]) => [
      channel,
      total > 0 ? (count / total) * 100 : 0
    ])
  );

  return {
    counts: channels,
    percentages,
    total
  };
}

function calculateGuestDemographics(reservations: any[]) {
  const countries: Record<string, number> = {};
  const ageGroups: Record<string, number> = {};

  reservations.forEach(reservation => {
    // Country data
    const country = reservation.guest?.nationality || 'Unknown';
    if (!countries[country]) countries[country] = 0;
    countries[country]++;

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
      
      if (!ageGroups[ageGroup]) ageGroups[ageGroup] = 0;
      ageGroups[ageGroup]++;
    }
  });

  const total = reservations.length;

  return {
    countries: Object.fromEntries(
      Object.entries(countries).map(([country, count]) => [
        country,
        { count, percentage: total > 0 ? (count / total) * 100 : 0 }
      ])
    ),
    ageGroups: Object.fromEntries(
      Object.entries(ageGroups).map(([group, count]) => [
        group,
        { count, percentage: total > 0 ? (count / total) * 100 : 0 }
      ])
    ),
    total
  };
}

function calculateAutoApprovalRate(reservations: any[]) {
  const total = reservations.length;
  const autoApproved = reservations.filter(r => r.autoApproved).length;

  return {
    rate: total > 0 ? (autoApproved / total) * 100 : 0,
    total,
    autoApproved,
    manual: total - autoApproved
  };
}

async function generateReportFile(name: string, data: any, format: string) {
  // In a real implementation, this would generate actual files
  // For now, we'll simulate file generation
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name.replace(/\s+/g, '_')}_${timestamp}.${format}`;
  
  // Simulate file size based on format and data complexity
  let size = 0;
  switch (format) {
    case 'pdf':
      size = 100000 + Math.floor(Math.random() * 500000); // 100KB-600KB
      break;
    case 'csv':
      size = 10000 + Math.floor(Math.random() * 50000); // 10KB-60KB
      break;
    case 'excel':
      size = 50000 + Math.floor(Math.random() * 200000); // 50KB-250KB
      break;
  }

  return {
    url: `/reports/${filename}`,
    filename,
    size,
    format
  };
}
