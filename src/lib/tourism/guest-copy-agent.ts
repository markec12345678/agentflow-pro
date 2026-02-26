/**
 * AgentFlow Pro - Guest Copy Agent (Blok C #9)
 * Formats guest-facing answer in brand tone using LLM.
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getLlmApiKey } from "@/config/env";
import { isMockMode } from "@/lib/mock-mode";
import type { RetrievalContext } from "./guest-retrieval";
import { formatRetrievalContext } from "./guest-retrieval";

export interface CopyAgentInput {
  question: string;
  retrievalContext: RetrievalContext;
  fallbackFaqAnswer?: string;
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

  const openai = createOpenAI({
    apiKey: llm.apiKey,
    ...(llm.baseURL && { baseURL: llm.baseURL }),
  });

  const systemPrompt = hasContext
    ? `You are a helpful hospitality assistant for a property. Answer the guest's question based on the property/guest context below. Be warm, concise, and accurate. If the context doesn't contain the answer, say so politely and suggest they contact the host.
Respond in the same language as the question (e.g. Slovenian if question is in Slovenian).
Context:
${ctxStr}`
    : `You are a helpful hospitality assistant. Answer the guest's question briefly and helpfully. If you don't know, suggest they contact the host. Respond in the same language as the question.`;

  const result = await generateText({
    model: openai(llm.model),
    system: systemPrompt,
    prompt: `Guest question: ${question}`,
    temperature: 0.3,
    maxTokens: 400,
  });

  const answer = result.text?.trim() ?? fallbackFaqAnswer ?? "Prosimo, kontaktirajte nas.";
  const confidence = hasContext ? 0.85 : 0.6;

  return { answer, confidence };
}
