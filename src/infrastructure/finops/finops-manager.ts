/**
 * AgentFlow Pro - FinOps & Budget Tracking
 * Cost management, budget tracking, and financial optimization for AI agents
 */

export interface BudgetConfig {
  budgetId: string;
  name: string;
  agentId?: string;
  workflowId?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number; // USD
  currency: string;
  alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9, 1.0]
  hardLimit: boolean; // Stop execution when budget exceeded
  createdAt: string;
  createdBy: string;
}

export interface CostRecord {
  recordId: string;
  agentId: string;
  taskId?: string;
  workflowId?: string;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number; // USD
  metadata?: {
    duration: number;
    success: boolean;
    userId?: string;
    projectId?: string;
  };
}

export interface BudgetUsage {
  budgetId: string;
  periodStart: string;
  periodEnd: string;
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  projectedOverrun: number; // Amount projected to exceed budget
  transactionCount: number;
  avgCostPerTransaction: number;
  topCostAgents: Array<{ agentId: string; cost: number }>;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  alertId: string;
  budgetId: string;
  type: 'threshold' | 'overrun' | 'anomaly' | 'forecast';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface CostForecast {
  period: string;
  predictedCost: number;
  confidence: number; // 0-1
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  type: 'optimization' | 'budget_adjustment' | 'architecture_change';
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

export interface ModelPricing {
  model: string;
  inputCostPer1M: number; // USD per 1M tokens
  outputCostPer1M: number; // USD per 1M tokens
  provider: string;
  lastUpdated: string;
}

export class FinOpsManager {
  private budgets: Map<string, BudgetConfig> = new Map();
  private costRecords: CostRecord[] = [];
  private alerts: BudgetAlert[] = [];
  private modelPricing: Map<string, ModelPricing> = new Map();
  private alertCallbacks: Array<(alert: BudgetAlert) => void> = [];

  constructor() {
    this.initializeModelPricing();
  }

  /**
   * Create budget configuration
   */
  createBudget(config: Omit<BudgetConfig, 'createdAt' | 'createdBy'>): BudgetConfig {
    const budget: BudgetConfig = {
      ...config,
      createdAt: new Date().toISOString(),
      createdBy: 'system', // Would be actual user ID
    };

    this.budgets.set(budget.budgetId, budget);
    return budget;
  }

  /**
   * Record cost transaction
   */
  async recordCost(record: Omit<CostRecord, 'recordId' | 'timestamp' | 'totalTokens' | 'cost'>): Promise<CostRecord> {
    const modelPricing = this.modelPricing.get(record.model);
    if (!modelPricing) {
      throw new Error(`Model pricing not found for ${record.model}`);
    }

    const totalTokens = record.inputTokens + record.outputTokens;
    const cost =
      (record.inputTokens / 1_000_000) * modelPricing.inputCostPer1M +
      (record.outputTokens / 1_000_000) * modelPricing.outputCostPer1M;

    const costRecord: CostRecord = {
      ...record,
      recordId: `cost_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      totalTokens,
      cost: Math.round(cost * 10000) / 10000,
    };

    this.costRecords.push(costRecord);

    // Check budget alerts
    await this.checkBudgetAlerts(costRecord);

    return costRecord;
  }

  /**
   * Get budget usage
   */
  getBudgetUsage(budgetId: string, periodStart?: string, periodEnd?: string): BudgetUsage {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    // Default to current period
    const now = new Date();
    const { start, end } = this.getPeriodDates(budget.period, now);
    periodStart = periodStart || start.toISOString();
    periodEnd = periodEnd || end.toISOString();

    // Filter records for budget
    const records = this.costRecords.filter(record => {
      const matchesBudget = !budget.agentId || record.agentId === budget.agentId;
      const matchesPeriod = record.timestamp >= periodStart && record.timestamp <= periodEnd;
      return matchesBudget && matchesPeriod;
    });

    const usedAmount = records.reduce((sum, r) => sum + r.cost, 0);
    const remainingAmount = budget.amount - usedAmount;
    const usagePercentage = (usedAmount / budget.amount) * 100;

    // Calculate projected overrun
    const daysElapsed = (now.getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24);
    const totalDays = (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24);
    const projectedCost = daysElapsed > 0 ? (usedAmount / daysElapsed) * totalDays : usedAmount;
    const projectedOverrun = Math.max(0, projectedCost - budget.amount);

    // Get top cost agents
    const agentCosts = new Map<string, number>();
    records.forEach(record => {
      agentCosts.set(record.agentId, (agentCosts.get(record.agentId) || 0) + record.cost);
    });

    const topCostAgents = Array.from(agentCosts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agentId, cost]) => ({ agentId, cost: Math.round(cost * 100) / 100 }));

    // Get alerts for this budget
    const budgetAlerts = this.alerts.filter(a => a.budgetId === budgetId && !a.acknowledged);

    return {
      budgetId,
      periodStart,
      periodEnd,
      totalBudget: budget.amount,
      usedAmount: Math.round(usedAmount * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      projectedOverrun: Math.round(projectedOverrun * 100) / 100,
      transactionCount: records.length,
      avgCostPerTransaction: Math.round((usedAmount / Math.max(1, records.length)) * 100) / 100,
      topCostAgents,
      alerts: budgetAlerts,
    };
  }

  /**
   * Check if budget allows execution
   */
  canExecute(agentId: string, estimatedCost: number): {
    allowed: boolean;
    reason?: string;
    remainingBudget?: number;
  } {
    // Find applicable budgets
    const applicableBudgets = Array.from(this.budgets.values()).filter(
      b => !b.agentId || b.agentId === agentId
    );

    if (applicableBudgets.length === 0) {
      return { allowed: true }; // No budget constraints
    }

    for (const budget of applicableBudgets) {
      const usage = this.getBudgetUsage(budget.budgetId);

      if (usage.remainingAmount < estimatedCost) {
        if (budget.hardLimit) {
          return {
            allowed: false,
            reason: `Budget exceeded for ${budget.name}`,
            remainingBudget: usage.remainingAmount,
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Get cost forecast
   */
  getCostForecast(period: 'next_week' | 'next_month' | 'next_quarter'): CostForecast {
    const recentRecords = this.costRecords.slice(-1000); // Last 1000 transactions

    if (recentRecords.length < 10) {
      return {
        period,
        predictedCost: 0,
        confidence: 0,
        trend: 'stable',
        recommendations: [],
      };
    }

    // Simple forecasting (in production, use time series analysis)
    const totalCost = recentRecords.reduce((sum, r) => sum + r.cost, 0);
    const avgCost = totalCost / recentRecords.length;

    // Calculate trend
    const firstHalf = recentRecords.slice(0, Math.floor(recentRecords.length / 2));
    const secondHalf = recentRecords.slice(Math.floor(recentRecords.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.cost, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.cost, 0) / secondHalf.length;

    const trend = secondHalfAvg > firstHalfAvg * 1.1 ? 'increasing' :
                  secondHalfAvg < firstHalfAvg * 0.9 ? 'decreasing' : 'stable';

    // Generate predictions
    const multiplier = period === 'next_week' ? 7 : period === 'next_month' ? 30 : 90;
    const predictedCost = avgCost * multiplier * (trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1);

    // Generate recommendations
    const recommendations: CostRecommendation[] = [];

    if (trend === 'increasing') {
      recommendations.push({
        type: 'optimization',
        description: 'Cost trend is increasing. Consider optimizing agent prompts to reduce token usage.',
        potentialSavings: Math.round(totalCost * 0.1 * 100) / 100,
        implementationEffort: 'low',
        priority: 'high',
      });
    }

    // Find most expensive agents
    const agentCosts = new Map<string, number>();
    recentRecords.forEach(r => {
      agentCosts.set(r.agentId, (agentCosts.get(r.agentId) || 0) + r.cost);
    });

    const topAgent = Array.from(agentCosts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topAgent && topAgent[1] > totalCost * 0.5) {
      recommendations.push({
        type: 'architecture_change',
        description: `Agent ${topAgent[0]} accounts for >50% of costs. Consider using a cheaper model for non-critical tasks.`,
        potentialSavings: Math.round(topAgent[1] * 0.3 * 100) / 100,
        implementationEffort: 'medium',
        priority: 'medium',
      });
    }

    return {
      period,
      predictedCost: Math.round(predictedCost * 100) / 100,
      confidence: 0.7, // Simplified
      trend,
      recommendations,
    };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: BudgetAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(period: 'day' | 'week' | 'month' | 'year'): {
    totalCost: number;
    totalTokens: number;
    avgCostPerToken: number;
    costByAgent: Array<{ agentId: string; cost: number; percentage: number }>;
    costByModel: Array<{ model: string; cost: number; percentage: number }>;
    costTrend: 'increasing' | 'stable' | 'decreasing';
  } {
    const now = new Date();
    const { start, end } = this.getPeriodDates(period, now);

    const periodRecords = this.costRecords.filter(
      r => r.timestamp >= start.toISOString() && r.timestamp <= end.toISOString()
    );

    const totalCost = periodRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = periodRecords.reduce((sum, r) => sum + r.totalTokens, 0);

    // Cost by agent
    const agentCosts = new Map<string, number>();
    periodRecords.forEach(r => {
      agentCosts.set(r.agentId, (agentCosts.get(r.agentId) || 0) + r.cost);
    });

    const costByAgent = Array.from(agentCosts.entries())
      .map(([agentId, cost]) => ({
        agentId,
        cost: Math.round(cost * 100) / 100,
        percentage: Math.round((cost / totalCost) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Cost by model
    const modelCosts = new Map<string, number>();
    periodRecords.forEach(r => {
      modelCosts.set(r.model, (modelCosts.get(r.model) || 0) + r.cost);
    });

    const costByModel = Array.from(modelCosts.entries())
      .map(([model, cost]) => ({
        model,
        cost: Math.round(cost * 100) / 100,
        percentage: Math.round((cost / totalCost) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Calculate trend
    const trend = this.calculateCostTrend(periodRecords);

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens,
      avgCostPerToken: Math.round((totalCost / Math.max(1, totalTokens)) * 1000000) / 1000000,
      costByAgent,
      costByModel,
      costTrend: trend,
    };
  }

  /**
   * Check budget alerts
   */
  private async checkBudgetAlerts(record: CostRecord): Promise<void> {
    const applicableBudgets = Array.from(this.budgets.values()).filter(
      b => !b.agentId || b.agentId === record.agentId
    );

    for (const budget of applicableBudgets) {
      const usage = this.getBudgetUsage(budget.budgetId);

      // Check thresholds
      for (const threshold of budget.alertThresholds) {
        const thresholdValue = budget.amount * threshold;
        if (usage.usedAmount >= thresholdValue && usage.usedAmount - record.cost < thresholdValue) {
          await this.createAlert({
            budgetId: budget.budgetId,
            type: 'threshold',
            severity: threshold >= 1.0 ? 'critical' : threshold >= 0.9 ? 'warning' : 'info',
            message: `Budget ${budget.name} has reached ${Math.round(threshold * 100)}% usage`,
            threshold: thresholdValue,
            currentValue: usage.usedAmount,
          });
        }
      }

      // Check overrun
      if (usage.projectedOverrun > 0) {
        await this.createAlert({
          budgetId: budget.budgetId,
          type: 'overrun',
          severity: 'critical',
          message: `Budget ${budget.name} is projected to exceed by $${usage.projectedOverrun}`,
          threshold: budget.amount,
          currentValue: usage.usedAmount,
        });
      }
    }
  }

  /**
   * Create alert
   */
  private async createAlert(alert: Omit<BudgetAlert, 'alertId' | 'timestamp' | 'acknowledged'>): Promise<void> {
    const newAlert: BudgetAlert = {
      ...alert,
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(newAlert);

    // Notify callbacks
    for (const callback of this.alertCallbacks) {
      await callback(newAlert);
    }
  }

  /**
   * Calculate cost trend
   */
  private calculateCostTrend(records: CostRecord[]): 'increasing' | 'stable' | 'decreasing' {
    if (records.length < 10) return 'stable';

    const sorted = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstAvg = firstHalf.reduce((sum, r) => sum + r.cost, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.cost, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  /**
   * Get period dates
   */
  private getPeriodDates(period: string, referenceDate: Date): { start: Date; end: Date } {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarterly':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth((quarter + 1) * 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Initialize model pricing
   */
  private initializeModelPricing(): void {
    const pricing: ModelPricing[] = [
      { model: 'gpt-4o', inputCostPer1M: 2.5, outputCostPer1M: 10, provider: 'OpenAI', lastUpdated: new Date().toISOString() },
      { model: 'gpt-4o-mini', inputCostPer1M: 0.15, outputCostPer1M: 0.6, provider: 'OpenAI', lastUpdated: new Date().toISOString() },
      { model: 'gpt-4-turbo', inputCostPer1M: 10, outputCostPer1M: 30, provider: 'OpenAI', lastUpdated: new Date().toISOString() },
      { model: 'gpt-3.5-turbo', inputCostPer1M: 0.5, outputCostPer1M: 1.5, provider: 'OpenAI', lastUpdated: new Date().toISOString() },
      { model: 'claude-sonnet-4.5', inputCostPer1M: 3, outputCostPer1M: 15, provider: 'Anthropic', lastUpdated: new Date().toISOString() },
      { model: 'claude-opus-4.5', inputCostPer1M: 15, outputCostPer1M: 75, provider: 'Anthropic', lastUpdated: new Date().toISOString() },
      { model: 'gemini-2.0-flash', inputCostPer1M: 0.075, outputCostPer1M: 0.3, provider: 'Google', lastUpdated: new Date().toISOString() },
    ];

    pricing.forEach(p => this.modelPricing.set(p.model, p));
  }
}

export const finOpsManager = new FinOpsManager();
