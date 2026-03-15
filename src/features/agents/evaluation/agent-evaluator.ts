/**
 * AgentFlow Pro - Agent Evaluation Framework
 * Comprehensive evaluation metrics for agent performance
 */

export interface AgentEvaluation {
  evaluationId: string;
  agentId: string;
  taskId: string;
  timestamp: string;
  metrics: EvaluationMetrics;
  qualityScore: number;
  userFeedback?: UserFeedback;
  automatedMetrics: AutomatedMetrics;
  costMetrics: CostMetrics;
  overallRating: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
}

export interface EvaluationMetrics {
  accuracy: number; // 0-1
  relevance: number; // 0-1
  completeness: number; // 0-1
  timeliness: number; // 0-1 (response time)
  consistency: number; // 0-1
  helpfulness: number; // 0-1
}

export interface UserFeedback {
  rating: number; // 1-5
  comment?: string;
  wouldRecommend: boolean;
  taskCompleted: boolean;
  timeToComplete?: number; // seconds
}

export interface AutomatedMetrics {
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  executionTimeMs: number;
  retryCount: number;
  errorRate: number; // 0-1
  successRate: number; // 0-1
}

export interface CostMetrics {
  estimatedCost: number; // USD
  costPerTask: number;
  budgetUtilization: number; // 0-1
}

export interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  evaluator: 'automated' | 'llm' | 'human';
  rubric: EvaluationRubric;
}

export interface EvaluationRubric {
  excellent: string; // 90-100%
  good: string; // 70-89%
  acceptable: string; // 50-69%
  poor: string; // 20-49%
  critical: string; // 0-19%
}

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  variantA: { agentId: string; config?: any };
  variantB: { agentId: string; config?: any };
  successMetric: string;
  sampleSize: number;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'running' | 'completed' | 'stopped';
}

export interface ABTestResult {
  testId: string;
  variantAResults: { successes: number; total: number; avgScore: number };
  variantBResults: { successes: number; total: number; avgScore: number };
  statisticalSignificance: number; // p-value
  winner: 'A' | 'B' | 'tie';
  confidence: number; // 0-1
  recommendation: string;
}

export class AgentEvaluator {
  private evaluations: Map<string, AgentEvaluation> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private abTestResults: Map<string, ABTestResult> = new Map();
  private criteria: EvaluationCriteria[] = this.getDefaultCriteria();

  /**
   * Evaluate agent execution
   */
  async evaluate(
    agentId: string,
    taskId: string,
    input: any,
    output: any,
    executionTimeMs: number,
    tokenUsage: { input: number; output: number }
  ): Promise<AgentEvaluation> {
    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 1. Automated metrics
    const automatedMetrics = await this.calculateAutomatedMetrics(
      input,
      output,
      executionTimeMs,
      tokenUsage
    );

    // 2. Quality metrics (LLM-based evaluation)
    const qualityMetrics = await this.evaluateQuality(input, output, agentId);

    // 3. Cost metrics
    const costMetrics = this.calculateCostMetrics(tokenUsage);

    // 4. Calculate overall quality score
    const qualityScore = this.calculateQualityScore(qualityMetrics);

    // 5. Determine overall rating
    const overallRating = this.determineRating(qualityScore);

    const evaluation: AgentEvaluation = {
      evaluationId,
      agentId,
      taskId,
      timestamp: new Date().toISOString(),
      metrics: qualityMetrics,
      qualityScore,
      automatedMetrics,
      costMetrics,
      overallRating,
    };

    this.evaluations.set(evaluationId, evaluation);
    return evaluation;
  }

