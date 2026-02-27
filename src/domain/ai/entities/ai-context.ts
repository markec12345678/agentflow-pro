/**
 * Domain entity: AI generation context (inputs for LLM call)
 */

import type { AiMessage } from "./ai-message";

export interface AiContext {
  systemPrompt: string;
  messages?: AiMessage[];
  /** Single prompt when not using chat format; converted to user message internally */
  prompt?: string;
  modelHint?: string;
  temperature?: number;
  maxTokens?: number;
}
