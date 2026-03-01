/**
 * AgentFlow Pro - Stripe configuration
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to enable billing.");
    }
    stripeInstance = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}
