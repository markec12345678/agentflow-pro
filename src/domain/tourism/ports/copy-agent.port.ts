/**
 * Port: Guest-facing answer generation (Copy Agent)
 */

import type { RetrievalContext } from "./guest-retrieval.port";
import type { PolicyCheckResult } from "./policy-agent.port";

export interface CopyAgentInput {
  question: string;
  retrievalContext: RetrievalContext;
  fallbackFaqAnswer?: string;
  policyResult?: PolicyCheckResult | null;
  language?: string;
  apiKey?: string;
}

export interface CopyAgentOutput {
  answer: string;
  confidence: number;
}

export interface IGuestCopyAgent {
  run(input: CopyAgentInput): Promise<CopyAgentOutput>;
}
