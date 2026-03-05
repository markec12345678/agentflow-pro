import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface Payment {
  id: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "partially_refunded";
  paymentMethod: "credit_card" | "bank_transfer" | "cash" | "paypal" | "stripe";
  paymentMethodDetails: {
    last4?: string;
    brand?: string;
    bankName?: string;
    paypalEmail?: string;
  };
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  refundAmount?: number;
  description: string;
  invoiceId?: string;
  metadata?: {
    propertyId: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
  };
}

/**
 * GET /api/payments
 * Get all payments with filtering
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
    const paymentMethod = searchParams.get('paymentMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payments (in real implementation, this would fetch from database)
    const mockPayments: Payment[] = [
      {
        id: "pay_1",
        reservationId: "res_123",
        guestName: "Janez Novak",
        guestEmail: "janez.novak@email.com",
        amount: 450.00,
        currency: "EUR",
        status: "completed",
        paymentMethod: "credit_card",
        paymentMethodDetails: {
          last4: "4242",
          brand: "Visa"
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        description: "Payment for reservation #123",
        invoiceId: "inv_123",
        metadata: {
          propertyId: "prop_1",
          propertyName: "Hotel Alpina",
          checkIn: "2024-06-15",
          checkOut: "2024-06-18",
          roomType: "Deluxe Room"
        }
      },
      {
        id: "pay_2",
        reservationId: "res_124",
        guestName: "Maja Horvat",
        guestEmail: "maja.horvat@email.com",
        amount: 320.00,
        currency: "EUR",
        status: "pending",
        paymentMethod: "bank_transfer",
        paymentMethodDetails: {
          bankName: "NLB d.d."
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Payment for reservation #124",
        invoiceId: "inv_124",
        metadata: {
          propertyId: "prop_1",
          propertyName: "Hotel Alpina",
          checkIn: "2024-06-20",
          checkOut: "2024-06-22",
          roomType: "Standard Room"
        }
      },
      {
        id: "pay_3",
        reservationId: "res_125",
        guestName: "Peter Kovačič",
        guestEmail: "peter.kovacic@email.com",
        amount: 580.00,
        currency: "EUR",
        status: "failed",
        paymentMethod: "credit_card",
        paymentMethodDetails: {
          last4: "5555",
          brand: "Mastercard"
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        failedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
        description: "Payment for reservation #125",
        metadata: {
          propertyId: "prop_2",
          propertyName: "Alpine Resort",
          checkIn: "2024-06-25",
          checkOut: "2024-06-28",
          roomType: "Suite"
        }
      },
      {
        id: "pay_4",
        reservationId: "res_126",
        guestName: "Ana Zupan",
        guestEmail: "ana.zupan@email.com",
        amount: 280.00,
        currency: "EUR",
        status: "refunded",
        paymentMethod: "paypal",
        paymentMethodDetails: {
          paypalEmail: "ana.zupan@email.com"
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
        refundAmount: 280.00,
        description: "Payment for reservation #126",
        invoiceId: "inv_126",
        metadata: {
          propertyId: "prop_1",
          propertyName: "Hotel Alpina",
          checkIn: "2024-06-10",
          checkOut: "2024-06-12",
          roomType: "Standard Room"
        }
      },
      {
        id: "pay_5",
        reservationId: "res_127",
        guestName: "Marko Novak",
        guestEmail: "marko.novak@email.com",
        amount: 750.00,
        currency: "EUR",
        status: "partially_refunded",
        paymentMethod: "stripe",
        paymentMethodDetails: {
          last4: "1234",
          brand: "Visa"
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
        refundAmount: 200.00,
        description: "Payment for reservation #127",
        invoiceId: "inv_127",
        metadata: {
          propertyId: "prop_2",
          propertyName: "Alpine Resort",
          checkIn: "2024-06-05",
          checkOut: "2024-06-08",
          roomType: "Presidential Suite"
        }
      }
    ];

    // Apply filters
    let filteredPayments = mockPayments;
    
    if (status) {
      filteredPayments = filteredPayments.filter(payment => payment.status === status);
    }
    
    if (paymentMethod) {
      filteredPayments = filteredPayments.filter(payment => payment.paymentMethod === paymentMethod);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredPayments = filteredPayments.filter(payment => new Date(payment.createdAt) >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredPayments = filteredPayments.filter(payment => new Date(payment.createdAt) <= toDate);
    }

    // Sort by creation date (newest first)
    filteredPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedPayments = filteredPayments.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        payments: paginatedPayments,
        total: filteredPayments.length,
        limit,
        offset,
        filters: {
          status,
          paymentMethod,
          dateFrom,
          dateTo
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Create a new payment
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
    const { reservationId, amount, paymentMethod, description, metadata } = body;

    if (!reservationId || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Reservation ID, amount, and payment method are required' } },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number' } },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ["credit_card", "bank_transfer", "cash", "paypal", "stripe"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PAYMENT_METHOD', message: 'Invalid payment method' } },
        { status: 400 }
      );
    }

    // Create payment (in real implementation)
    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      reservationId,
      guestName: "Guest Name", // Would be fetched from reservation
      guestEmail: "guest@email.com", // Would be fetched from reservation
      amount,
      currency: "EUR",
      status: "pending",
      paymentMethod,
      paymentMethodDetails: {}, // Would be populated based on payment method
      createdAt: new Date().toISOString(),
      description: description || `Payment for reservation ${reservationId}`,
      metadata
    };

    console.log('Created payment:', newPayment);

    // Log activity
    await logActivity(userId, "Payment Created", `Created payment for reservation: ${reservationId}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Payment created successfully',
        payment: newPayment
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
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
