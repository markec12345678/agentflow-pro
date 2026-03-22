import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { getFirecrawlApiKey } from "@/config/env";

// GET /api/tourism/competitor-prices - get competitor price data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const location = searchParams.get("location");

    if (!propertyId || !location) {
      return NextResponse.json(
        { error: "Property ID and location are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    // Fetch tracked competitors
    const competitors = await prisma.competitor.findMany({
      where: { propertyId },
      include: {
        prices: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    // Market analysis (property from getPropertyForUser includes basePrice, currency)
    const marketData = {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      priceRange: { low: 0, high: 0 },
      recommendations: [] as string[],
    };

    if (competitors.length > 0) {
      const prices = competitors.flatMap(c =>
        c.prices.map(p => p.price)
      ).filter(p => p > 0);

      if (prices.length > 0) {
        marketData.avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        marketData.minPrice = Math.min(...prices);
        marketData.maxPrice = Math.max(...prices);
        marketData.priceRange = {
          low: Math.round(marketData.avgPrice * 0.85),
          high: Math.round(marketData.avgPrice * 1.15),
        };

        // Generate recommendations
        if (property?.basePrice) {
          const myPrice = property.basePrice;
          if (myPrice > marketData.avgPrice * 1.2) {
            marketData.recommendations.push("Vaša cena je 20%+ višja od povprečja. Razmislite o ponudbi za vikende.");
          } else if (myPrice < marketData.avgPrice * 0.8) {
            marketData.recommendations.push("Vaša cena je 20%+ nižja od povprečja. Lahko povišate ceno brez izgube konkurenčnosti.");
          } else {
            marketData.recommendations.push("Vaša cena je konkurenčna.");
          }
        }
      }
    }

    return NextResponse.json({
      property,
      competitors: competitors.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.name,
        url: c.url,
        currentPrice: c.prices[0]?.price ?? null,
        lastUpdated: c.prices[0]?.date ?? null,
        priceTrend: calculateTrend(c.prices.slice(0, 7)),
      })),
      marketAnalysis: marketData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Competitor prices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitor prices" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/competitor-prices - add competitor or refresh prices
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, propertyId, competitorData } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    if (action === "add-competitor") {
      const { name, platform, url } = competitorData || {};
      const displayName = name || platform || "Competitor";

      const competitor = await prisma.competitor.create({
        data: {
          propertyId,
          name: displayName,
          url: url || "",
        },
      });

      const scrapeOutcome = await scrapeCompetitorPrice(url);

      if (scrapeOutcome.success) {
        await prisma.competitorPrice.create({
          data: {
            competitorId: competitor.id,
            price: scrapeOutcome.price,
            date: new Date(),
          },
        });
      }

      return NextResponse.json({
        competitor,
        scrapedPrice: scrapeOutcome.success ? { price: scrapeOutcome.price, currency: scrapeOutcome.currency } : null,
        scrapeError: !scrapeOutcome.success ? scrapeOutcome.error : undefined,
      });
    }

    if (action === "refresh-all") {
      const competitors = await prisma.competitor.findMany({
        where: { propertyId },
      });

      const results: Array<{ competitorId: string; price: number }> = [];
      const errors: string[] = [];
      for (const competitor of competitors) {
        const outcome = await scrapeCompetitorPrice(competitor.url);
        if (outcome.success) {
          await prisma.competitorPrice.create({
            data: {
              competitorId: competitor.id,
              price: outcome.price,
              date: new Date(),
            },
          });
          results.push({ competitorId: competitor.id, price: outcome.price });
        } else {
          errors.push(`${competitor.name}: ${outcome.error}`);
        }
      }

      return NextResponse.json({
        refreshed: results.length,
        results,
        scrapeErrors: errors.length ? errors : undefined,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Competitor prices POST error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// DELETE /api/tourism/competitor-prices - remove competitor
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Competitor ID is required" },
        { status: 400 }
      );
    }

    const competitor = await prisma.competitor.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(competitor.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    await prisma.competitor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete competitor error:", error);
    return NextResponse.json(
      { error: "Failed to delete competitor" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateTrend(prices: Array<{ price: number; date: Date }>): "up" | "down" | "stable" {
  if (prices.length < 2) return "stable";

  const first = prices[prices.length - 1]?.price || 0;
  const last = prices[0]?.price || 0;

  const change = ((last - first) / first) * 100;

  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

type ScrapeOutcome =
  | { success: true; price: number; currency: string; availability?: boolean }
  | { success: false; error: string };

async function scrapeCompetitorPrice(url: string): Promise<ScrapeOutcome> {
  const apiKey = getFirecrawlApiKey();
  if (!apiKey?.trim()) {
    return {
      success: false,
      error: "FIRECRAWL_API_KEY not configured. Add it to .env to enable price scraping.",
    };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["extract"],
        extract: {
          schema: {
            type: "object",
            properties: {
              price: { type: "number" },
              currency: { type: "string" },
              availability: { type: "boolean" },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Firecrawl scrape failed (${res.status}): ${errText.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as {
      data?: { extract?: { price?: number; currency?: string; availability?: boolean } };
    };
    const extracted = data.data?.extract;
    if (extracted && typeof extracted.price === "number") {
      return {
        success: true,
        price: extracted.price,
        currency: extracted.currency ?? "EUR",
        availability: extracted.availability,
      };
    }
    return {
      success: false,
      error: "Firecrawl returned no price data for this URL.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Price scraping failed: ${msg}`,
    };
  }
}
