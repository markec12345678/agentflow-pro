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
  guestPhone?: string;
  guestAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  items: InvoiceItem[];
  template: string;
  taxRate: number;
  notes?: string;
  paymentTerms?: string;
  recurring?: {
    frequency: "weekly" | "monthly" | "quarterly";
    nextInvoiceDate: string;
    endDate?: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate: number;
  total: number;
}

/**
 * GET /api/invoices
 * Get all invoices with filtering
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

    // Check if user has access (receptor, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const recurring = searchParams.get('recurring');
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
        guestPhone: "+386 1 234 5678",
        guestAddress: {
          street: "Cankarjeva ulica 5",
          city: "Ljubljana",
          country: "Slovenia",
          postalCode: "1000"
        },
        amount: 450.00,
        currency: "EUR",
        taxAmount: 94.50,
        totalAmount: 544.50,
        status: "paid",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            id: "item_1",
            description: "Deluxe Room - 3 nights",
            quantity: 3,
            unitPrice: 150.00,
            taxRate: 21,
            total: 450.00
          }
        ],
        template: "standard",
        taxRate: 21,
        notes: "Payment due within 7 days. Thank you for your business!",
        paymentTerms: "Net 7"
      },
      {
        id: "inv_124",
        invoiceNumber: "INV-2024-002",
        reservationId: "res_124",
        guestName: "Maja Horvat",
        guestEmail: "maja.horvat@email.com",
        amount: 320.00,
        currency: "EUR",
        taxAmount: 67.20,
        totalAmount: 387.20,
        status: "sent",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            id: "item_2",
            description: "Standard Room - 2 nights",
            quantity: 2,
            unitPrice: 160.00,
            taxRate: 21,
            total: 320.00
          }
        ],
        template: "standard",
        taxRate: 21,
        paymentTerms: "Net 7"
      },
      {
        id: "inv_125",
        invoiceNumber: "INV-2024-003",
        reservationId: "res_125",
        guestName: "Peter Kovačič",
        guestEmail: "peter.kovacic@email.com",
        amount: 1200.00,
        currency: "EUR",
        taxAmount: 252.00,
        totalAmount: 1452.00,
        status: "draft",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            id: "item_3",
            description: "Suite - 7 nights (Long stay)",
            quantity: 7,
            unitPrice: 171.43,
            discount: 10,
            taxRate: 21,
            total: 1200.00
          }
        ],
        template: "detailed",
        taxRate: 21,
        recurring: {
          frequency: "weekly",
          nextInvoiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: "inv_126",
        invoiceNumber: "INV-2024-004",
        reservationId: "res_126",
        guestName: "Ana Zupan",
        guestEmail: "ana.zupan@email.com",
        amount: 280.00,
        currency: "EUR",
        taxAmount: 58.80,
        totalAmount: 338.80,
        status: "overdue",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            id: "item_4",
            description: "Standard Room - 2 nights",
            quantity: 2,
            unitPrice: 140.00,
            taxRate: 21,
            total: 280.00
          }
        ],
        template: "minimal",
        taxRate: 21,
        paymentTerms: "Net 7"
      }
    ];

    // Apply filters
    let filteredInvoices = mockInvoices;
    
    if (status) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }
    
    if (recurring === "true") {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.recurring);
    } else if (recurring === "false") {
      filteredInvoices = filteredInvoices.filter(invoice => !invoice.recurring);
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
          recurring,
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
 * POST /api/invoices
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

    // Check if user has access (receptor, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      reservationId, 
      items, 
      dueDate, 
      template = "standard", 
      taxRate = 21, 
      notes, 
      paymentTerms,
      recurring,
      guestInfo 
    } = body;

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

      // Calculate item total with discount
      const subtotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const discountedSubtotal = subtotal * (1 - discount / 100);
      const taxAmount = discountedSubtotal * (item.taxRate || taxRate) / 100;
      item.total = discountedSubtotal + taxAmount;
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      return sum + (itemSubtotal * (1 - discount / 100));
    }, 0);
    
    const taxAmount = subtotal * taxRate / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Create invoice (in real implementation)
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      reservationId,
      guestName: guestInfo?.name || "Guest Name", // Would be fetched from reservation
      guestEmail: guestInfo?.email || "guest@email.com",
      guestPhone: guestInfo?.phone,
      guestAddress: guestInfo?.address,
      amount: subtotal,
      currency: "EUR",
      taxAmount,
      totalAmount,
      status: "draft",
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      items,
      template,
      taxRate,
      notes,
      paymentTerms,
      recurring: recurring ? {
        frequency: recurring.frequency,
        nextInvoiceDate: new Date(Date.now() + getFrequencyDays(recurring.frequency) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: recurring.endDate
      } : undefined
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

function getFrequencyDays(frequency: string): number {
  switch (frequency) {
    case "weekly": return 7;
    case "monthly": return 30;
    case "quarterly": return 90;
    default: return 30;
  }
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
