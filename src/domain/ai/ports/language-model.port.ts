/**
 * Port: Language model (LLM) for text generation
 */

import type { AiContext } from "../entities/ai-context";

export interface GenerateTextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ILanguageModel {
  generateText(
    ctx: AiContext,
    options?: { abortSignal?: AbortSignal }
  ): Promise<GenerateTextResult>;
}
