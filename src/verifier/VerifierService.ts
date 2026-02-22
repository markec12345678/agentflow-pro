/**
 * AgentFlow Pro - Verifier Service
 * Validates agent output before continuing workflow
 */

import {
  validateResearchOutput,
  validateContentOutput,
  validateCodeOutput,
  validateDeployOutput,
} from "./schemas";

export interface VerifyResult {
  valid: boolean;
  errors?: string[];
}

const validators: Record<string, (output: unknown) => string[]> = {
  research: validateResearchOutput,
  content: validateContentOutput,
  code: validateCodeOutput,
  deploy: validateDeployOutput,
};

export function verify(
  agentType: string,
  output: unknown,
  _expectedSchema?: unknown
): VerifyResult {
  const fn = validators[agentType];
  if (!fn) {
    return { valid: true };
  }
  const errors = fn(output);
  if (errors.length === 0) {
    return { valid: true };
  }
  return { valid: false, errors };
}
