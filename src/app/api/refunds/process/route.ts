/**
 * API Route: Process Refund
 *
 * POST /api/refunds/process - Process refund for payment
 * GET /api/refunds/[id] - Get refund status
 *
 * Uses Stripe Refund API
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { stripeService } from "@/lib/stripe";
import { UseCaseFactory } from "@/core/use-cases/use-case-factory";
import { handleApiError, withRequestLogging } from "@/app/api/middleware";

export const dynamic = "force-dynamic";

/**
 * POST /api/refunds/process
 * Process refund for a payment
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        const userId = getUserId(session);

        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 },
          );
        }

        // 2. Check user role
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (!currentUser || !["admin", "receptor"].includes(currentUser.role)) {
          return NextResponse.json(
            { error: "Admin or Receptor access required" },
            { status: 403 },
          );
        }

        // 3. Parse request body
        const body = await request.json();
        const { paymentId, amount, reason } = body;

        if (!paymentId || !reason) {
          return NextResponse.json(
            { error: "Missing required fields: paymentId, reason" },
            { status: 400 },
          );
        }

        // 4. Get payment from database
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: {
            reservation: {
              select: {
                propertyId: true,
                totalAmount: true,
              },
            },
          },
        });

        if (!payment) {
          return NextResponse.json(
            { error: "Payment not found" },
            { status: 404 },
          );
        }

        // 5. Verify user has access to property
        const hasAccess = await prisma.property.findFirst({
          where: {
            id: payment.reservation.propertyId,
            OR: [{ userId }, { users: { some: { id: userId } } }],
          },
        });

        if (!hasAccess) {
          return NextResponse.json(
            { error: "Access denied to this property" },
            { status: 403 },
          );
        }

        // 6. Validate refund amount
        const refundAmount = amount || payment.amount;
        if (refundAmount > payment.amount) {
          return NextResponse.json(
            { error: "Refund amount cannot exceed payment amount" },
            { status: 400 },
          );
        }

        // 7. Check if payment has Stripe transaction ID
        if (!payment.transactionId) {
          return NextResponse.json(
            { error: "Payment has no transaction ID" },
            { status: 400 },
          );
        }

        // 8. Process refund through Stripe
        const stripe = stripeService;
        const refund = await stripe.getStripe().refunds.create({
          payment_intent: payment.transactionId,
          amount: refundAmount,
          reason: "requested_by_customer",
          metadata: {
            refundReason: reason,
            processedBy: userId,
            paymentId: paymentId,
          },
        });

        // 9. Create refund record in database
        const refundRecord = await prisma.refund.create({
          data: {
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            paymentId: payment.id,
            userId,
            amount: refundAmount,
            reason,
            status: refund.status as any,
            transactionId: refund.id,
            processedAt: new Date(refund.created * 1000),
          },
        });

        // 10. Update payment status
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status:
              refundAmount >= payment.amount
                ? "refunded"
                : "partially_refunded",
            updatedAt: new Date(),
          },
        });

        // 11. Update reservation status if full refund
        if (refundAmount >= payment.amount) {
          await prisma.reservation.update({
            where: { id: payment.reservationId },
            data: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            refundId: refundRecord.id,
            transactionId: refund.id,
            amount: refundAmount,
            status: refund.status,
            processedAt: new Date(refund.created * 1000).toISOString(),
            reason,
          },
        });
      } catch (error: any) {
        logger.error("[Refund] Error processing refund:", error);

        // Handle Stripe-specific errors
        if (error.type === "StripeCardError") {
          return NextResponse.json(
            { error: "Payment method declined" },
            { status: 402 },
          );
        }

        if (error.type === "StripeInvalidRequestError") {
          return NextResponse.json(
            { error: "Invalid refund request" },
            { status: 400 },
          );
        }

        return handleApiError(error, {
          route: "/api/refunds/process",
          method: "POST",
        });
      }
    },
    "/api/refunds/process",
  );
}

/**
 * GET /api/refunds/[id]
 * Get refund status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        const userId = getUserId(session);

        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 },
          );
        }

        // 2. Get refund ID
        const { id } = await params;

        // 3. Get refund from database
        const refund = await prisma.refund.findUnique({
          where: { id },
          include: {
            payment: {
              include: {
                reservation: {
                  select: {
                    propertyId: true,
                  },
                },
              },
            },
          },
        });

        if (!refund) {
          return NextResponse.json(
            { error: "Refund not found" },
            { status: 404 },
          );
        }

        // 4. Verify user has access
        const hasAccess = await prisma.property.findFirst({
          where: {
            id: refund.payment.reservation.propertyId,
            OR: [{ userId }, { users: { some: { id: userId } } }],
          },
        });

        if (!hasAccess && refund.userId !== userId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // 5. If refund has Stripe transaction ID, get latest status
        let latestStatus = refund.status;
        if (refund.transactionId) {
          try {
            const stripe = stripeService;
            const stripeRefund = await stripe
              .getStripe()
              .refunds.retrieve(refund.transactionId);
            latestStatus = stripeRefund.status;
          } catch (error) {
            logger.info("[Refund] Could not fetch Stripe status:", error);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            refundId: refund.id,
            paymentId: refund.paymentId,
            amount: refund.amount,
            status: latestStatus,
            reason: refund.reason,
            transactionId: refund.transactionId,
            processedAt: refund.processedAt,
            createdAt: refund.createdAt,
          },
        });
      } catch (error) {
        return handleApiError(error, {
          route: "/api/refunds",
          method: "GET",
        });
      }
    },
    "/api/refunds",
  );
}
