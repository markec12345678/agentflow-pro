import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/export
 * Export analytics data in CSV or PDF format
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
    const { format, data, dateRange } = body;

    if (!format || !['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FORMAT', message: 'Format must be csv or pdf' } },
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

    // Calculate date range
    const now = new Date();
    let start = dateRange?.startDate ? new Date(dateRange.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let end = dateRange?.endDate ? new Date(dateRange.endDate) : now;

    // Get comprehensive data for export
    const exportData = await getExportData(propertyIds, start, end, data);

    // Generate export based on format
    let exportContent: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      exportContent = generateCSV(exportData);
      contentType = 'text/csv';
      filename = `analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
    } else {
      exportContent = generatePDF(exportData);
      contentType = 'application/pdf';
      filename = `analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.pdf`;
    }

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function getExportData(propertyIds: string[], start: Date, end: Date, requestedData: any) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      checkIn: { gte: start, lte: end },
      status: 'confirmed'
    },
    include: {
      property: {
        select: { name: true }
      },
      guest: {
        select: {
          name: true,
          email: true,
          countryCode: true,
          dateOfBirth: true
        }
      },
      payments: {
        select: {
          amount: true,
          method: true,
          createdAt: true
        }
      }
    },
    orderBy: { checkIn: 'desc' }
  });

  return {
    reservations,
    summary: {
      totalReservations: reservations.length,
      totalRevenue: reservations.reduce((sum, r) => {
        return sum + r.payments.reduce((paymentSum, p) =>
          paymentSum + p.amount, 0);
      }, 0),
      averageRevenue: reservations.length > 0 ?
        reservations.reduce((sum, r) => sum + r.payments.reduce((paymentSum, p) =>
          paymentSum + p.amount, 0), 0) / reservations.length : 0,
      dateRange: { start, end }
    }
  };
}

function generateCSV(data: any): string {
  const { reservations, summary } = data;
  
  // CSV Header
  const headers = [
    'Property',
    'Guest Name',
    'Guest Email',
    'Nationality',
    'Check-in',
    'Check-out',
    'Nights',
    'Guests',
    'Total Amount',
    'Payment Status',
    'Payment Method',
    'Source',
    'Auto-approved'
  ];

  // CSV Data
  const rows = reservations.map((reservation: any) => [
    reservation.property.name,
    reservation.guest?.name || '',
    reservation.guest?.email || '',
    reservation.guest?.countryCode || '',
    reservation.checkIn.toISOString().split('T')[0],
    reservation.checkOut.toISOString().split('T')[0],
    Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
    reservation.guests || 1,
    reservation.payments.reduce((sum: number, p: any) =>
      sum + p.amount, 0).toFixed(2),
    'Completed',
    reservation.payments[0]?.method || '',
    reservation.source || '',
    reservation.autoApproved ? 'Yes' : 'No'
  ]);

  // Build CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

function generatePDF(data: any): string {
  // In a real implementation, you would use a PDF library like jsPDF or Puppeteer
  // For now, we'll return a simple text representation
  const { reservations, summary } = data;
  
  const pdfContent = `
Analytics Report
================

Date Range: ${summary.dateRange.start.toISOString().split('T')[0]} to ${summary.dateRange.end.toISOString().split('T')[0]}

Summary
-------
Total Reservations: ${summary.totalReservations}
Total Revenue: €${summary.totalRevenue.toFixed(2)}
Average Revenue per Reservation: €${summary.averageRevenue.toFixed(2)}

Reservations
------------
${reservations.map((r: any) => `
${r.property.name} - ${r.guest?.name || 'Guest'}
Check-in: ${r.checkIn.toISOString().split('T')[0]}
Check-out: ${r.checkOut.toISOString().split('T')[0]}
Guests: ${r.guests || 1}
Amount: €${r.payments.reduce((sum: number, p: any) => sum + (p.status === 'completed' ? p.amount : 0), 0).toFixed(2)}
Status: ${r.payments.some((p: any) => p.status === 'completed') ? 'Paid' : 'Pending'}
---
`).join('')}
  `.trim();

  return pdfContent;
}
