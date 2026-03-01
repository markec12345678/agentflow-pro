/**
 * Use case: Answer FAQ question (keyword match or multi-agent flow)
 */

import type { FaqAnswer } from "../entities/faq-answer";
import type { IFaqLogRepository } from "../ports/faq-log-repository";
import type { IGuestRetrieval } from "../ports/guest-retrieval.port";
import type { IPolicyAgent } from "../ports/policy-agent.port";
import type { IGuestCopyAgent } from "../ports/copy-agent.port";

export interface FaqEntryForMatch {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface AnswerFaqInput {
  question: string;
  propertyId?: string | null;
  guestId?: string | null;
  userId?: string | null;
  useMultiAgent?: boolean;
  faqs: FaqEntryForMatch[];
  propertyIdForLog?: string | null;
  apiKey?: string;
  kgBackend?: unknown;
}

const FALLBACK_ANSWER: FaqAnswer = {
  answer:
    "Žal nimam neposrednega odgovora na to vprašanje. Prosimo, kontaktirajte nas direktno na telefon ali email in z veseljem vam bomo pomagali.",
  confidence: 0,
  category: "unknown",
  source: "fallback",
  contactInfo: {
    phone: "+386 40 123 456",
    email: "info@example.com",
  },
};

function findBestKeywordMatch(
  question: string,
  faqs: FaqEntryForMatch[]
): FaqEntryForMatch | null {
  const normalizedQuestion = question.toLowerCase().trim();
  let bestMatch: FaqEntryForMatch | null = null;
  let bestScore = 0;
  for (const faq of faqs) {
    let score = 0;
    if (faq.question.toLowerCase().includes(normalizedQuestion)) score += 10;
    for (const keyword of faq.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) score += 2;
    }
    const questionWords = faq.question.toLowerCase().split(/\s+/);
    for (const word of normalizedQuestion.split(/\s+/)) {
      if (word.length > 3 && questionWords.includes(word)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }
  return bestScore >= 2 ? bestMatch : null;
}

export interface AnswerFaqDeps {
  faqLogRepo: IFaqLogRepository;
  guestRetrieval: IGuestRetrieval;
  policyAgent: IPolicyAgent;
  copyAgent: IGuestCopyAgent;
}

export function createAnswerFaqUseCase(deps: AnswerFaqDeps) {
  return async (input: AnswerFaqInput): Promise<FaqAnswer> => {
    const startMs = Date.now();
    const propId = input.propertyIdForLog ?? input.propertyId ?? null;

    // Multi-agent flow: useMultiAgent and (propertyId or userId) and apiKey
    if (
      input.useMultiAgent &&
      (input.propertyId || input.userId) &&
      input.apiKey
    ) {
      const retrievalCtx = await deps.guestRetrieval.retrieve({
        propertyId: input.propertyId ?? undefined,
        guestId: input.guestId ?? undefined,
        userId: input.userId ?? undefined,
        kgBackend: input.kgBackend,
      });

      const keywordMatch = findBestKeywordMatch(input.question, input.faqs);
      const policyResult = deps.policyAgent.check({
        question: input.question,
        reservation: retrievalCtx.reservations?.[0]
          ? {
            checkIn: retrievalCtx.reservations[0].checkIn,
            checkOut: retrievalCtx.reservations[0].checkOut,
            status: retrievalCtx.reservations[0].status,
          }
          : undefined,
        policyRules: undefined,
      });

      const copyResult = await deps.copyAgent.run({
        question: input.question,
        retrievalContext: retrievalCtx,
        fallbackFaqAnswer: keywordMatch?.answer,
        policyResult: policyResult.isPolicyRelevant ? policyResult : null,
        apiKey: input.apiKey,
      });

      const elapsed = Date.now() - startMs;
      const faqLogId = await deps.faqLogRepo.log(
        input.question,
        elapsed,
        copyResult.confidence,
        propId
      );

      return {
        answer: copyResult.answer,
        confidence: copyResult.confidence,
        category: keywordMatch?.category ?? "multi-agent",
        source: "multi-agent",
        faqLogId: faqLogId ?? undefined,
      };
    }

    // Keyword-based matching
    const bestMatch = findBestKeywordMatch(input.question, input.faqs);
    if (bestMatch) {
      const elapsed = Date.now() - startMs;
      const faqLogId = await deps.faqLogRepo.log(input.question, elapsed, 0.8, propId);

      return {
        answer: bestMatch.answer,
        confidence: 0.8,
        category: bestMatch.category,
        source: "keyword",
        matchedQuestion: bestMatch.question,
        alternatives: input.faqs
          .filter((f) => f !== bestMatch && f.category === bestMatch.category)
          .slice(0, 2)
          .map((f) => ({ question: f.question, answer: f.answer })),
        faqLogId: faqLogId ?? undefined,
      };
    }

    // Fallback
    const elapsed = Date.now() - startMs;
    const faqLogId = await deps.faqLogRepo.log(input.question, elapsed, 0, propId);
    return { ...FALLBACK_ANSWER, faqLogId: faqLogId ?? undefined };
  };
}
