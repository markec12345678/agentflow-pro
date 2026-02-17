/**
 * AgentFlow Pro - Stripe webhook handler
 * Uses raw body for signature verification
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  handleStripeWebhook,
  extractCheckoutMetadata,
  extractSubscriptionMetadata,
} from "@/stripe/webhooks";
import { prisma } from "@/database/schema";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = await handleStripeWebhook(rawBody, signature, {
      "checkout.session.completed": async (evt) => {
        const session = evt.data.object as Stripe.Checkout.Session;
        const meta = extractCheckoutMetadata(session);
        if (!meta) return;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const customerIdRaw =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as { id?: string })?.id ?? null;
        const customerId = typeof customerIdRaw === "string" ? customerIdRaw : undefined;

        if (subscriptionId) {
          const stripe = (await import("@/stripe/config")).getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data"],
          });
          const periodEndUnix = sub.items.data[0]?.current_period_end ?? (sub as { current_period_end?: number }).current_period_end;
          const periodEnd = periodEndUnix
            ? new Date(periodEndUnix * 1000)
            : null;

          await prisma.subscription.upsert({
            where: { userId: meta.userId },
            create: {
              userId: meta.userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              planId: meta.planId,
              status: sub.status,
              currentPeriodEnd: periodEnd,
            },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              planId: meta.planId,
              status: sub.status,
              currentPeriodEnd: periodEnd,
            },
          });
        }
      },
      "customer.subscription.updated": async (evt) => {
        const subscription = evt.data.object as Stripe.Subscription;
        const meta = extractSubscriptionMetadata(subscription);
        if (!meta) return;

        const periodEndUnix = subscription.items?.data?.[0]?.current_period_end ?? (subscription as { current_period_end?: number }).current_period_end;
        const periodEnd = periodEndUnix
          ? new Date(periodEndUnix * 1000)
          : null;

        await prisma.subscription.upsert({
          where: { userId: meta.userId },
          create: {
            userId: meta.userId,
            stripeSubscriptionId: subscription.id,
            planId: meta.planId,
            status: subscription.status,
            currentPeriodEnd: periodEnd,
          },
          update: {
            planId: meta.planId,
            status: subscription.status,
            currentPeriodEnd: periodEnd,
          },
        });
      },
      "customer.subscription.deleted": async (evt) => {
        const subscription = evt.data.object as Stripe.Subscription;
        const meta = extractSubscriptionMetadata(subscription);
        if (!meta) return;

        await prisma.subscription.updateMany({
          where: { userId: meta.userId },
          data: {
            status: "canceled",
            stripeSubscriptionId: null,
          },
        });
      },
    });

    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
