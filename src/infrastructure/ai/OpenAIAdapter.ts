/**
 * Infrastructure: OpenAI-compatible LLM adapter
 */

import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { ILanguageModel, GenerateTextResult } from "@/domain/ai";
import type { AiContext } from "@/domain/ai";
import { countTokensApprox } from "./TokenCounter";

export interface OpenAIAdapterConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

export class OpenAIAdapter implements ILanguageModel {
  constructor(private config: OpenAIAdapterConfig) { }

  async generateText(
    ctx: AiContext,
    options?: { abortSignal?: AbortSignal }
  ): Promise<GenerateTextResult> {
    const openai = createOpenAI({
      apiKey: this.config.apiKey,
      ...(this.config.baseURL && { baseURL: this.config.baseURL }),
    });

    const systemPrompt = ctx.systemPrompt ?? "";
    const userContent = ctx.prompt ?? ctx.messages?.find((m) => m.role === "user")?.content ?? "";

    const startMs = Date.now();
    const result = await generateText({
      model: openai(this.config.model),
      system: systemPrompt || undefined,
      prompt: userContent,
      temperature: ctx.temperature ?? 0.6,
      maxOutputTokens: ctx.maxTokens ?? 2048,
      abortSignal: options?.abortSignal,
    });

    const text = result.text?.trim() ?? "";
    const u = result.usage as { promptTokens?: number; completionTokens?: number; inputTokens?: number; outputTokens?: number } | undefined;
    const inputTokens = u?.promptTokens ?? u?.inputTokens ?? countTokensApprox(systemPrompt + userContent);
    const outputTokens = u?.completionTokens ?? u?.outputTokens ?? countTokensApprox(text);

    return { text, inputTokens, outputTokens };
  }

  /** Structured output: returns parsed object + token counts */
  async generateObject<T>(
    prompt: string,
    outputConfig: ReturnType<typeof Output.object>,
    options?: { systemPrompt?: string; temperature?: number; abortSignal?: AbortSignal }
  ): Promise<{ object: T; text: string; inputTokens: number; outputTokens: number }> {
    const openai = createOpenAI({
      apiKey: this.config.apiKey,
      ...(this.config.baseURL && { baseURL: this.config.baseURL }),
    });

    const result = await generateText({
      model: openai(this.config.model),
      system: options?.systemPrompt,
      prompt,
      temperature: options?.temperature ?? 0.6,
      abortSignal: options?.abortSignal,
      output: outputConfig,
    });

    const text = result.text?.trim() ?? "";
    const u = result.usage as { promptTokens?: number; completionTokens?: number; inputTokens?: number; outputTokens?: number } | undefined;
    const inputTokens = u?.promptTokens ?? u?.inputTokens ?? countTokensApprox((options?.systemPrompt ?? "") + prompt);
    const outputTokens = u?.completionTokens ?? u?.outputTokens ?? countTokensApprox(text);

    return {
      object: (result as { output?: T }).output as T,
      text,
      inputTokens,
      outputTokens,
    };
  }
}
