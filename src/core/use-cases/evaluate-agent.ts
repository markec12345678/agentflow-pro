/**
 * Use Case: Evaluate Agent
 * 
 * Evaluate agent performance and add feedback.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface EvaluateAgentInput {
  agentId: string
  taskId: string
  input: any
  output: any
  executionTimeMs: number
  tokenUsage: {
    input: number
    output: number
  }
}

export interface EvaluateAgentOutput {
  evaluationId: string
  score: number
  metrics: AgentMetrics
  feedback?: string
}

export interface AgentMetrics {
  accuracy: number
  efficiency: number
  helpfulness: number
  errorRate: number
  avgResponseTime: number
}

export interface AddFeedbackInput {
  evaluationId: string
  rating: number
  comment?: string
  wouldRecommend: boolean
  taskCompleted: boolean
}

export interface AddFeedbackOutput {
  success: boolean
  feedbackId: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class EvaluateAgent {
  constructor(
    private evaluationRepository: EvaluationRepository,
    private agentRepository: AgentRepository
  ) {}

  /**
   * Evaluate agent performance
   */
  async execute(input: EvaluateAgentInput): Promise<EvaluateAgentOutput> {
    const { agentId, taskId, input: userInput, output, executionTimeMs, tokenUsage } = input

    // 1. Validate agent exists
    const agent = await this.agentRepository.findById(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    // 2. Calculate metrics
    const metrics = this.calculateMetrics(output, executionTimeMs, tokenUsage)

    // 3. Calculate overall score
    const score = this.calculateScore(metrics)

    // 4. Create evaluation
    const evaluation = {
      id: this.generateId(),
      agentId,
      taskId,
      input: userInput,
      output,
      metrics,
      score,
      executionTimeMs,
      tokenUsage,
      createdAt: new Date()
    }

    // 5. Save evaluation
    await this.evaluationRepository.save(evaluation)

    return {
      evaluationId: evaluation.id,
      score,
      metrics,
      feedback: this.generateFeedback(metrics)
    }
  }

  /**
   * Add feedback to evaluation
   */
  async addFeedback(input: AddFeedbackInput): Promise<AddFeedbackOutput> {
    const { evaluationId, rating, comment, wouldRecommend, taskCompleted } = input

    // 1. Get evaluation
    const evaluation = await this.evaluationRepository.findById(evaluationId)
    if (!evaluation) {
      throw new Error('Evaluation not found')
    }

    // 2. Add feedback
    const feedback = {
      id: this.generateId(),
      evaluationId,
      rating,
      comment,
      wouldRecommend,
      taskCompleted,
      createdAt: new Date()
    }

    // 3. Save feedback
    await this.evaluationRepository.saveFeedback(feedback)

    return {
      success: true,
      feedbackId: feedback.id
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateMetrics(output: any, executionTimeMs: number, tokenUsage: any): AgentMetrics {
    // TODO: Implement metric calculation based on output quality
    return {
      accuracy: 0.85,
      efficiency: 0.90,
      helpfulness: 0.88,
      errorRate: 0.05,
      avgResponseTime: executionTimeMs
    }
  }

  private calculateScore(metrics: AgentMetrics): number {
    const weights = {
      accuracy: 0.4,
      efficiency: 0.2,
      helpfulness: 0.3,
      errorRate: 0.1
    }

    return (
      metrics.accuracy * weights.accuracy +
      metrics.efficiency * weights.efficiency +
      metrics.helpfulness * weights.helpfulness +
      (1 - metrics.errorRate) * weights.errorRate
    )
  }

  private generateFeedback(metrics: AgentMetrics): string {
    if (metrics.accuracy >= 0.9) {
      return 'Excellent performance with high accuracy'
    } else if (metrics.accuracy >= 0.7) {
      return 'Good performance, room for improvement in accuracy'
    } else {
      return 'Performance needs improvement'
    }
  }

  private generateId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface EvaluationRepository {
  findById(id: string): Promise<any | null>
  findByAgent(agentId: string): Promise<any[]>
  save(evaluation: any): Promise<void>
  saveFeedback(feedback: any): Promise<void>
  getAgentPerformance(agentId: string): Promise<any>
}

export interface AgentRepository {
  findById(id: string): Promise<any | null>
  findAll(): Promise<any[]>
}
