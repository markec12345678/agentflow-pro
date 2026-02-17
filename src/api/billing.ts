/**
 * AgentFlow Pro - Billing API
 */

import { createCheckoutSession } from "@/stripe/checkout";
import { cancelSubscription as stripeCancel } from "@/stripe/subscription";
import { prisma } from "@/database/schema";
import type { PlanId } from "@/stripe/plans";

export async function createCheckout(
  userId: string,
  userEmail: string,
  planId: PlanId,
  baseUrl: string
): Promise<{ url: string; sessionId: string }> {
  return createCheckoutSession({
    userId,
    userEmail,
    planId,
    successUrl: `${baseUrl}/dashboard?success=true`,
    cancelUrl: `${baseUrl}/pricing?canceled=true`,
  });
}

export async function getSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });
  return sub;
}

export async function cancelSubscription(userId: string, immediately = false) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (!sub?.stripeSubscriptionId) {
    throw new Error("No active subscription");
  }
  await stripeCancel(sub.stripeSubscriptionId, immediately);
  if (immediately) {
    await prisma.subscription.update({
      where: { userId },
      data: { status: "canceled", stripeSubscriptionId: null },
    });
  }
  return { canceled: true };
}
