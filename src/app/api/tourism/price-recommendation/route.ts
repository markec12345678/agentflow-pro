/**
 * GET /api/tourism/price-recommendation
 * Combines calculate-price + competitor-prices + AI suggestion.
 * Query: propertyId, checkIn (yyyy-MM-dd), checkOut (yyyy-MM-dd)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parseISO, format } from "date-fns";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { calculatePrice } from "@/lib/tourism/pricing-engine-wrapper";
import { AiService } from "@/services/ai.service";
import { OpenAIAdapter, DataSanitizer, PrismaAiUsageLogger } from "@/infrastructure/ai";
import { getLlmFromUserKeys } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";
import { isMockMode } from "@/lib/mock-mode";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");

    if (!propertyId || !checkInParam || !checkOutParam) {
      return NextResponse.json(
        { error: "propertyId, checkIn, and checkOut are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const checkIn = parseISO(checkInParam);
    const checkOut = parseISO(checkOutParam);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { error: "Invalid checkIn or checkOut date (use yyyy-MM-dd)" },
        { status: 400 }
      );
    }
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "checkOut must be after checkIn" },
        { status: 400 }
      );
    }

    const baseRate = property.basePrice ?? 100;
    const result = await calculatePrice(baseRate, checkIn, checkOut);
    const currentPrice = result.finalPrice;
    const nights = result.nights;
    const pricePerNight = Math.round((currentPrice / nights) * 100) / 100;

    // Competitor data
    const competitors = await prisma.competitor.findMany({
      where: { propertyId },
      include: {
        prices: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    let competitorAvg = 0;
    let competitorMin = 0;
    let competitorMax = 0;
    if (competitors.length > 0) {
      const prices = competitors.flatMap((c) => c.prices.map((p) => p.price)).filter((p) => p > 0);
      if (prices.length > 0) {
        competitorAvg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        competitorMin = Math.min(...prices);
        competitorMax = Math.max(...prices);
      }
    }

    if (isMockMode()) {
      const mockSuggestion =
        competitorAvg > 0
          ? `Za obdobje ${format(checkIn, "d.M.")}–${format(checkOut, "d.M.")} (${nights} noči) priporočam ${pricePerNight} EUR/noč. Konkurenca povprečje ${competitorAvg} EUR, vaša trenutna cena ${pricePerNight} EUR – ustrezno.`
          : `Za obdobje ${format(checkIn, "d.M.")}–${format(checkOut, "d.M.")} (${nights} noči) priporočam ${pricePerNight} EUR/noč. Dodajte sledilce konkurence za primerjavo.`;

      return NextResponse.json({
        recommendedPrice: pricePerNight,
        suggestion: mockSuggestion,
        currentPrice,
        competitorAvg: competitorAvg || null,
        nights,
      });
    }

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const llm = getLlmFromUserKeys(userKeys);
    if (!llm.apiKey?.trim()) {
      return NextResponse.json(
        { error: "Add your OpenAI API key in Settings for AI price recommendations." },
        { status: 503 }
      );
    }

    const aiService = new AiService({
      llm: new OpenAIAdapter({
        apiKey: llm.apiKey,
        model: llm.model,
        baseURL: llm.baseURL,
      }),
      usageLogger: new PrismaAiUsageLogger(),
      sanitizer: new DataSanitizer(),
    });

    const systemPrompt = `Si strokovnjak za nastanitveno cenovno dinamiko. Odgovori SAMO z JSON objektom, brez dodatnega besedila:
{"recommendedPrice": <število EUR za noč>, "suggestion": "<1-2 stavka v slovenščini>"}
- recommendedPrice: priporočena cena na noč v EUR (celo število ali decimalno)
- suggestion: kratek priporočilo v slovenščini, kjer omeniš obdobje, priporočeno ceno, konkurenco (če je na voljo) in vašo trenutno ceno`;

    const prompt = `Obdobje: ${format(checkIn, "d.M.yyyy")}–${format(checkOut, "d.M.yyyy")} (${nights} noči)
Trenutna vaša cena: ${pricePerNight} EUR/noč (skupaj ${currentPrice} EUR)
${competitorAvg > 0 ? `Konkurenca: povprečje ${competitorAvg} EUR, min ${competitorMin} EUR, max ${competitorMax} EUR` : "Ni podatkov o konkurenci."}

Napiši priporočilo v Slovenščini. Če je konkurenca višja, lahko predlagaš povišanje. Če je nižja, ohrani ali znižaj.`;

    const aiResult = await aiService.generateWithLogging(
      { systemPrompt, prompt, temperature: 0.3 },
      { userId, agentType: "price-recommendation", model: llm.model }
    );

    const text = aiResult.text.trim();
    let recommendedPrice = pricePerNight;
    let suggestion = text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          recommendedPrice?: number;
          suggestion?: string;
        };
        if (typeof parsed.recommendedPrice === "number") {
          recommendedPrice = Math.round(parsed.recommendedPrice * 100) / 100;
        }
        if (typeof parsed.suggestion === "string" && parsed.suggestion.trim()) {
          suggestion = parsed.suggestion.trim();
        }
      } catch {
        // fallback: use text as suggestion
      }
    }

    return NextResponse.json({
      recommendedPrice,
      suggestion,
      currentPrice,
      competitorAvg: competitorAvg || null,
      nights,
    });
  } catch (error) {
    console.error("Price recommendation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get price recommendation" },
      { status: 500 }
    );
  }
}
