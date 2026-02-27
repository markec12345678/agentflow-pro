/**
 * AgentFlow Pro - Guest Copy Agent (Blok C #9)
 * Formats guest-facing answer in brand tone using LLM.
 * Uses centralized AI service (OpenAIAdapter + AiService).
 */

import { getLlmApiKey } from "@/config/env";
import { isMockMode } from "@/lib/mock-mode";
import { OpenAIAdapter, DataSanitizer, PrismaAiUsageLogger } from "@/infrastructure/ai";
import { AiService } from "@/services/ai.service";
import type { RetrievalContext } from "./guest-retrieval";
import { formatRetrievalContext } from "./guest-retrieval";

export interface CopyAgentInput {
  question: string;
  retrievalContext: RetrievalContext;
  fallbackFaqAnswer?: string;
  policyResult?: { isPolicyRelevant: boolean; policyContext?: string; reason?: string } | null;
  language?: string;
  apiKey?: string;
}

export interface CopyAgentOutput {
  answer: string;
  confidence: number;
}

export async function runGuestCopyAgent(input: CopyAgentInput): Promise<CopyAgentOutput> {
  const {
    question,
    retrievalContext,
    fallbackFaqAnswer,
    policyResult,
    language = "sl",
    apiKey: overrideApiKey,
  } = input;

  const llm = overrideApiKey
    ? { apiKey: overrideApiKey, baseURL: undefined as string | undefined, model: "gpt-4o-mini" }
    : getLlmApiKey();

  if (isMockMode()) {
    const ctxStr = formatRetrievalContext(retrievalContext);
    return {
      answer:
        ctxStr.trim().length > 0
          ? `[MOCK] Odgovor za gosta glede na kontekst nastanitve.\nVprašanje: ${question}`
          : fallbackFaqAnswer ??
          "Prosimo, kontaktirajte nas direktno za več informacij.",
      confidence: 0.7,
    };
  }

  if (!llm.apiKey) {
    return {
      answer:
        fallbackFaqAnswer ??
        "Prosimo, kontaktirajte nas direktno za več informacij.",
      confidence: 0,
    };
  }

  let ctxStr = formatRetrievalContext(retrievalContext);
  if (policyResult?.isPolicyRelevant && policyResult.policyContext) {
    ctxStr += `\n\n[Pravila nastanitve]\n${policyResult.policyContext}`;
    if (policyResult.reason)
      ctxStr += `\n[Konkretni odgovor za to vprašanje]: ${policyResult.reason}`;
  }
  const hasContext = ctxStr.trim().length > 0;

  const systemPrompt = hasContext
    ? `You are a helpful hospitality assistant for a property. Answer the guest's question based on the property/guest context below. Be warm, concise, and accurate. If the context doesn't contain the answer, say so politely and suggest they contact the host.
Respond in the same language as the question (e.g. Slovenian if question is in Slovenian).
Context:
${ctxStr}`
    : `You are a helpful hospitality assistant. Answer the guest's question briefly and helpfully. If you don't know, suggest they contact the host. Respond in the same language as the question.`;

  const aiService = new AiService({
    llm: new OpenAIAdapter({ apiKey: llm.apiKey, model: llm.model, baseURL: llm.baseURL }),
    usageLogger: new PrismaAiUsageLogger(),
    sanitizer: new DataSanitizer(),
  });

  const result = await aiService.generateWithLogging(
    {
      systemPrompt,
      prompt: `Guest question: ${question}`,
      temperature: 0.3,
      maxTokens: 400,
    },
    { userId: undefined, agentType: "faq-copy", model: llm.model }
  );

  const answer = (result.text.trim() || fallbackFaqAnswer) ?? "Prosimo, kontaktirajte nas.";
  const confidence = hasContext ? 0.85 : 0.6;

  return { answer, confidence };
}
