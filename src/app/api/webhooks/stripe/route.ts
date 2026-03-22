/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler for payment events
 * 
 * Events handled:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 * - customer.created
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/database/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update payment record in database
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntent: paymentIntent.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "succeeded",
            paidAt: new Date(),
            stripeChargeId: paymentIntent.latest_charge as string,
            metadata: paymentIntent.metadata as any,
          },
        });

        // Update reservation status if full payment
        if (payment.type === "full_payment") {
          await prisma.reservation.updateMany({
            where: { id: payment.reservationId },
            data: {
              status: "confirmed",
            },
          });
        }

        console.log(`Payment succeeded: ${payment.id}`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntent: paymentIntent.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "failed",
            metadata: {
              ...paymentIntent.metadata,
              failure_reason: paymentIntent.last_payment_error?.message || "Unknown error",
            },
          },
        });

        console.log(`Payment failed: ${payment.id}`);
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      
      if (charge.payment_intent) {
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntent: charge.payment_intent },
        });

        if (payment) {
          const refund = charge.refunds?.data[0];
          
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "refunded",
              refundedAt: new Date(),
              refundAmount: refund?.amount ? refund.amount / 100 : payment.amount,
              metadata: {
                ...payment.metadata,
                refundId: refund?.id,
                refundReason: refund?.reason,
              },
            },
          });

          console.log(`Refund processed: ${payment.id}`);
        }
      }
      break;
    }

    case "customer.created": {
      const customer = event.data.object as Stripe.Customer;
      
      // Could save customer ID to guest record if needed
      console.log(`Customer created: ${customer.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
