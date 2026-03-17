/**
 * Infrastructure: Adapter for IPolicyAgent using lib/tourism/policy-agent
 */

import { runPolicyAgent } from '@/lib/tourism/policy-agent';
import type {
  IPolicyAgent,
  PolicyCheckInput,
  PolicyCheckResult,
} from "@/domain/tourism/ports/policy-agent.port";

export class PolicyAgentAdapter implements IPolicyAgent {
  check(input: PolicyCheckInput): PolicyCheckResult {
    return runPolicyAgent(input);
  }
}
