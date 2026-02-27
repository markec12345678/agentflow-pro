/**
 * Token counting for LLM inputs/outputs (heuristic: ~4 chars per token for English)
 */

export function countTokensApprox(text: string): number {
  if (!text || text.length === 0) return 0;
  return Math.ceil(text.length / 4);
}
