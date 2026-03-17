/**
 * BudgetManager - Cost control and budget thresholds
 * 
 * Provides:
 * - Real-time budget tracking
 * - 80%/95% threshold warnings
 * - Auto model switching
 * - Usage analytics
 * 
 * Based on research showing budget control
 * prevents cost overruns and optimizes spending
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface BudgetManager {
  checkBudget(userId: string, estimatedCost: number): Promise<BudgetStatus>;
  getUserBudget(userId: string): Promise<UserBudget>;
  setBudget(userId: string, budget: UserBudgetInput): Promise<void>;
  getUsage(userId: string, period?: DateRange): Promise<UsageStats>;
  getModelRecommendation(userId: string): Promise<ModelRecommendation>;
}

export interface UserBudget {
  userId: string;
  monthlyBudget: number; // USD
  warningThreshold: number; // Percentage (default: 80)
  criticalThreshold: number; // Percentage (default: 95)
  autoSwitchModel: boolean;
  preferredModel: string;
  fallbackModel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBudgetInput {
  monthlyBudget: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  autoSwitchModel?: boolean;
  preferredModel?: string;
  fallbackModel?: string;
}

export interface BudgetStatus {
  status: 'OK' | 'WARNING' | 'CRITICAL';
  percentageUsed: number;
  remainingBudget: number;
  action: 'CONTINUE' | 'NOTIFY_USER' | 'SWITCH_MODEL' | 'STOP';
  message: string;
  recommendedModel?: string;
}

export interface UsageStats {
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  avgCostPerRequest: number;
  projectedMonthlyCost: number;
  daysRemaining: number;
}

export interface ModelRecommendation {
  currentModel: string;
  recommendedModel: string;
  reason: string;
  estimatedSavings: number; // USD per month
  performanceImpact: 'none' | 'low' | 'medium' | 'high';
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

// ============================================================================
// BUDGET MANAGER IMPLEMENTATION
// ============================================================================

export class BudgetManagerImpl implements BudgetManager {
  private prisma: PrismaClient;
  private budgetCache = new Map<string, { budget: UserBudget; timestamp: number }>();
  private cacheTTL = 60000; // 1 minute

  constructor() {
    this.prisma = new PrismaClient();
    console.log('[BudgetManager] Initialized');
  }

  // ============================================================================
  // CORE BUDGET OPERATIONS
  // ============================================================================

  /**
   * Check budget status for a user
   * Returns recommended action based on usage
   */
  async checkBudget(
    userId: string,
    estimatedCost: number
  ): Promise<BudgetStatus> {
    try {
      const budget = await this.getUserBudget(userId);
      const usage = await this.getUsage(userId);

      const projectedTotal = usage.totalCost + estimatedCost;
      const percentageUsed = (projectedTotal / budget.monthlyBudget) * 100;
      const remainingBudget = budget.monthlyBudget - projectedTotal;

      // Determine status and action
      if (percentageUsed >= budget.criticalThreshold) {
        return {
          status: 'CRITICAL',
          percentageUsed,
          remainingBudget,
          action: budget.autoSwitchModel ? 'SWITCH_MODEL' : 'STOP',
          message: `Critical: ${percentageUsed.toFixed(1)}% of budget used. Only $${remainingBudget.toFixed(2)} remaining.`,
          recommendedModel: budget.autoSwitchModel ? budget.fallbackModel : undefined,
        };
      }

      if (percentageUsed >= budget.warningThreshold) {
        return {
          status: 'WARNING',
          percentageUsed,
          remainingBudget,
          action: 'NOTIFY_USER',
          message: `Warning: ${percentageUsed.toFixed(1)}% of budget used. $${remainingBudget.toFixed(2)} remaining.`,
        };
      }

      return {
        status: 'OK',
        percentageUsed,
        remainingBudget,
        action: 'CONTINUE',
        message: `Budget OK: ${percentageUsed.toFixed(1)}% used. $${remainingBudget.toFixed(2)} remaining.`,
      };
    } catch (error) {
      console.error('[BudgetManager] Budget check failed:', error);
      
      // Fail open - allow request but log error
      return {
        status: 'OK',
        percentageUsed: 0,
        remainingBudget: 0,
        action: 'CONTINUE',
        message: 'Budget check unavailable, proceeding with request',
      };
    }
  }

  /**
   * Get user budget configuration
   */
  async getUserBudget(userId: string): Promise<UserBudget> {
    // Check cache first
    const cached = this.budgetCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.budget;
    }

    try {
      // Try to get from database
      let budget = await this.prisma.userBudget.findUnique({
        where: { userId },
      });

      // Create default budget if not exists
      if (!budget) {
        budget = await this.prisma.userBudget.create({
          data: {
            userId,
            monthlyBudget: 100, // Default $100/month
            warningThreshold: 80,
            criticalThreshold: 95,
            autoSwitchModel: true,
            preferredModel: 'gpt-4',
            fallbackModel: 'gpt-3.5-turbo',
          },
        });
      }

      const userBudget: UserBudget = {
        userId: budget.userId,
        monthlyBudget: budget.monthlyBudget,
        warningThreshold: budget.warningThreshold,
        criticalThreshold: budget.criticalThreshold,
        autoSwitchModel: budget.autoSwitchModel,
        preferredModel: budget.preferredModel,
        fallbackModel: budget.fallbackModel,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };

      // Update cache
      this.budgetCache.set(userId, {
        budget: userBudget,
        timestamp: Date.now(),
      });

      return userBudget;
    } catch (error) {
      console.error('[BudgetManager] Failed to get budget:', error);
      
      // Return default budget
      return {
        userId,
        monthlyBudget: 100,
        warningThreshold: 80,
        criticalThreshold: 95,
        autoSwitchModel: true,
        preferredModel: 'gpt-4',
        fallbackModel: 'gpt-3.5-turbo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Set or update user budget
   */
  async setBudget(userId: string, budget: UserBudgetInput): Promise<void> {
    try {
      await this.prisma.userBudget.upsert({
        where: { userId },
        create: {
          userId,
          monthlyBudget: budget.monthlyBudget,
          warningThreshold: budget.warningThreshold || 80,
          criticalThreshold: budget.criticalThreshold || 95,
          autoSwitchModel: budget.autoSwitchModel ?? true,
          preferredModel: budget.preferredModel || 'gpt-4',
          fallbackModel: budget.fallbackModel || 'gpt-3.5-turbo',
        },
        update: {
          monthlyBudget: budget.monthlyBudget,
          warningThreshold: budget.warningThreshold,
          criticalThreshold: budget.criticalThreshold,
          autoSwitchModel: budget.autoSwitchModel,
          preferredModel: budget.preferredModel,
          fallbackModel: budget.fallbackModel,
        },
      });

      // Invalidate cache
      this.budgetCache.delete(userId);

      console.log('[BudgetManager] Set budget for user:', userId);
    } catch (error) {
      console.error('[BudgetManager] Failed to set budget:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUsage(userId: string, period?: DateRange): Promise<UsageStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const startDate = period?.start || startOfMonth;
      const endDate = period?.end || now;

      // Get usage from database
      const usage = await this.prisma.agentRun.aggregate({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          costEst: true,
        },
        _count: true,
      });

      const totalCost = usage._sum.costEst || 0;
      const totalTokens = (usage._sum.inputTokens || 0) + (usage._sum.outputTokens || 0);
      const requestCount = usage._count;

      // Calculate projections
      const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - daysElapsed;
      
      const projectedMonthlyCost = daysElapsed > 0
        ? (totalCost / daysElapsed) * daysInMonth
        : totalCost;

      return {
        totalCost,
        totalTokens,
        inputTokens: usage._sum.inputTokens || 0,
        outputTokens: usage._sum.outputTokens || 0,
        requestCount,
        avgCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
        projectedMonthlyCost,
        daysRemaining,
      };
    } catch (error) {
      console.error('[BudgetManager] Failed to get usage:', error);
      
      return {
        totalCost: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0,
        avgCostPerRequest: 0,
        projectedMonthlyCost: 0,
        daysRemaining: 0,
      };
    }
  }

  /**
   * Get model recommendation based on budget
   */
  async getModelRecommendation(userId: string): Promise<ModelRecommendation> {
    try {
      const budget = await this.getUserBudget(userId);
      const usage = await this.getUsage(userId);

      const currentModel = budget.preferredModel;
      let recommendedModel = currentModel;
      let reason = 'Current model is appropriate for budget';
      let estimatedSavings = 0;
      let performanceImpact: 'none' | 'low' | 'medium' | 'high' = 'none';

      // Check if user is over budget
      const percentageUsed = (usage.totalCost / budget.monthlyBudget) * 100;

      if (percentageUsed >= budget.criticalThreshold) {
        // Recommend cheaper model
        if (currentModel.includes('gpt-4')) {
          recommendedModel = budget.fallbackModel;
          reason = `Critical budget: ${percentageUsed.toFixed(1)}% used. Switch to cheaper model.`;
          estimatedSavings = usage.projectedMonthlyCost * 0.7; // GPT-3.5 is ~70% cheaper
          performanceImpact = 'medium';
        } else if (currentModel.includes('claude-3')) {
          recommendedModel = 'claude-3-haiku';
          reason = `Critical budget: ${percentageUsed.toFixed(1)}% used. Switch to Haiku.`;
          estimatedSavings = usage.projectedMonthlyCost * 0.5;
          performanceImpact = 'low';
        }
      } else if (percentageUsed >= budget.warningThreshold) {
        // Warn about approaching budget
        reason = `Warning: ${percentageUsed.toFixed(1)}% used. Consider optimizing usage.`;
      }

      return {
        currentModel,
        recommendedModel,
        reason,
        estimatedSavings,
        performanceImpact,
      };
    } catch (error) {
      console.error('[BudgetManager] Failed to get model recommendation:', error);
      
      return {
        currentModel: 'gpt-4',
        recommendedModel: 'gpt-4',
        reason: 'Unable to analyze budget',
        estimatedSavings: 0,
        performanceImpact: 'none',
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Record usage for a request
   */
  async recordUsage(
    userId: string,
    inputTokens: number,
    outputTokens: number,
    cost: number,
    model?: string
  ): Promise<void> {
    try {
      await this.prisma.agentRun.create({
        data: {
          userId,
          inputTokens,
          outputTokens,
          costEst: cost,
          model: model || 'gpt-4',
          status: 'completed',
        },
      });
    } catch (error) {
      console.error('[BudgetManager] Failed to record usage:', error);
    }
  }

  /**
   * Clear budget cache
   */
  clearCache(): void {
    this.budgetCache.clear();
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let budgetManagerInstance: BudgetManagerImpl | null = null;

export const getBudgetManager = (): BudgetManager => {
  if (!budgetManagerInstance) {
    budgetManagerInstance = new BudgetManagerImpl();
  }
  return budgetManagerInstance;
};

export default BudgetManagerImpl;
