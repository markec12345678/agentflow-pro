/**
 * AgentFlow Pro - Billing and Usage Management
 * Database models and business logic for subscription management
 */

import type Stripe from 'stripe';
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import { stripeService, PlanType, SUBSCRIPTION_PLANS, USAGE_PRICING } from './stripe';

// Database interfaces (matching Prisma schema)
export interface User {
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

export interface UsageRecord {
  id: string;
  userId: string;
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

export interface InvoiceRecord {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  amount: number; // in cents
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Usage tracking service
export class UsageService {
  private static instance: UsageService;

  static getInstance(): UsageService {
    if (!UsageService.instance) {
      UsageService.instance = new UsageService();
    }
    return UsageService.instance;
  }

  // Track agent run usage
  async trackAgentRun(userId: string): Promise<void> {
    const period = this.getCurrentPeriod();

    // This would typically update the database
    // For now, we'll simulate the tracking
    logger.info(`Tracking agent run for user ${userId} in period ${period}`);

    // Check if user is within limits
    const user = await this.getUserById(userId);
    if (user && user.plan) {
      const plan = SUBSCRIPTION_PLANS[user.plan];
      const currentUsage = await this.getCurrentUsage(userId, period);

      if (plan.limits.runsPerMonth > 0 && currentUsage.agentRuns >= plan.limits.runsPerMonth) {
        // User is over limit, calculate overage
        const overageCost = stripeService.calculateOverageCost(
          {
            agentRuns: currentUsage.agentRuns + 1,
            storageUsed: currentUsage.storageUsed,
            teamMembers: currentUsage.teamMembers
          },
          user.plan
        );

        logger.info(`User ${userId} over limit. Overage cost: ${overageCost} cents`);
      }
    }
  }

  // Track storage usage
  async trackStorageUsage(userId: string, storageUsed: number): Promise<void> {
    const period = this.getCurrentPeriod();

    logger.info(`Tracking storage usage for user ${userId}: ${storageUsed}MB in period ${period}`);

    const user = await this.getUserById(userId);
    if (user && user.plan) {
      const plan = SUBSCRIPTION_PLANS[user.plan];

      if (plan.limits.storage > 0 && storageUsed > plan.limits.storage) {
        const overageCost = stripeService.calculateOverageCost(
          {
            agentRuns: 0,
            storageUsed,
            teamMembers: 0
          },
          user.plan
        );

        logger.info(`User ${userId} storage overage cost: ${overageCost} cents`);
      }
    }
  }

  // Track team member usage
  async trackTeamMemberUsage(userId: string, teamMembers: number): Promise<void> {
    const period = this.getCurrentPeriod();

    logger.info(`Tracking team member usage for user ${userId}: ${teamMembers} members in period ${period}`);

    const user = await this.getUserById(userId);
    if (user && user.plan) {
      const plan = SUBSCRIPTION_PLANS[user.plan];

      if (plan.limits.teamMembers > 0 && teamMembers > plan.limits.teamMembers) {
        const overageCost = stripeService.calculateOverageCost(
          {
            agentRuns: 0,
            storageUsed: 0,
            teamMembers
          },
          user.plan
        );

        logger.info(`User ${userId} team member overage cost: ${overageCost} cents`);
      }
    }
  }

