/**
 * AgentFlow Pro - Stripe Monetization System
 * Complete subscription management and payment processing
 */

import Stripe from 'stripe';

// Lazy Stripe init – app runs without STRIPE_SECRET_KEY; billing routes throw when used
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to enable billing.");
    stripeInstance = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return stripeInstance;
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'price_starter_monthly',
    name: 'Starter',
    price: 3900, // $39.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '3 agents',
      '100 runs/month',
      'Basic support',
      'Tourism workflows'
    ],
    limits: {
      agents: 3,
      runsPerMonth: 100,
      storage: 1000, // MB
      teamMembers: 1
    }
  },
  pro: {
    id: 'price_pro_monthly',
    name: 'Pro',
    price: 7900, // $79.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '10 agents',
      '1000 runs/month',
      'Priority support',
      'Advanced workflows',
      'API access'
    ],
    limits: {
      agents: 10,
      runsPerMonth: 1000,
      storage: 10000, // MB
      teamMembers: 5
    }
  },
  enterprise: {
    id: 'price_enterprise_monthly',
    name: 'Enterprise',
    price: 29900, // $299.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited agents',
      'Unlimited runs',
      'Dedicated support',
      'Custom workflows',
      'Advanced API',
      'White-label options'
    ],
    limits: {
      agents: -1, // Unlimited
      runsPerMonth: -1, // Unlimited
      storage: -1, // Unlimited
      teamMembers: -1 // Unlimited
    }
  }
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

// Usage pricing for API calls
export const USAGE_PRICING = {
  agent_run: 5, // $0.05 per run (in cents)
  storage_gb: 100, // $1.00 per GB (in cents)
  team_member: 1000, // $10.00 per additional team member (in cents)
} as const;

