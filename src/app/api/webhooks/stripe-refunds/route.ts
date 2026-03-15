/**
 * Webhook: Stripe Refund Updates
 *
 * Handles Stripe webhook events for refunds
 * - charge.refunded
 * - refund.updated
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import { stripeService } from "@/lib/stripe";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe-refunds
 * Stripe webhook endpoint for refund events
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  try {
    // 1. Get webhook signature
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    // 2. Verify webhook
    const payload = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error("[Stripe Webhook] Missing webhook secret");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripeService.constructWebhookEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error: any) {
      logger.error(
        "[Stripe Webhook] Signature verification failed:",
        error.message,
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Handle refund events
    switch (event.type) {
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const refund = charge.refunds?.data[0];

        if (refund) {
          // Update refund in database
          await prisma.refund.updateMany({
            where: {
              transactionId: refund.id,
            },
            data: {
              status: refund.status,
              processedAt: new Date(refund.created * 1000),
              updatedAt: new Date(),
            },
          });

          // Update payment status
          if (charge.payment_intent) {
            const payment = await prisma.payment.findFirst({
              where: {
                transactionId: charge.payment_intent as string,
              },
            });

            if (payment) {
              const isFullRefund = refund.amount >= charge.amount;
              await prisma.payment.update({
                where: { id: payment.id },
                data: {
                  status: isFullRefund ? "refunded" : "partially_refunded",
                  updatedAt: new Date(),
                },
              });

              // Update reservation if full refund
              if (isFullRefund && payment.reservationId) {
                await prisma.reservation.update({
                  where: { id: payment.reservationId },
                  data: {
                    status: "cancelled",
                    updatedAt: new Date(),
                  },
                });
              }
            }
          }
        }

        logger.info("[Stripe Webhook] Charge refunded:", {
          chargeId: charge.id,
          refundId: refund?.id,
          amount: refund?.amount,
        });
        break;
      }

      case "refund.updated": {
        const refund = event.data.object as Stripe.Refund;

        await prisma.refund.updateMany({
          where: {
            transactionId: refund.id,
          },
          data: {
            status: refund.status,
            processedAt: new Date(refund.created * 1000),
            updatedAt: new Date(),
          },
        });

        logger.info("[Stripe Webhook] Refund updated:", {
          refundId: refund.id,
          status: refund.status,
        });
        break;
      }

      default:
        logger.info("[Stripe Webhook] Unhandled event type:", event.type);
    }

    // 4. Acknowledge webhook
    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventType: event.type,
      processedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
