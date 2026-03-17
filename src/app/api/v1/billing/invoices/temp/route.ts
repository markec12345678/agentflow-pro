/**
 * Invoice API Routes
 * 
 * POST /api/invoices - Create new invoice
 * GET /api/invoices - List invoices
 * GET /api/invoices/[id] - Get invoice details
 * GET /api/invoices/[id]/pdf - Download invoice PDF
 * POST /api/invoices/[id]/send - Send invoice via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';
import { calculateTouristTax, calculateVAT } from '@/lib/tourism/tax-rates';
import { generateInvoicePDF } from '@/lib/invoices/invoice-template';

/**
 * POST /api/invoices
 * Create new invoice from reservation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId } = body;
    
    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }
    
    // Get reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        property: true,
        room: true,
      },
    });
    
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }
    
    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findFirst({
      where: { reservationId: reservation.id },
    });
    
    if (existingInvoice) {
      return NextResponse.json(existingInvoice);
    }
    
    // Calculate tourist tax
    const touristTax = calculateTouristTax(
      reservation.property.municipality || 'default',
      reservation.adults || reservation.guests,
      reservation.guests - (reservation.adults || reservation.guests),
      0, // children 0-7 (simplified)
      reservation.nights,
      reservation.property.hasSpa || false
    );
    
    // Calculate VAT
    const vatAmount = calculateVAT(
      Number(reservation.totalPrice) + touristTax,
      22
    );
    
    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    
    // Calculate due date (30 days from invoice date)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        reservationId: reservation.id,
        guestId: reservation.guestId,
        invoiceDate: new Date(),
        dueDate,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        accommodation: reservation.totalPrice,
        touristTax,
        vatRate: 22,
        vatAmount,
        total: Number(reservation.totalPrice) + touristTax + vatAmount,
        status: 'draft',
      },
      include: {
        reservation: {
          include: {
            guest: true,
            property: true,
          },
        },
      },
    });
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices
 * List all invoices (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const guestId = searchParams.get('guestId');
    const propertyId = searchParams.get('propertyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (guestId) {
      where.guestId = guestId;
    }
    
    if (propertyId) {
      where.reservation = {
        propertyId,
      };
    }
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        reservation: {
          include: {
            guest: true,
            property: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
      take: limit,
      skip,
    });
    
    const total = await prisma.invoice.count({ where });
    
    return NextResponse.json({
      invoices,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    );
  }
}
