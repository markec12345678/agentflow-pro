import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAnswerFaqUseCase } from "@/domain/tourism/use-cases/answer-faq";
import {
  PrismaFaqLogRepository,
  GuestRetrievalAdapter,
  PolicyAgentAdapter,
  GuestCopyAgentAdapter,
} from "@/infrastructure/tourism";
import { generateFaqSchema } from "@/lib/tourism/faq-schema";
import { DEFAULT_FAQS } from "@/data/tourism-faqs";
import { getLlmApiKey } from "@/config/env";

const PostBodySchema = z.object({
  question: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  guestId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  customFaqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string(),
    keywords: z.array(z.string()),
  })).optional(),
  useMultiAgent: z.boolean().optional(),
});

function buildAnswerFaqUseCase() {
  const answerFaq = createAnswerFaqUseCase({
    faqLogRepo: new PrismaFaqLogRepository(),
    guestRetrieval: new GuestRetrievalAdapter(),
    policyAgent: new PolicyAgentAdapter(),
    copyAgent: new GuestCopyAgentAdapter(),
  });
  return answerFaq;
}

// POST /api/tourism/faq - chatbot response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { question, propertyId, guestId, userId, customFaqs, useMultiAgent } = parsed.data;

    const faqs = [...DEFAULT_FAQS, ...(customFaqs || [])];
    const llm = getLlmApiKey();

    const answerFaq = buildAnswerFaqUseCase();
    const result = await answerFaq({
      question,
      propertyId,
      guestId,
      userId,
      useMultiAgent,
      faqs,
      propertyIdForLog: propertyId ?? null,
      apiKey: llm.apiKey,
      kgBackend: useMultiAgent && (propertyId || userId)
        ? (await import("@/memory/app-backend")).getAppBackend()
        : undefined,
    });

    return NextResponse.json(result);
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
