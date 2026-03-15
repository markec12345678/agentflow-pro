/**
 * Infrastructure Implementation: Subscription Repository
 *
 * Implementacija SubscriptionRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { SubscriptionRepository } from "@/core/ports/repositories";

export interface SubscriptionDTO {
  id: string;
  userId: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "cancelled" | "paused" | "expired";
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionRepositoryImpl implements SubscriptionRepository {
  /**
   * Najdi subscription po ID-ju
   */
  async findById(id: string): Promise<SubscriptionDTO | null> {
    const data = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi subscription po user-ju
   */
  async findByUserId(userId: string): Promise<SubscriptionDTO | null> {
    const data = await prisma.subscription.findFirst({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse active subscriptions
   */
  async findActive(): Promise<SubscriptionDTO[]> {
    const data = await prisma.subscription.findMany({
      where: { status: "active" },
      include: {
        user: true,
      },
      orderBy: { currentPeriodEnd: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novo subscription
   */
  async create(
    subscription: Omit<SubscriptionDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<SubscriptionDTO> {
    const data = await prisma.subscription.create({
      data: {
        userId: subscription.userId,
        plan: subscription.plan,
        status: subscription.status,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        metadata: subscription.metadata,
      },
      include: {
        user: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi subscription
   */
  async update(
    id: string,
    subscription: Partial<SubscriptionDTO>,
  ): Promise<void> {
    await prisma.subscription.update({
      where: { id },
      data: {
        plan: subscription.plan,
        status: subscription.status,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        metadata: subscription.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči subscription
   */
  async cancel(id: string, atPeriodEnd?: boolean): Promise<void> {
    await prisma.subscription.update({
      where: { id },
      data: {
        status: atPeriodEnd ? "active" : "cancelled",
        cancelAtPeriodEnd: atPeriodEnd || false,
        cancelledAt: atPeriodEnd ? undefined : new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pavziraj subscription
   */
  async pause(id: string): Promise<void> {
    await prisma.subscription.update({
      where: { id },
      data: {
        status: "paused",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj subscription
   */
  async activate(id: string): Promise<void> {
    await prisma.subscription.update({
      where: { id },
      data: {
        status: "active",
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Podaljšaj trial
   */
  async extendTrial(id: string, days: number): Promise<void> {
    const subscription = await this.findById(id);

    if (!subscription || !subscription.trialEnd) {
      return;
    }

    const newTrialEnd = new Date(subscription.trialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    await this.update(id, { trialEnd: newTrialEnd });
  }

  /**
   * Pridobi statistiko subscriptions
   */
  async getStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    trialSubscriptions: number;
    subscriptionsByPlan: { [key: string]: number };
    monthlyRecurringRevenue: number;
  }> {
    const subscriptions = await prisma.subscription.findMany();

    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(
      (s) => s.status === "active",
    ).length;
    const cancelledSubscriptions = subscriptions.filter(
      (s) => s.status === "cancelled",
    ).length;
    const trialSubscriptions = subscriptions.filter(
      (s) => s.trialEnd && s.trialEnd > new Date(),
    ).length;

    const subscriptionsByPlan: { [key: string]: number } = {};
    subscriptions.forEach((s) => {
      subscriptionsByPlan[s.plan] = (subscriptionsByPlan[s.plan] || 0) + 1;
    });

    // Calculate MRR (simplified)
    const planPrices: { [key: string]: number } = {
      free: 0,
      starter: 29,
      pro: 99,
      enterprise: 299,
    };

    const monthlyRecurringRevenue = activeSubscriptions.reduce((sum, s) => {
      return sum + (planPrices[s.plan] || 0);
    }, 0);

    return {
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      trialSubscriptions,
      subscriptionsByPlan,
      monthlyRecurringRevenue,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): SubscriptionDTO {
    return {
      id: data.id,
      userId: data.userId,
      plan: data.plan as any,
      status: data.status as any,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      cancelledAt: data.cancelledAt,
      trialStart: data.trialStart,
      trialEnd: data.trialEnd,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
