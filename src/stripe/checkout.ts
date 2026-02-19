/**
 * AgentFlow Pro - Stripe checkout session
 */

import { getStripe } from "./config";
import { getStripePriceId, type PlanId } from "./plans";

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planId: PlanId;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  const priceId = getStripePriceId(params.planId);

  if (!priceId) {
    throw new Error(`No Stripe price configured for plan: ${params.planId}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      planId: params.planId,
    },
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        userId: params.userId,
        planId: params.planId,
      },
    },
  });

  const url = session.url;
  if (!url) {
    throw new Error("Stripe checkout session has no URL");
  }

  return { url, sessionId: session.id };
}
