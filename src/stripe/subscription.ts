/**
 * AgentFlow Pro - Subscription management
 */

import { getStripe } from "./config";
import { getStripePriceId, type PlanId } from "./plans";

export async function upgradeSubscription(
  stripeSubscriptionId: string,
  newPlanId: PlanId
): Promise<void> {
  const stripe = getStripe();
  const priceId = getStripePriceId(newPlanId);
  if (!priceId) {
    throw new Error(`No Stripe price for plan: ${newPlanId}`);
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    throw new Error("Subscription has no line items");
  }

  await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    metadata: {
      ...subscription.metadata,
      planId: newPlanId,
    },
  });
}

export async function downgradeSubscription(
  stripeSubscriptionId: string,
  newPlanId: PlanId
): Promise<void> {
  await upgradeSubscription(stripeSubscriptionId, newPlanId);
}

export async function cancelSubscription(
  stripeSubscriptionId: string,
  immediately = false
): Promise<void> {
  const stripe = getStripe();
  if (immediately) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } else {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }
}
