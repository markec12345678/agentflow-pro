/**
 * Domain entity: AI usage log (observability / billing enrichment)
 */

export interface AiUsageLog {
  userId?: string | null;
  agentType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costEst?: number;
  latencyMs: number;
  createdAt?: Date;
}