// Customer and subscription interfaces
export interface Customer {
  id: string;
  email: string;
  name: string;
  stripeCustomerId?: string;
  plan?: PlanType;
  subscriptionId?: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: PlanType;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  stripeSubscriptionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usage {
  id: string;
  customerId: string;
  period: string; // YYYY-MM format
  agentRuns: number;
  storageUsed: number; // in MB
  teamMembers: number;
  overageRuns: number;
  overageStorage: number;
  overageTeamMembers: number;
  totalCost: number; // in cents
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  customerId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

// Stripe service class
export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Customer management
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await getStripe().customers.create({
        email,
        name,
        metadata: {
          source: 'agentflow-pro'
        }
      });
      return customer;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
    }
  }

  async getCustomer(stripeCustomerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await getStripe().customers.retrieve(stripeCustomerId);
      return customer as Stripe.Customer;
    } catch (error) {
      throw new Error(`Failed to retrieve customer: ${error}`);
    }
  }

  async updateCustomer(stripeCustomerId: string, updates: Partial<{ name: string; email: string }>): Promise<Stripe.Customer> {
    try {
      const customer = await getStripe().customers.update(stripeCustomerId, updates);
      return customer;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error}`);
    }
  }

  // Subscription management
  async createSubscription(
    stripeCustomerId: string,
    planId: PlanType,
    trialPeriodDays?: number
  ): Promise<Stripe.Subscription> {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];

      const subscription = await getStripe().subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.id }],
        trial_period_days: trialPeriodDays,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planId,
          source: 'agentflow-pro'
        }
      });

      return subscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Failed to retrieve subscription: ${error}`);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    planId: PlanType
  ): Promise<Stripe.Subscription> {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

      const updatedSubscription = await getStripe().subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: plan.id
        }],
        metadata: {
          planId,
          source: 'agentflow-pro'
        }
      });

      return updatedSubscription;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error}`);
    }
  }

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<Stripe.Subscription> {
    try {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

      if (immediate) {
        return await getStripe().subscriptions.cancel(subscriptionId);
      } else {
        return await getStripe().subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error}`);
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await getStripe().subscriptions.update(subscriptionId, {
        pause_collection: {
          behavior: 'keep_as_draft'
        }
      });
      return subscription;
    } catch (error) {
      throw new Error(`Failed to pause subscription: ${error}`);
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await getStripe().subscriptions.update(subscriptionId, {
        pause_collection: null
      });
      return subscription;
    } catch (error) {
      throw new Error(`Failed to resume subscription: ${error}`);
    }
  }

  // Payment methods
  async createPaymentMethod(
    stripeCustomerId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await getStripe().paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
      return paymentMethod;
    } catch (error) {
      throw new Error(`Failed to create payment method: ${error}`);
    }
  }

  async getPaymentMethods(stripeCustomerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await getStripe().paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });
      return paymentMethods.data;
    } catch (error) {
      throw new Error(`Failed to retrieve payment methods: ${error}`);
    }
  }

  async setDefaultPaymentMethod(
    stripeCustomerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await getStripe().customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      return customer;
    } catch (error) {
      throw new Error(`Failed to set default payment method: ${error}`);
    }
  }

  // Invoices and payments
  async createInvoice(
    stripeCustomerId: string,
    description?: string
  ): Promise<Stripe.Invoice> {
    try {
      const invoice = await getStripe().invoices.create({
        customer: stripeCustomerId,
        description,
        metadata: {
          source: 'agentflow-pro'
        }
      });
      return invoice;
    } catch (error) {
      throw new Error(`Failed to create invoice: ${error}`);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await getStripe().invoices.finalizeInvoice(invoiceId);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to finalize invoice: ${error}`);
    }
  }

  async payInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await getStripe().invoices.pay(invoiceId);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to pay invoice: ${error}`);
    }
  }

  // Usage and metering
  async createUsageRecord(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number
  ): Promise<Stripe.UsageRecord> {
    try {
      const usageRecord = await getStripe().subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );
      return usageRecord;
    } catch (error) {
      throw new Error(`Failed to create usage record: ${error}`);
    }
  }

  // Checkout sessions
  async createCheckoutSession(
    stripeCustomerId: string,
    planId: PlanType,
    successUrl: string,
    cancelUrl: string,
    trialPeriodDays?: number
  ): Promise<Stripe.Checkout.Session> {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: plan.id,
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto'
        },
        metadata: {
          planId,
          source: 'agentflow-pro'
        }
      };

      if (trialPeriodDays) {
        sessionParams.subscription_data = {
          trial_period_days: trialPeriodDays
        };
      }

      const session = await getStripe().checkout.sessions.create(sessionParams);
      return session;
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error}`);
    }
  }

  async createCustomerPortalSession(
    stripeCustomerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      throw new Error(`Failed to create customer portal session: ${error}`);
    }
  }

  // Webhook handling
  async constructWebhookEvent(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<Stripe.Event> {
    try {
      const event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }
  }

  // Utility methods
  getPlanById(planId: string): typeof SUBSCRIPTION_PLANS[PlanType] | null {
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
    return plan || null;
  }

  calculateOverageCost(usage: {
    agentRuns: number;
    storageUsed: number;
    teamMembers: number;
  }, planId: PlanType): number {
    const plan = SUBSCRIPTION_PLANS[planId];
    let totalCost = 0;

    // Calculate overage for agent runs
    if (plan.limits.runsPerMonth > 0 && usage.agentRuns > plan.limits.runsPerMonth) {
      const overageRuns = usage.agentRuns - plan.limits.runsPerMonth;
      totalCost += overageRuns * USAGE_PRICING.agent_run;
    }

    // Calculate overage for storage
    if (plan.limits.storage > 0 && usage.storageUsed > plan.limits.storage) {
      const overageStorage = Math.ceil((usage.storageUsed - plan.limits.storage) / 1024); // Convert to GB
      totalCost += overageStorage * USAGE_PRICING.storage_gb;
    }

    // Calculate overage for team members
    if (plan.limits.teamMembers > 0 && usage.teamMembers > plan.limits.teamMembers) {
      const overageTeamMembers = usage.teamMembers - plan.limits.teamMembers;
      totalCost += overageTeamMembers * USAGE_PRICING.team_member;
    }

    return totalCost;
  }

  formatPrice(cents: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toLowerCase()
    }).format(cents / 100);
  }
}

// Export singleton instance
export const stripeService = StripeService.getInstance();
