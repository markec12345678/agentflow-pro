import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
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
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { checkRateLimitByIp } from "@/lib/rate-limit";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { prisma } from "@/database/schema";
import { getCachedContext, setCachedContext } from "@/lib/context-cache";

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
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateLimit = checkRateLimitByIp(ip, 60_000, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", retryAfter: rateLimit.retryAfter },
        {
          status: 429,
          headers: rateLimit.retryAfter
            ? { "Retry-After": String(rateLimit.retryAfter) }
            : undefined,
        }
      );
    }

    const body = await request.json();
    const parsed = PostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { question, propertyId, guestId, userId, customFaqs, useMultiAgent } = parsed.data;

    // Auth: when propertyId or userId present, require session and validate access
    const session = await getServerSession(authOptions);
    const sessionUserId = session ? getUserId(session) : null;

    if (propertyId && !sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userId && userId !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (propertyId && sessionUserId) {
      const ok = await getPropertyForUser(propertyId, sessionUserId);
      if (!ok) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const faqs = [...DEFAULT_FAQS, ...(customFaqs || [])];
    const llm = getLlmApiKey();

    // Try to get cached answer
    const cacheKey = `faq:${propertyId || 'global'}:${question.toLowerCase().slice(0, 50)}`;
    const cachedAnswer = await getCachedContext('faq-answer', { 
      question, 
      propertyId: propertyId || 'global',
      useMultiAgent: useMultiAgent || false 
    });

    if (cachedAnswer) {
      logger.info('[FAQ] Cache hit for question:', question.slice(0, 50));
      return NextResponse.json(cachedAnswer);
    }

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

    // Cache the result (5 min TTL for high-confidence answers)
    if (result.confidence >= 0.8) {
      await setCachedContext('faq-answer', { 
        question, 
        propertyId: propertyId || 'global',
        useMultiAgent: useMultiAgent || false 
      }, result, { ttl: 300 });
      logger.info('[FAQ] Cached answer with confidence:', result.confidence);
    }

    // FAQ escalation: low confidence -> create Inquiry for director inbox
    if (result.confidence < 0.7 && propertyId) {
      try {
        let guestName = "FAQ Guest";
        let guestEmail = "faq@placeholder.local";
        if (guestId) {
          const guest = await prisma.guest.findUnique({
            where: { id: guestId },
            select: { name: true, email: true },
          });
          if (guest) {
            guestName = guest.name || guestName;
            guestEmail = guest.email || guestEmail;
          }
        }
        await prisma.inquiry.create({
          data: {
            propertyId,
            name: guestName,
            email: guestEmail,
            message: question.slice(0, 2000),
            source: "faq_escalation",
            ...(result.faqLogId ? { faqLogId: result.faqLogId } : {}),
          },
        });
      } catch (e) {
        logger.warn("FAQ escalation Inquiry create failed:", e);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("FAQ chatbot error:", error);
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
    logger.error("Error fetching FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