  // Get current usage for a user
  async getCurrentUsage(userId: string, period: string): Promise<UsageRecord> {
    const [periodStart, periodEnd] = this.parsePeriod(period);

    const [agentRuns, blogPosts, contentCount, teamMembersCount] = await Promise.all([
      prisma.agentRun.count({
        where: {
          userId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      prisma.blogPost.count({ where: { userId } }),
      prisma.contentHistory.count({ where: { userId } }),
      this.countTeamMembersForUser(userId),
    ]);

    // Storage estimate: ~50KB per blog post, ~20KB per content history item
    const storageUsed = Math.round((blogPosts * 50 + contentCount * 20) / 1024); // MB

    return {
      id: `usage_${userId}_${period}`,
      userId,
      period,
      agentRuns,
      storageUsed,
      teamMembers: teamMembersCount,
      overageRuns: 0,
      overageStorage: 0,
      overageTeamMembers: 0,
      totalCost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private parsePeriod(period: string): [Date, Date] {
    const [y, m] = period.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m ?? 12, 0, 23, 59, 59, 999);
    return [start, end];
  }

  private async countTeamMembersForUser(userId: string): Promise<number> {
    const teams = await prisma.team.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (teams.length === 0) return 0;
    return prisma.teamMember.count({
      where: { teamId: { in: teams.map((t) => t.id) } },
    });
  }

  // Get usage history for a user
  async getUsageHistory(userId: string, months: number = 6): Promise<UsageRecord[]> {
    const history: UsageRecord[] = [];
    const currentDate = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = this.formatPeriod(date);

      const usage = await this.getCurrentUsage(userId, period);
      history.push(usage);
    }

    return history;
  }

  // Generate monthly invoice
  async generateMonthlyInvoice(userId: string): Promise<void> {
    const period = this.getCurrentPeriod();
    const usage = await this.getCurrentUsage(userId, period);
    const user = await this.getUserById(userId);

    if (!user || !user.stripeCustomerId) {
      throw new Error('User not found or no Stripe customer ID');
    }

    // Calculate overage costs
    const overageCost = stripeService.calculateOverageCost(
      {
        agentRuns: usage.agentRuns,
        storageUsed: usage.storageUsed,
        teamMembers: usage.teamMembers
      },
      user.plan!
    );

    if (overageCost > 0) {
      // Create invoice for overage
      const invoice = await stripeService.createInvoice(
        user.stripeCustomerId,
        `Overage charges for ${period}`
      );

      // Add overage line items
      if (usage.overageRuns > 0) {
        await stripeService.createUsageRecord(
          'subscription_item_id', // This would come from the subscription
          usage.overageRuns * USAGE_PRICING.agent_run
        );
      }

      // Finalize and send invoice
      await stripeService.finalizeInvoice(invoice.id);

      logger.info(`Generated overage invoice for user ${userId}: ${overageCost} cents`);
    }
  }

  // Check if user can perform action
  async canPerformAction(userId: string, action: 'agent_run' | 'storage' | 'team_member'): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user || !user.plan) {
      return false;
    }

    const plan = SUBSCRIPTION_PLANS[user.plan];
    const currentUsage = await this.getCurrentUsage(userId, this.getCurrentPeriod());

    switch (action) {
      case 'agent_run':
        return plan.limits.runsPerMonth <= 0 || currentUsage.agentRuns < plan.limits.runsPerMonth;

      case 'storage':
        return plan.limits.storage <= 0 || currentUsage.storageUsed < plan.limits.storage;

      case 'team_member':
        return plan.limits.teamMembers <= 0 || currentUsage.teamMembers < plan.limits.teamMembers;

      default:
        return false;
    }
  }

  // Get usage statistics
  async getUsageStats(userId: string): Promise<{
    currentPeriod: string;
    agentRuns: { used: number; limit: number; percentage: number };
    storage: { used: number; limit: number; percentage: number };
    teamMembers: { used: number; limit: number; percentage: number };
    overageCost: number;
  }> {
    const user = await this.getUserById(userId);
    if (!user || !user.plan) {
      throw new Error('User not found or no plan');
    }

    const plan = SUBSCRIPTION_PLANS[user.plan];
    const currentUsage = await this.getCurrentUsage(userId, this.getCurrentPeriod());

    const stats = {
      currentPeriod: this.getCurrentPeriod(),
      agentRuns: {
        used: currentUsage.agentRuns,
        limit: plan.limits.runsPerMonth,
        percentage: plan.limits.runsPerMonth > 0
          ? (currentUsage.agentRuns / plan.limits.runsPerMonth) * 100
          : 0
      },
      storage: {
        used: currentUsage.storageUsed,
        limit: plan.limits.storage,
        percentage: plan.limits.storage > 0
          ? (currentUsage.storageUsed / plan.limits.storage) * 100
          : 0
      },
      teamMembers: {
        used: currentUsage.teamMembers,
        limit: plan.limits.teamMembers,
        percentage: plan.limits.teamMembers > 0
          ? (currentUsage.teamMembers / plan.limits.teamMembers) * 100
          : 0
      },
      overageCost: stripeService.calculateOverageCost(
        {
          agentRuns: currentUsage.agentRuns,
          storageUsed: currentUsage.storageUsed,
          teamMembers: currentUsage.teamMembers
        },
        user.plan
      )
    };

    return stats;
  }

  // Helper methods
  private getCurrentPeriod(): string {
    return this.formatPeriod(new Date());
  }

  private formatPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) return null;

