/**
 * AgentFlow Pro - Cost Tracking System
 * Track AI costs, API costs, infrastructure, and cost per customer/reservation
 */

import { prisma } from "@/database/schema";

export type CostService = "openai" | "anthropic" | "qdrant" | "vercel" | "neon" | "redis" | "booking_com" | "airbnb" | "expedia";

export interface CostEntry {
  id: string;
  service: CostService;
  category: "ai" | "api" | "infrastructure" | "other";
  amount: number;
  currency: string;
  propertyId?: string;
  userId?: string;
  reservationId?: string;
  metadata: {
    tokens?: number;
    runs?: number;
    storage_gb?: number;
    requests?: number;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface CostSummary {
  totalCost: number;
  byService: Record<CostService, number>;
  byCategory: Record<"ai" | "api" | "infrastructure" | "other", number>;
  byProperty: Record<string, number>;
  costPerReservation: number;
  costPerCustomer: number;
  marginPercent: number;
}

/**
 * Track AI cost
 */
export async function trackAICost(data: {
  service: "openai" | "anthropic";
  tokens: number;
  cost: number;
  propertyId?: string;
  userId?: string;
  runId?: string;
}): Promise<CostEntry> {
  const entry = await prisma.costEntry.create({
    data: {
      service: data.service,
      category: "ai",
      amount: data.cost,
      currency: "EUR",
      propertyId: data.propertyId,
      userId: data.userId,
      metadata: {
        tokens: data.tokens,
        runId: data.runId,
      },
      timestamp: new Date(),
    },
  });

  // Check if over budget
  await checkBudgetAlert(data.propertyId, "ai");

  return entry;
}

/**
 * Track API cost
 */
export async function trackAPICost(data: {
  service: "booking_com" | "airbnb" | "expedia" | "qdrant";
  requests: number;
  cost: number;
  propertyId?: string;
  reservationId?: string;
}): Promise<CostEntry> {
  const entry = await prisma.costEntry.create({
    data: {
      service: data.service,
      category: "api",
      amount: data.cost,
      currency: "EUR",
      propertyId: data.propertyId,
      reservationId: data.reservationId,
      metadata: {
        requests: data.requests,
      },
      timestamp: new Date(),
    },
  });

  return entry;
}

/**
 * Track infrastructure cost
 */
export async function trackInfrastructureCost(data: {
  service: "vercel" | "neon" | "redis";
  amount: number;
  metadata?: Record<string, any>;
}): Promise<CostEntry> {
  const entry = await prisma.costEntry.create({
    data: {
      service: data.service,
      category: "infrastructure",
      amount: data.amount,
      currency: "EUR",
      metadata: data.metadata || {},
      timestamp: new Date(),
    },
  });

  return entry;
}

/**
 * Get cost summary for period
 */
export async function getCostSummary(
  from: Date,
  to: Date,
  propertyId?: string
): Promise<CostSummary> {
  const where: any = {
    timestamp: {
      gte: from,
      lte: to,
    },
  };

  if (propertyId) {
    where.propertyId = propertyId;
  }

  const entries = await prisma.costEntry.findMany({
    where,
  });

  const summary: CostSummary = {
    totalCost: 0,
    byService: {} as any,
    byCategory: { ai: 0, api: 0, infrastructure: 0, other: 0 },
    byProperty: {},
    costPerReservation: 0,
    costPerCustomer: 0,
    marginPercent: 0,
  };

  // Calculate totals
  for (const entry of entries) {
    summary.totalCost += entry.amount;
    
    // By service
    summary.byService[entry.service] = (summary.byService[entry.service] || 0) + entry.amount;
    
    // By category
    summary.byCategory[entry.category] = (summary.byCategory[entry.category] || 0) + entry.amount;
    
    // By property
    if (entry.propertyId) {
      summary.byProperty[entry.propertyId] = (summary.byProperty[entry.propertyId] || 0) + entry.amount;
    }
  }

  // Calculate cost per reservation
  const reservationCount = await prisma.reservation.count({
    where: {
      createdAt: {
        gte: from,
        lte: to,
      },
      ...(propertyId ? { propertyId } : {}),
    },
  });

  summary.costPerReservation = reservationCount > 0 
    ? summary.totalCost / reservationCount 
    : 0;

  // Calculate cost per customer
  const customerCount = await prisma.user.count({
    where: {
      createdAt: {
        gte: from,
        lte: to,
      },
    },
  });

  summary.costPerCustomer = customerCount > 0 
    ? summary.totalCost / customerCount 
    : 0;

  // Calculate margin (revenue - cost) / revenue
  const revenue = await prisma.payment.aggregate({
    where: {
      createdAt: {
        gte: from,
        lte: to,
      },
      ...(propertyId ? { reservation: { propertyId } } : {}),
    },
    _sum: { amount: true },
  });

  const totalRevenue = revenue._sum.amount || 0;
  summary.marginPercent = totalRevenue > 0
    ? ((totalRevenue - summary.totalCost) / totalRevenue) * 100
    : 0;

  return summary;
}

/**
 * Get cost breakdown by day
 */
export async function getCostByDay(
  from: Date,
  to: Date,
  propertyId?: string
): Promise<Array<{ date: string; cost: number; ai: number; api: number; infrastructure: number }>> {
  const where: any = {
    timestamp: {
      gte: from,
      lte: to,
    },
  };

  if (propertyId) {
    where.propertyId = propertyId;
  }

  const entries = await prisma.costEntry.findMany({
    where,
    orderBy: { timestamp: "asc" },
  });

  // Group by date
  const byDate = new Map<string, { total: number; ai: number; api: number; infrastructure: number }>();

  for (const entry of entries) {
    const date = entry.timestamp.toISOString().split("T")[0];
    const existing = byDate.get(date) || { total: 0, ai: 0, api: 0, infrastructure: 0 };

    existing.total += entry.amount;
    existing[entry.category] = (existing[entry.category] || 0) + entry.amount;

    byDate.set(date, existing);
  }

  // Convert to array
  return Array.from(byDate.entries()).map(([date, costs]) => ({
    date,
    cost: costs.total,
    ai: costs.ai,
    api: costs.api,
    infrastructure: costs.infrastructure,
  }));
}

/**
 * Check budget alerts
 */
async function checkBudgetAlert(
  propertyId: string | undefined,
  category: string
): Promise<void> {
  if (!propertyId) return;

  // Get monthly budget
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { metadata: true },
  });

