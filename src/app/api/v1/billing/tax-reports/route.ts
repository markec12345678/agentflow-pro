/**
 * Tax Report API Routes
 * 
 * POST /api/tax-reports - Generate monthly tax report
 * GET /api/tax-reports - List tax reports
 * GET /api/tax-reports/[id]/edavki - Export for eDavki
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';
import { calculateTouristTax, calculateVAT } from '@/core/domain/tourism/tax-rates';

/**
 * POST /api/tax-reports
 * Generate monthly tax report for a property
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, year, month } = body;
    
    if (!propertyId || !year || !month) {
      return NextResponse.json(
        { error: 'Property ID, year, and month are required' },
        { status: 400 }
      );
    }
    
    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if report already exists
    const existingReport = await prisma.taxReport.findFirst({
      where: {
        propertyId,
        year,
        monthNumber: month,
      },
    });
    
    if (existingReport) {
      return NextResponse.json(existingReport);
    }
    
    // Get all checked-out reservations for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: {
          gte: startDate,
          lt: endDate,
        },
        status: 'checked_out',
      },
      include: {
        property: true,
        guest: true,
      },
    });
    
    // Calculate totals
    const totalNights = reservations.reduce((sum, r) => sum + r.nights, 0);
    const totalGuests = reservations.reduce((sum, r) => sum + r.guests, 0);
    const totalAdults = reservations.reduce((sum, r) => sum + (r.adults || r.guests), 0);
    const totalChildren = totalGuests - totalAdults;
    
    // Calculate tourist tax
    const touristTaxAmount = reservations.reduce((sum, r) => {
      const tax = calculateTouristTax(
        r.property.municipality || 'default',
        r.adults || r.guests,
        r.guests - (r.adults || r.guests),
        0, // children 0-7 (simplified)
        r.nights,
        r.property.hasSpa || false
      );
      return sum + tax;
    }, 0);
    
    // Calculate total accommodation and VAT
    const totalAccommodation = reservations.reduce(
      (sum, r) => sum + Number(r.totalPrice),
      0
    );
    const vatAmount = calculateVAT(totalAccommodation + touristTaxAmount, 22);
    
    // Create tax report
    const taxReport = await prisma.taxReport.create({
      data: {
        propertyId,
        propertyName: property.name,
        month: startDate,
        year,
        monthNumber: month,
        totalNights,
        totalGuests,
        totalAdults,
        totalChildren,
        touristTaxAmount,
        vatAmount,
        totalAccommodation,
        status: 'draft',
      },
    });
    
    return NextResponse.json(taxReport, { status: 201 });
  } catch (error) {
    console.error('Error generating tax report:', error);
    return NextResponse.json(
      { error: 'Failed to generate tax report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tax-reports
 * List all tax reports (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    const where: any = {};
    
    if (propertyId) {
      where.propertyId = propertyId;
    }
    
    if (year) {
      where.year = parseInt(year);
    }
    
    if (status) {
      where.status = status;
    }
    
    const reports = await prisma.taxReport.findMany({
      where,
      orderBy: [{ year: 'desc' }, { monthNumber: 'desc' }],
      take: limit,
      skip,
    });
    
    const total = await prisma.taxReport.count({ where });
    
    return NextResponse.json({
      reports,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing tax reports:', error);
    return NextResponse.json(
      { error: 'Failed to list tax reports' },
      { status: 500 }
    );
  }
}
