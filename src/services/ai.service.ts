/**
 * AI Service facade - orchestrates LLM, sanitization, usage logging
 */

import type {
  ILanguageModel,
  IDataSanitizer,
  IAiUsageLogger,
  AiContext,
} from "@/domain/ai";
import { estimateCost, OpenAIAdapter } from "@/infrastructure/ai";
import { Output } from "ai";

export interface GenerateWithLoggingOptions {
  userId?: string | null;
  agentType: string;
  model: string;
  abortSignal?: AbortSignal;
}

export interface AiServiceDeps {
  llm: ILanguageModel;
  usageLogger: IAiUsageLogger;
  sanitizer?: IDataSanitizer;
}

export class AiService {
  constructor(private deps: AiServiceDeps) { }

  async generateWithLogging(
    ctx: AiContext,
    options: GenerateWithLoggingOptions
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const sanitizedCtx = this.deps.sanitizer
      ? {
        ...ctx,
        prompt: ctx.prompt
          ? this.deps.sanitizer.sanitize(ctx.prompt)
          : ctx.prompt,
        systemPrompt: ctx.systemPrompt
          ? this.deps.sanitizer.sanitize(ctx.systemPrompt)
          : ctx.systemPrompt,
      }
      : ctx;

    const startMs = Date.now();
    const result = await this.deps.llm.generateText(sanitizedCtx, {
      abortSignal: options.abortSignal,
    });
    const latencyMs = Date.now() - startMs;

    const costEst = estimateCost(
      options.model,
      result.inputTokens,
      result.outputTokens
    );

    await this.deps.usageLogger.log({
      userId: options.userId ?? undefined,
      agentType: options.agentType,
      model: options.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costEst,
      latencyMs,
    });

    return result;
  }

  /** Structured output with logging (requires OpenAIAdapter) */
  async generateObjectWithLogging<T>(
    prompt: string,
    outputConfig: ReturnType<typeof Output.object>,
    options: GenerateWithLoggingOptions & { systemPrompt?: string; temperature?: number }
  ): Promise<{ object: T; inputTokens: number; outputTokens: number }> {
    const adapter = this.deps.llm as OpenAIAdapter;
    if (typeof (adapter as { generateObject?: unknown }).generateObject !== "function") {
      throw new Error("generateObjectWithLogging requires OpenAIAdapter");
    }

    const sanitizedPrompt = this.deps.sanitizer
      ? this.deps.sanitizer.sanitize(prompt)
      : prompt;

    const startMs = Date.now();
    const result = await adapter.generateObject<T>(
      sanitizedPrompt,
      outputConfig,
      {
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        abortSignal: options.abortSignal,
      }
    );
    const latencyMs = Date.now() - startMs;

    const costEst = estimateCost(
      options.model,
      result.inputTokens,
      result.outputTokens
    );

    await this.deps.usageLogger.log({
      userId: options.userId ?? undefined,
      agentType: options.agentType,
      model: options.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costEst,
      latencyMs,
    });

    return {
      object: result.object,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
  }
}
