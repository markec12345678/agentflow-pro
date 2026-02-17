/**
 * AgentFlow Pro - Stripe configuration
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key && process.env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is required in production");
    }
    stripeInstance = new Stripe(key ?? "sk_test_placeholder");
  }
  return stripeInstance;
}
