import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/[id]/refund
 * Process a refund for a payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;
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
      select: { role: true, name: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || !reason) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Amount and reason are required' } },
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

    // Get payment details (in real implementation)
    const mockPayment = {
      id: paymentId,
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
      description: "Payment for reservation #123"
    };

    if (!mockPayment) {
      return NextResponse.json(
        { success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' } },
        { status: 404 }
      );
    }

    if (mockPayment.status !== "completed") {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PAYMENT_STATUS', message: 'Only completed payments can be refunded' } },
        { status: 400 }
      );
    }

    // Check if refund amount exceeds payment amount
    const existingRefunds = 0; // Would be calculated from database
    const totalRefundAmount = existingRefunds + amount;
    
    if (totalRefundAmount > mockPayment.amount) {
      return NextResponse.json(
        { success: false, error: { code: 'REFUND_EXCEEDS_PAYMENT', message: 'Refund amount cannot exceed payment amount' } },
        { status: 400 }
      );
    }

    // Process refund (in real implementation)
    const refundResult = await processRefund(mockPayment, amount, reason, currentUser.name || "Unknown");

    // Log activity
    await logActivity(userId, "Payment Refunded", `Refunded €${amount.toFixed(2)} for payment: ${paymentId}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Refund processed successfully',
        refund: refundResult
      }
    });

  } catch (error) {
    logger.error('Process refund error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function processRefund(payment: any, amount: number, reason: string, processedBy: string) {
  // In real implementation, this would:
  // 1. Call payment processor (Stripe, PayPal, etc.)
  // 2. Create refund record in database
  // 3. Update payment status
  // 4. Send notification to guest
  // 5. Update accounting records
  
  logger.info('Processing refund:', {
    paymentId: payment.id,
    amount,
    reason,
    processedBy
  });

  // Simulate refund processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const refundResult = {
    id: `ref_${Date.now()}`,
    paymentId: payment.id,
    amount,
    reason,
    status: "processed",
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    processedBy,
    refundId: `refund_${Math.random().toString(36).substring(2, 15)}`,
    processorResponse: {
      status: "succeeded",
      id: `ch_${Math.random().toString(36).substring(2, 15)}`
    }
  };

  // Update payment status based on refund amount
  const isFullRefund = amount === payment.amount;
  logger.info(`Payment ${payment.id} ${isFullRefund ? 'fully' : 'partially'} refunded`);

  return refundResult;
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
