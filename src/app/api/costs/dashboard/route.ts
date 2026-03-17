/**
 * Cost Dashboard API
 * Provides cost data for the dashboard UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBudgetManager } from '../../../cost/budget-manager';
import { getSemanticCache } from '../../../cost/semantic-cache';

export interface DashboardResponse {
  budget: {
    spent: number;
    remaining: number;
    percentageUsed: number;
    status: string;
    budget: number;
    daysRemaining: number;
    recommendedDailySpend: number;
  };
  costs: {
    total: number;
    byModel: Array<{ model: string; cost: number; percentage: number }>;
    trend: Array<{ date: string; cost: number; tokens: number }>;
  };
  cache: {
    hitRate: number;
    savings: number;
    projectedMonthly: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    const userId = searchParams.get('userId') || undefined;

    const budget = getBudgetManager();
    const cache = getSemanticCache();

    // Get budget status
    const budgetStatus = await budget.getBudgetStatus(userId);

    // Generate cost report
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const report = await budget.generateReport({
      startDate,
      endDate,
      userId: userId || undefined,
    });

    // Get cache stats
    const cacheStats = await cache.getStats();
    const savingsReport = await cache.getCostSavingsReport(days);

    const response: DashboardResponse = {
      budget: {
        spent: budgetStatus.spent,
        remaining: budgetStatus.remaining,
        percentageUsed: budgetStatus.percentageUsed,
        status: budgetStatus.status,
        budget: budgetStatus.budget,
        daysRemaining: budgetStatus.daysRemaining,
        recommendedDailySpend: budgetStatus.recommendedDailySpend,
      },
      costs: {
        total: report.totalCost,
        byModel: report.byModel,
        trend: report.dailyTrend,
      },
      cache: {
        hitRate: cacheStats.hitRate,
        savings: savingsReport.totalSavings,
        projectedMonthly: savingsReport.projectedMonthlySavings,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cost dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost dashboard' },
      { status: 500 }
    );
  }
}
