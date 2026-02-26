/**
 * AgentFlow Pro - Human-in-the-loop (HITL) helpers
 * Confidence estimation and escalation for chat flow
 */

import type { AIMessageType } from "@/lib/guest-communication";
import { AI_MESSAGE_TYPES } from "@/lib/guest-communication";

const CONFIDENCE_THRESHOLD = 0.9;

/** Uncertainty phrases that lower confidence */
const UNCERTAINTY_PHRASES = [
  "nisem prepričan",
  "nisem prepričana",
  "ne vem",
  "morda",
  "verjetno",
  "mogoče",
  "i'm not sure",
  "i don't know",
  "perhaps",
  "maybe",
  "could be",
  "might be",
  "unclear",
  "neznano",
  "težko reči",
];

/** Sensitive topic keywords that may require human review */
const SENSITIVE_TOPICS = [
  "pritožba",
  "reklamacija",
  "odškodnina",
  "odpoved",
  "povračilo",
  "complaint",
  "refund",
  "cancellation",
  "compensation",
  "legal",
  "pravni",
];

/**
 * Heuristic estimate of response confidence (0-1).
 * Used to trigger escalation when below CONFIDENCE_THRESHOLD.
 */
export function estimateConfidence(text: string): number {
  if (!text || text.length < 20) return 0.6;

  let score = 0.9;
  const lower = text.toLowerCase();

  // Short responses are less reliable
  if (text.length < 80) score -= 0.1;

  // Uncertainty phrases reduce confidence
  for (const phrase of UNCERTAINTY_PHRASES) {
    if (lower.includes(phrase)) {
      score -= 0.15;
      break;
    }
  }

  // Sensitive topics should go to human
  for (const topic of SENSITIVE_TOPICS) {
    if (lower.includes(topic)) {
      score -= 0.2;
      break;
    }
  }

  return Math.max(0.4, Math.min(1, score));
}

export function requiresEscalation(text: string): boolean {
  return estimateConfidence(text) < CONFIDENCE_THRESHOLD;
}

const DEFAULT_MESSAGE_TYPE: AIMessageType = "inquiry_response";

/**
 * Type-aware escalation: uses AI_MESSAGE_TYPES threshold.
 * Falls back to inquiry_response (0.85) when messageType is omitted.
 */
export function requiresEscalationForType(
  text: string,
  messageType?: AIMessageType
): boolean {
  const type = messageType ?? DEFAULT_MESSAGE_TYPE;
  const config = AI_MESSAGE_TYPES[type];
  if (!config.hitl_below) return false;
  const threshold = config.confidence_threshold;
  return estimateConfidence(text) < threshold;
}

export { CONFIDENCE_THRESHOLD };