  const budget = property?.metadata?.budget?.[category];
  if (!budget) return;

  // Calculate month-to-date spending
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const summary = await getCostSummary(startOfMonth, new Date(), propertyId);

  const categoryCost = summary.byCategory[category as keyof typeof summary.byCategory];
  const percentUsed = (categoryCost / budget) * 100;

  // Alert if over 80%
  if (percentUsed >= 80) {
    await prisma.alert.create({
      data: {
        propertyId,
        type: "budget_warning",
        title: `Budget Warning: ${category}`,
        message: `You've used ${percentUsed.toFixed(1)}% of your ${category} budget (€${categoryCost.toFixed(2)} of €${budget}).`,
        severity: percentUsed >= 100 ? "critical" : "warning",
      },
    });
  }
}

/**
 * Get cost forecasting
 */
export async function forecastCost(
  days: number = 30,
  propertyId?: string
): Promise<{ predictedCost: number; confidence: number }> {
  // Get last 30 days of data
  const from = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = new Date();

  const summary = await getCostSummary(from, to, propertyId);
  const dailyAverage = summary.totalCost / 30;

  // Simple linear projection
  const predictedCost = dailyAverage * days;

  // Confidence based on variance (simplified)
  const confidence = 0.85; // 85% confidence

  return {
    predictedCost,
    confidence,
  };
}
