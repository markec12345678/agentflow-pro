/**
 * Cost estimation per 1K tokens (OpenAI pricing as of 2025)
 */

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
  "qwen-turbo": { input: 0.3, output: 0.6 },
};

/** Cost in USD per 1M input tokens */
const DEFAULT_INPUT = 1;
/** Cost in USD per 1M output tokens */
const DEFAULT_OUTPUT = 3;

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model] ?? { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT };
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}
