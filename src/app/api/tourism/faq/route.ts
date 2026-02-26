import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { retrieveGuestContext } from "@/lib/tourism/guest-retrieval";
import { runGuestCopyAgent } from "@/lib/tourism/guest-copy-agent";
import { runPolicyAgent } from "@/lib/tourism/policy-agent";
import { generateFaqSchema } from "@/lib/tourism/faq-schema";
import { DEFAULT_FAQS, type FaqEntry } from "@/data/tourism-faqs";
import { getLlmApiKey } from "@/config/env";

function findBestKeywordMatch(
  question: string,
  faqs: FAQEntry[]
): FAQEntry | null {
  const normalizedQuestion = question.toLowerCase().trim();
  let bestMatch: FAQEntry | null = null;
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

async function logFaqResponse(
  question: string,
  responseTimeMs: number,
  confidence: number,
  propertyId: string | null
) {
  try {
    await prisma.faqResponseLog.create({
      data: {
        question: question.slice(0, 2000),
        responseTimeMs,
        confidence,
        propertyId,
      },
    });
  } catch (e) {
    console.warn("FaqResponseLog create failed:", e);
  }
}

// POST /api/tourism/faq - chatbot response
export async function POST(request: NextRequest) {
  const startMs = Date.now();
  try {
    const body = await request.json();
    const { question, propertyId, guestId, userId, customFaqs, useMultiAgent } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const propId = propertyId || null;

    // Multi-agent flow: Retrieval + Copy when useMultiAgent and (propertyId or userId)
    if (useMultiAgent && (propertyId || userId)) {
      const { getAppBackend } = await import("@/memory/app-backend");
      const retrievalCtx = await retrieveGuestContext({
        propertyId: propertyId || undefined,
        guestId: guestId || undefined,
        userId: userId || undefined,
        kgBackend: getAppBackend(),
      });
      const llm = getLlmApiKey();
      if (llm.apiKey) {
        const keywordMatch = findBestKeywordMatch(
          question,
          [...DEFAULT_FAQS, ...(customFaqs || [])]
        );
        const policyResult = runPolicyAgent({
          question,
          reservation: retrievalCtx.reservations?.[0]
            ? {
              checkIn: retrievalCtx.reservations[0].checkIn,
              checkOut: retrievalCtx.reservations[0].checkOut,
              status: retrievalCtx.reservations[0].status,
            }
            : undefined,
          policyRules: undefined,
        });
        const copyResult = await runGuestCopyAgent({
          question,
          retrievalContext: retrievalCtx,
          fallbackFaqAnswer: keywordMatch?.answer,
          policyResult: policyResult.isPolicyRelevant ? policyResult : null,
          apiKey: llm.apiKey,
        });
        const responseTimeMs = Date.now() - startMs;
        logFaqResponse(question, responseTimeMs, copyResult.confidence, propId);
        return NextResponse.json({
          answer: copyResult.answer,
          confidence: copyResult.confidence,
          category: keywordMatch?.category ?? "multi-agent",
          source: "multi-agent",
        });
      }
    }

    // Keyword-based matching
    const faqs = [...DEFAULT_FAQS, ...(customFaqs || [])];
    const bestMatch = findBestKeywordMatch(question, faqs);
    if (bestMatch) {
      const responseTimeMs = Date.now() - startMs;
      logFaqResponse(question, responseTimeMs, 0.8, propId);
      return NextResponse.json({
        answer: bestMatch.answer,
        confidence: 0.8,
        category: bestMatch.category,
        matchedQuestion: bestMatch.question,
        alternatives: faqs
          .filter((f) => f !== bestMatch && f.category === bestMatch.category)
          .slice(0, 2)
          .map((f) => ({ question: f.question, answer: f.answer })),
      });
    }

    // Fallback response
    const responseTimeMs = Date.now() - startMs;
    logFaqResponse(question, responseTimeMs, 0, propId);
    return NextResponse.json({
      answer: "Žal nimam neposrednega odgovora na to vprašanje. Prosimo, kontaktirajte nas direktno na telefon ali email in z veseljem vam bomo pomagali.",
      confidence: 0,
      category: "unknown",
      contactInfo: {
        phone: "+386 40 123 456",
        email: "info@example.com",
      },
    });
  } catch (error) {
    console.error("FAQ chatbot error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}

// GET /api/tourism/faq - list all FAQs or JSON-LD structured data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const format = searchParams.get("format");

    let faqs = DEFAULT_FAQS;
    if (category) {
      faqs = faqs.filter((f) => f.category === category);
    }

    if (format === "jsonld") {
      const schema = generateFaqSchema(faqs);
      return NextResponse.json(schema, {
        headers: {
          "Content-Type": "application/ld+json",
        },
      });
    }

    return NextResponse.json({
      faqs,
      categories: [...new Set(DEFAULT_FAQS.map((f) => f.category))],
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
