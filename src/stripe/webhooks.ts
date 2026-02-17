/**
 * AgentFlow Pro - Stripe webhook handlers
 */

import type Stripe from "stripe";
import { getStripe } from "./config";
import type { PlanId } from "./plans";

export type WebhookHandler = (event: Stripe.Event) => Promise<void>;

export interface WebhookHandlers {
  "checkout.session.completed": WebhookHandler;
  "customer.subscription.updated": WebhookHandler;
  "customer.subscription.deleted": WebhookHandler;
}

export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string,
  handlers: Partial<WebhookHandlers>
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_WEBHOOK_SECRET is required in production");
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    secret ?? "whsec_placeholder"
  );

  const handler = handlers[event.type as keyof WebhookHandlers];
  if (handler) {
    await handler(event);
  }

  return event;
}

export function extractSubscriptionMetadata(
  subscription: Stripe.Subscription
): { userId: string; planId: PlanId } | null {
  const meta = subscription.metadata;
  const userId = meta?.userId;
  const planId = meta?.planId as PlanId | undefined;
  if (userId && planId) {
    return { userId, planId };
  }
  return null;
}

export function extractCheckoutMetadata(
  session: Stripe.Checkout.Session
): { userId: string; planId: PlanId } | null {
  const meta = session.metadata;
  const userId = meta?.userId;
  const planId = meta?.planId as PlanId | undefined;
  if (userId && planId) {
    return { userId, planId };
  }
  return null;
}