    const sub = user.subscription;
    const planId = sub?.planId ?? "starter";
    const planKey =
      planId in SUBSCRIPTION_PLANS ? (planId as PlanType) : ("starter" as PlanType);

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      stripeCustomerId: sub?.stripeCustomerId ?? undefined,
      plan: planKey as PlanType,
      subscriptionId: sub?.stripeSubscriptionId ?? undefined,
      status: (sub?.status ?? "active") as User["status"],
      currentPeriodEnd: sub?.currentPeriodEnd ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Billing service for managing subscriptions and payments
export class BillingService {
  private static instance: BillingService;

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  // Create or get Stripe customer
  async getOrCreateCustomer(email: string, name: string): Promise<Stripe.Customer> {
    // This would typically check if customer exists in database
    // For now, always create new customer
    return await stripeService.createCustomer(email, name);
  }

  // Create subscription
  async createSubscription(
    email: string,
    name: string,
    planId: PlanType,
    trialPeriodDays?: number
  ): Promise<{
    subscription: Stripe.Subscription;
    customer: Stripe.Customer;
  }> {
    const customer = await this.getOrCreateCustomer(email, name);
    const subscription = await stripeService.createSubscription(
      customer.id,
      planId,
      trialPeriodDays
    );

    return { subscription, customer };
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, planId: PlanType): Promise<Stripe.Subscription> {
    return await stripeService.updateSubscription(subscriptionId, planId);
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, immediate = false): Promise<Stripe.Subscription> {
    return await stripeService.cancelSubscription(subscriptionId, immediate);
  }

  // Create checkout session
  async createCheckoutSession(
    stripeCustomerId: string,
    planId: PlanType,
    successUrl: string,
    cancelUrl: string,
    trialPeriodDays?: number
  ): Promise<Stripe.Checkout.Session> {
    return await stripeService.createCheckoutSession(
      stripeCustomerId,
      planId,
      successUrl,
      cancelUrl,
      trialPeriodDays
    );
  }

  // Create customer portal session
  async createCustomerPortalSession(
    stripeCustomerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return await stripeService.createCustomerPortalSession(stripeCustomerId, returnUrl);
  }

  // Get subscription status
  async getSubscriptionStatus(subscriptionId: string): Promise<{
    status: string;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    canceledAt?: Date;
  }> {
    const subscription = await stripeService.getSubscription(subscriptionId);

    return {
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
      trialEnd: (subscription as { trial_end?: number }).trial_end ? new Date((subscription as unknown as { trial_end: number }).trial_end * 1000) : undefined,
      canceledAt: (subscription as unknown as { canceled_at?: number }).canceled_at ? new Date((subscription as unknown as { canceled_at: number }).canceled_at * 1000) : undefined
    };
  }

  // Handle webhook events
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`Subscription created: ${subscription.id}`);
    // Update database with new subscription
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`Subscription updated: ${subscription.id}`);
    // Update database with subscription changes
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`Subscription deleted: ${subscription.id}`);
    // Update database to mark subscription as canceled
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
    // Update invoice status in database
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`Invoice payment failed: ${invoice.id}`);
    // Handle failed payment (notify user, retry, etc.)
  }
}

// Export singleton instances
export const usageService = UsageService.getInstance();
export const billingService = BillingService.getInstance();
