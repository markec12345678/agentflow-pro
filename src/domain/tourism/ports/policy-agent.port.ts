/**
 * Port: Policy check for cancellations, supplements, etc.
 */

export interface PolicyCheckInput {
  question: string;
  reservation?: {
    checkIn: string;
    checkOut: string;
    status: string;
    totalPrice?: number;
  };
  policyRules?: string[];
}

export interface PolicyCheckResult {
  allowed: boolean | null;
  reason: string;
  policyContext: string;
  isPolicyRelevant: boolean;
}

export interface IPolicyAgent {
  check(input: PolicyCheckInput): PolicyCheckResult;
}