  /**
   * Add user feedback to evaluation
   */
  async addUserFeedback(
    evaluationId: string,
    feedback: UserFeedback
  ): Promise<AgentEvaluation> {
    const evaluation = this.evaluations.get(evaluationId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found`);
    }

    evaluation.userFeedback = feedback;

    // Recalculate quality score with user feedback
    if (feedback.rating) {
      const userScore = feedback.rating / 5;
      evaluation.qualityScore = (evaluation.qualityScore + userScore) / 2;
      evaluation.overallRating = this.determineRating(evaluation.qualityScore);
    }

    return evaluation;
  }

  /**
   * Start A/B test
   */
  async startABTest(config: ABTestConfig): Promise<void> {
    config.status = 'running';
    config.startDate = new Date().toISOString();
    this.abTests.set(config.testId, config);
  }

  /**
   * Record A/B test sample
   */
  async recordABTestSample(
    testId: string,
    variant: 'A' | 'B',
    success: boolean,
    score: number
  ): Promise<void> {
    // Implementation for A/B test tracking
    logger.info(`[ABTest] Recording sample for ${testId}, variant ${variant}`);
  }

  /**
   * Complete A/B test and analyze results
   */
  async completeABTest(testId: string): Promise<ABTestResult> {
    const config = this.abTests.get(testId);
    if (!config) {
      throw new Error(`AB test ${testId} not found`);
    }

    // Mock results - in production, calculate from actual samples
    const result: ABTestResult = {
      testId,
      variantAResults: { successes: 0, total: 0, avgScore: 0 },
      variantBResults: { successes: 0, total: 0, avgScore: 0 },
      statisticalSignificance: 0.05,
      winner: 'tie',
      confidence: 0.5,
      recommendation: 'Insufficient data to determine winner',
    };

    config.status = 'completed';
    config.endDate = new Date().toISOString();
    this.abTestResults.set(testId, result);

    return result;
  }

  /**
   * Get agent performance history
   */
  getAgentPerformance(agentId: string, limit: number = 100): {
    avgQualityScore: number;
    avgExecutionTime: number;
    successRate: number;
    totalEvaluations: number;
    trend: 'improving' | 'stable' | 'declining';
  } {
    const agentEvals = Array.from(this.evaluations.values())
      .filter(e => e.agentId === agentId)
      .slice(-limit);

    if (agentEvals.length === 0) {
      return {
        avgQualityScore: 0,
        avgExecutionTime: 0,
        successRate: 0,
        totalEvaluations: 0,
        trend: 'stable',
      };
    }

    const avgQualityScore =
      agentEvals.reduce((sum, e) => sum + e.qualityScore, 0) / agentEvals.length;
    const avgExecutionTime =
      agentEvals.reduce((sum, e) => sum + e.automatedMetrics.executionTimeMs, 0) /
      agentEvals.length;
    const successRate =
      agentEvals.filter(e => e.overallRating !== 'poor' && e.overallRating !== 'critical')
        .length / agentEvals.length;

    // Calculate trend
    const trend = this.calculateTrend(agentEvals);

    return {
      avgQualityScore: Math.round(avgQualityScore * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime),
      successRate: Math.round(successRate * 100) / 100,
      totalEvaluations: agentEvals.length,
      trend,
    };
  }

  /**
   * Get evaluation report
   */
  getEvaluationReport(agentId?: string): {
    totalEvaluations: number;
    avgQualityScore: number;
    ratingDistribution: Record<string, number>;
    topPerformers: string[];
    needsImprovement: string[];
  } {
    const evaluations = agentId
      ? Array.from(this.evaluations.values()).filter(e => e.agentId === agentId)
      : Array.from(this.evaluations.values());

    const ratingDistribution: Record<string, number> = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0,
      critical: 0,
    };

    const agentScores: Map<string, number[]> = new Map();

    for (const evaluation of evaluations) {
      ratingDistribution[evaluation.overallRating]++;

      if (!agentScores.has(evaluation.agentId)) {
        agentScores.set(evaluation.agentId, []);
      }
      agentScores.get(evaluation.agentId)!.push(evaluation.qualityScore);
    }

    const avgQualityScore =
      evaluations.reduce((sum, e) => sum + e.qualityScore, 0) /
      Math.max(1, evaluations.length);

    // Calculate agent averages
    const agentAverages = Array.from(agentScores.entries()).map(([id, scores]) => ({
      agentId: id,
      avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    }));

    // Sort by performance
    agentAverages.sort((a, b) => b.avgScore - a.avgScore);

    const topPerformers = agentAverages.slice(0, 3).map(a => a.agentId);
    const needsImprovement = agentAverages
      .slice(-3)
      .reverse()
      .map(a => a.agentId);

    return {
      totalEvaluations: evaluations.length,
      avgQualityScore: Math.round(avgQualityScore * 100) / 100,
      ratingDistribution,
      topPerformers,
      needsImprovement,
    };
  }

  /**
   * Calculate automated metrics
   */
  private async calculateAutomatedMetrics(
    input: any,
    output: any,
    executionTimeMs: number,
    tokenUsage: { input: number; output: number }
  ): Promise<AutomatedMetrics> {
    return {
      tokenUsage: {
        input: tokenUsage.input,
        output: tokenUsage.output,
        total: tokenUsage.input + tokenUsage.output,
      },
      executionTimeMs,
      retryCount: 0, // Would track from actual execution
      errorRate: 0, // Would calculate from error history
      successRate: 1, // Would calculate from success history
    };
  }

  /**
   * Evaluate quality using LLM
   */
  private async evaluateQuality(
    input: any,
    output: any,
    agentId: string
  ): Promise<EvaluationMetrics> {
    // In production, use LLM to evaluate output quality
    // For now, use heuristic-based evaluation

    const inputStr = JSON.stringify(input);
    const outputStr = JSON.stringify(output);

    // Accuracy: Does output address input?
    const accuracy = this.calculateRelevance(inputStr, outputStr);

    // Relevance: Is output on-topic?
    const relevance = accuracy; // Simplified

    // Completeness: Is output detailed enough?
    const completeness = Math.min(1, outputStr.length / Math.max(100, inputStr.length));

    // Timeliness: Based on execution time (would be passed in)
    const timeliness = 0.9; // Placeholder

    // Consistency: Would compare with historical outputs
    const consistency = 0.95; // Placeholder

    // Helpfulness: Would use LLM evaluation
    const helpfulness = accuracy;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      relevance: Math.round(relevance * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      timeliness,
      consistency,
      helpfulness: Math.round(helpfulness * 100) / 100,
    };
  }

  /**
   * Calculate cost metrics
   */
  private calculateCostMetrics(tokenUsage: { input: number; output: number }): CostMetrics {
    // Simplified cost calculation (would use actual pricing)
    const inputCost = tokenUsage.input * 0.00000015; // $0.15 per 1M tokens
    const outputCost = tokenUsage.output * 0.0000006; // $0.60 per 1M tokens
    const estimatedCost = inputCost + outputCost;

    return {
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      costPerTask: estimatedCost,
      budgetUtilization: 0, // Would calculate against budget
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(metrics: EvaluationMetrics): number {
    const weights = {
      accuracy: 0.3,
      relevance: 0.2,
      completeness: 0.15,
      timeliness: 0.15,
      consistency: 0.1,
      helpfulness: 0.1,
    };

    const score =
      metrics.accuracy * weights.accuracy +
      metrics.relevance * weights.relevance +
      metrics.completeness * weights.completeness +
      metrics.timeliness * weights.timeliness +
      metrics.consistency * weights.consistency +
      metrics.helpfulness * weights.helpfulness;

    return Math.round(score * 100) / 100;
  }

  /**
   * Determine overall rating from score
   */
  private determineRating(score: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'acceptable';
    if (score >= 0.2) return 'poor';
    return 'critical';
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(evaluations: AgentEvaluation[]): 'improving' | 'stable' | 'declining' {
    if (evaluations.length < 5) return 'stable';

    const recent = evaluations.slice(-5);
    const older = evaluations.slice(-10, -5);

    const recentAvg = recent.reduce((sum, e) => sum + e.qualityScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.qualityScore, 0) / older.length;

    const change = recentAvg - olderAvg;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate relevance (simplified)
   */
  private calculateRelevance(input: string, output: string): number {
    // In production, use semantic similarity
    // For now, use simple keyword overlap
    const inputWords = new Set(input.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const outputWords = new Set(output.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    const matches = Array.from(inputWords).filter(w => outputWords.has(w)).length;
    return matches / Math.max(1, inputWords.size);
  }

  /**
   * Get default evaluation criteria
   */
  private getDefaultCriteria(): EvaluationCriteria[] {
    return [
      {
        name: 'Task Completion',
        description: 'Does the agent complete the requested task?',
        weight: 0.3,
        evaluator: 'automated',
        rubric: {
          excellent: 'Task completed perfectly with all requirements met',
          good: 'Task completed with minor issues',
          acceptable: 'Task partially completed',
          poor: 'Task attempted but mostly failed',
          critical: 'Task not completed at all',
        },
      },
      {
        name: 'Output Quality',
        description: 'Is the output accurate, relevant, and well-formatted?',
        weight: 0.25,
        evaluator: 'llm',
        rubric: {
          excellent: 'Output is accurate, relevant, and perfectly formatted',
          good: 'Output is mostly accurate with minor formatting issues',
          acceptable: 'Output has some accuracy or relevance issues',
          poor: 'Output has significant quality issues',
          critical: 'Output is incorrect or irrelevant',
        },
      },
      {
        name: 'Response Time',
        description: 'How quickly does the agent respond?',
        weight: 0.15,
        evaluator: 'automated',
        rubric: {
          excellent: '< 1 second',
          good: '1-3 seconds',
          acceptable: '3-10 seconds',
          poor: '10-30 seconds',
          critical: '> 30 seconds',
        },
      },
      {
        name: 'Cost Efficiency',
        description: 'Is the agent cost-effective?',
        weight: 0.15,
        evaluator: 'automated',
        rubric: {
          excellent: 'Uses minimal tokens for high-quality output',
          good: 'Reasonable token usage',
          acceptable: 'Some token inefficiency',
          poor: 'High token usage for output quality',
          critical: 'Extremely inefficient token usage',
        },
      },
      {
        name: 'User Satisfaction',
        description: 'How satisfied are users with the agent?',
        weight: 0.15,
        evaluator: 'human',
        rubric: {
          excellent: 'Users consistently rate 5 stars',
          good: 'Users typically rate 4+ stars',
          acceptable: 'Users typically rate 3+ stars',
          poor: 'Users typically rate 2 stars',
          critical: 'Users consistently rate 1 star',
        },
      },
    ];
  }
}

export const agentEvaluator = new AgentEvaluator();
