import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

/**
 * GET /api/payments/invoices
 * Get all invoices
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

    // Check if user has access (receptor, director, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get invoices (in real implementation, this would fetch from database)
    const mockInvoices: Invoice[] = [
      {
        id: "inv_123",
        invoiceNumber: "INV-2024-001",
        reservationId: "res_123",
        guestName: "Janez Novak",
        guestEmail: "janez.novak@email.com",
        amount: 450.00,
        currency: "EUR",
        status: "paid",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: "Deluxe Room - 3 nights",
            quantity: 3,
            unitPrice: 150.00,
            total: 450.00
          }
        ]
      },
      {
        id: "inv_124",
        invoiceNumber: "INV-2024-002",
        reservationId: "res_124",
        guestName: "Maja Horvat",
        guestEmail: "maja.horvat@email.com",
        amount: 320.00,
        currency: "EUR",
        status: "sent",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: "Standard Room - 2 nights",
            quantity: 2,
            unitPrice: 160.00,
            total: 320.00
          }
        ]
      },
      {
        id: "inv_125",
        invoiceNumber: "INV-2024-003",
        reservationId: "res_125",
        guestName: "Peter Kovačič",
        guestEmail: "peter.kovacic@email.com",
        amount: 580.00,
        currency: "EUR",
        status: "overdue",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: "Suite - 2 nights",
            quantity: 2,
            unitPrice: 290.00,
            total: 580.00
          }
        ]
      },
      {
        id: "inv_126",
        invoiceNumber: "INV-2024-004",
        reservationId: "res_126",
        guestName: "Ana Zupan",
        guestEmail: "ana.zupan@email.com",
        amount: 280.00,
        currency: "EUR",
        status: "draft",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            description: "Standard Room - 2 nights",
            quantity: 2,
            unitPrice: 140.00,
            total: 280.00
          }
        ]
      }
    ];

    // Apply filters
    let filteredInvoices = mockInvoices;
    
    if (status) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredInvoices = filteredInvoices.filter(invoice => new Date(invoice.createdAt) >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredInvoices = filteredInvoices.filter(invoice => new Date(invoice.createdAt) <= toDate);
    }

    // Sort by creation date (newest first)
    filteredInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        invoices: paginatedInvoices,
        total: filteredInvoices.length,
        limit,
        offset,
        filters: {
          status,
          dateFrom,
          dateTo
        }
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/invoices
 * Create a new invoice
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

    // Check if user has access (receptor, director, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reservationId, items, dueDate, status = "draft" } = body;

    if (!reservationId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Reservation ID and items are required' } },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.description || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ITEM', message: 'Each item must have description, quantity, and unitPrice' } },
          { status: 400 }
        );
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_QUANTITY', message: 'Quantity must be a positive number' } },
          { status: 400 }
        );
      }

      if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PRICE', message: 'Unit price must be a positive number' } },
          { status: 400 }
        );
      }

      // Calculate total
      item.total = item.quantity * item.unitPrice;
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Create invoice (in real implementation)
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      reservationId,
      guestName: "Guest Name", // Would be fetched from reservation
      guestEmail: "guest@email.com", // Would be fetched from reservation
      amount: totalAmount,
      currency: "EUR",
      status,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      items
    };

    console.log('Created invoice:', newInvoice);

    // Log activity
    await logActivity(userId, "Invoice Created", `Created invoice ${invoiceNumber} for reservation: ${reservationId}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Invoice created successfully',
        invoice: newInvoice
      }
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
