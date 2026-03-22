/**
 * Analytics Tracking Helper
 * Track agent runs, content generation, user sessions, and conversions.
 */

import { prisma } from "@/database/schema";

/**
 * Track agent run with performance and cost metrics
 */
export async function trackAgentRun(data: {
  agentType: string;
  userId: string;
  status: 'success' | 'failed' | 'partial';
  duration: number;
  tokensUsed?: number;
  costUsd?: number;
  inputLength?: number;
  outputLength?: number;
  model?: string;
  metadata?: any;
  error?: string;
}) {
  try {
    await prisma.agentRun.create({
      data: {
        agentType: data.agentType,
        userId: data.userId,
        status: data.status,
        duration: data.duration,
        tokensUsed: data.tokensUsed || 0,
        costUsd: data.costUsd || 0,
        inputLength: data.inputLength || 0,
        outputLength: data.outputLength || 0,
        model: data.model,
        metadata: data.metadata,
        error: data.error,
      },
    });
  } catch (error) {
    console.error('Error tracking agent run:', error);
  }
}

/**
 * Track content generation with quality metrics
 */
export async function trackContentGeneration(data: {
  userId: string;
  contentType: string;
  wordCount?: number;
  language?: string;
  brandVoiceId?: string;
  seoScore?: number;
  qualityScore?: number;
  timeToGenerate?: number;
  tokensUsed?: number;
  costUsd?: number;
  revisions?: number;
  accepted?: boolean;
  metadata?: any;
}) {
  try {
    await prisma.contentGeneration.create({
      data: {
        userId: data.userId,
        contentType: data.contentType,
        wordCount: data.wordCount || 0,
        language: data.language || 'en',
        brandVoiceId: data.brandVoiceId,
        seoScore: data.seoScore,
        qualityScore: data.qualityScore,
        timeToGenerate: data.timeToGenerate || 0,
        tokensUsed: data.tokensUsed || 0,
        costUsd: data.costUsd || 0,
        revisions: data.revisions || 0,
        accepted: data.accepted,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Error tracking content generation:', error);
  }
}

/**
 * Track user session
 */
export async function trackUserSession(data: {
  userId: string;
  actionsCount?: number;
  pagesVisited?: string[];
  featuresUsed?: string[];
  device?: string;
  browser?: string;
  os?: string;
  ip?: string;
  country?: string;
  city?: string;
}) {
  try {
    await prisma.userSession.create({
      data: {
        userId: data.userId,
        actionsCount: data.actionsCount || 0,
        pagesVisited: data.pagesVisited || [],
        featuresUsed: data.featuresUsed || [],
        device: data.device,
        browser: data.browser,
        os: data.os,
        ip: data.ip,
        country: data.country,
        city: data.city,
      },
    });
  } catch (error) {
    console.error('Error tracking user session:', error);
  }
}

/**
 * Track conversion event
 */
export async function trackConversion(data: {
  userId?: string;
  sessionId?: string;
  funnelStage: 'visit' | 'signup' | 'activation' | 'subscription' | 'retention';
  eventType: string;
  eventName: string;
  eventValue?: number;
  metadata?: any;
}) {
  try {
    await prisma.conversionEvent.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        funnelStage: data.funnelStage,
        eventType: data.eventType,
        eventName: data.eventName,
        eventValue: data.eventValue,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

/**
 * Get agent performance analytics
 */
export async function getAgentAnalytics(options: {
  agentType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
} = {}) {
  const { agentType, userId, startDate, endDate, limit = 100 } = options;
  
  const where: any = {};
  if (agentType) where.agentType = agentType;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const runs = await prisma.agentRun.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Calculate aggregates
  const totalRuns = runs.length;
  const successRuns = runs.filter(r => r.status === 'success').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;
  const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0;
  
  const avgDuration = totalRuns > 0 
    ? runs.reduce((sum, r) => sum + r.duration, 0) / totalRuns 
    : 0;
  
  const totalCost = runs.reduce((sum, r) => sum + r.costUsd, 0);
  const totalTokens = runs.reduce((sum, r) => sum + r.tokensUsed, 0);

  return {
    totalRuns,
    successRuns,
    failedRuns,
    successRate: Math.round(successRate * 100) / 100,
    avgDuration: Math.round(avgDuration),
    totalCost: Math.round(totalCost * 100) / 100,
    totalTokens,
    runs,
  };
}

/**
 * Get content generation analytics
 */
export async function getContentAnalytics(options: {
  userId?: string;
  contentType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
} = {}) {
  const { userId, contentType, startDate, endDate, limit = 100 } = options;
  
  const where: any = {};
  if (userId) where.userId = userId;
  if (contentType) where.contentType = contentType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const generations = await prisma.contentGeneration.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Calculate aggregates
  const totalGenerations = generations.length;
  const acceptedCount = generations.filter(g => g.accepted).length;
  const acceptanceRate = totalGenerations > 0 ? (acceptedCount / totalGenerations) * 100 : 0;
  
  const avgWordCount = totalGenerations > 0
    ? generations.reduce((sum, g) => sum + g.wordCount, 0) / totalGenerations
    : 0;
  
  const avgQualityScore = generations.filter(g => g.qualityScore).length > 0
    ? generations.filter(g => g.qualityScore).reduce((sum, g) => sum + (g.qualityScore || 0), 0) / generations.filter(g => g.qualityScore).length
    : 0;
  
  const totalCost = generations.reduce((sum, g) => sum + g.costUsd, 0);

  // Group by content type
  const byContentType = generations.reduce((acc, g) => {
    acc[g.contentType] = (acc[g.contentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalGenerations,
    acceptedCount,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    avgWordCount: Math.round(avgWordCount),
    avgQualityScore: Math.round(avgQualityScore * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    byContentType,
    generations,
  };
}

/**
 * Get conversion funnel analytics
 */
export async function getConversionFunnel(options: {
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const { startDate, endDate } = options;
  
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const events = await prisma.conversionEvent.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  // Group by funnel stage
  const funnel = events.reduce((acc, event) => {
    acc[event.funnelStage] = (acc[event.funnelStage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate conversion rates
  const visitCount = funnel['visit'] || 0;
  const signupCount = funnel['signup'] || 0;
  const activationCount = funnel['activation'] || 0;
  const subscriptionCount = funnel['subscription'] || 0;

  const visitToSignupRate = visitCount > 0 ? (signupCount / visitCount) * 100 : 0;
  const signupToActivationRate = signupCount > 0 ? (activationCount / signupCount) * 100 : 0;
  const activationToSubscriptionRate = activationCount > 0 ? (subscriptionCount / activationCount) * 100 : 0;

  return {
    funnel,
    conversionRates: {
      visitToSignup: Math.round(visitToSignupRate * 100) / 100,
      signupToActivation: Math.round(signupToActivationRate * 100) / 100,
      activationToSubscription: Math.round(activationToSubscriptionRate * 100) / 100,
    },
    totalEvents: events.length,
  };
}

/**
 * Calculate ROI metrics
 */
export async function getROIMetrics(options: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const { userId, startDate, endDate } = options;
  
  const where: any = {};
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Get agent costs
  const agentRuns = await prisma.agentRun.findMany({
    where,
    select: { costUsd: true, duration: true },
  });

  // Get content generation costs
  const contentGens = await prisma.contentGeneration.findMany({
    where,
    select: { costUsd: true, wordCount: true, accepted: true },
  });

  const totalAgentCost = agentRuns.reduce((sum, r) => sum + r.costUsd, 0);
  const totalContentCost = contentGens.reduce((sum, g) => sum + g.costUsd, 0);
  const totalCost = totalAgentCost + totalContentCost;

  const totalWords = contentGens.reduce((sum, g) => sum + g.wordCount, 0);
  const acceptedContent = contentGens.filter(g => g.accepted).length;

  // Calculate time saved (assuming average human writing speed: 50 words/hour)
  const hoursSaved = totalWords / 50;
  const avgHourlyRate = 50; // $50/hour
  const timeValueSaved = hoursSaved * avgHourlyRate;

  // ROI calculation
  const roi = totalCost > 0 ? ((timeValueSaved - totalCost) / totalCost) * 100 : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    agentCost: Math.round(totalAgentCost * 100) / 100,
    contentCost: Math.round(totalContentCost * 100) / 100,
    totalWords,
    acceptedContent,
    hoursSaved: Math.round(hoursSaved * 100) / 100,
    timeValueSaved: Math.round(timeValueSaved * 100) / 100,
    roi: Math.round(roi * 100) / 100,
  };
}
