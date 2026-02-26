import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getPropertyForUser } from "@/lib/tourism/property-access";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

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
        c.priceHistory.map(p => p.price)
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
      const { name, platform, url, roomType } = competitorData;

      const competitor = await prisma.competitor.create({
        data: {
          propertyId,
          name,
          platform,
          url,
          roomType,
        },
      });

      // Scrape initial price (using Firecrawl MCP or similar)
      const scrapedPrice = await scrapeCompetitorPrice(url);

      if (scrapedPrice) {
        await prisma.competitorPrice.create({
          data: {
            competitorId: competitor.id,
            price: scrapedPrice.price,
            currency: scrapedPrice.currency || "EUR",
            date: new Date(),
            availability: scrapedPrice.availability,
          },
        });
      }

      return NextResponse.json({ competitor, scrapedPrice });
    }

    if (action === "refresh-all") {
      const competitors = await prisma.competitor.findMany({
        where: { propertyId },
      });

      const results = [];
      for (const competitor of competitors) {
        const scrapedPrice = await scrapeCompetitorPrice(competitor.url);
        if (scrapedPrice) {
          await prisma.competitorPrice.create({
            data: {
              competitorId: competitor.id,
              price: scrapedPrice.price,
              date: new Date(),
            },
          });
          results.push({ competitorId: competitor.id, price: scrapedPrice.price });
        }
      }

      return NextResponse.json({ refreshed: results.length, results });
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

async function scrapeCompetitorPrice(url: string): Promise<{ price: number; currency: string; availability?: boolean } | null> {
  // In production, this would use Firecrawl MCP or similar
  // For now, return a mock or call an external scraper

  try {
    // Simulate price scraping
    // In real implementation, use Firecrawl MCP
    const mockResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (!mockResponse.ok) {
      // Return mock data for development
      return {
        price: Math.floor(Math.random() * 100) + 50,
        currency: "EUR",
        availability: true,
      };
    }

    const data = await mockResponse.json();
    return data.extract;
  } catch {
    // Return mock data if scraping fails
    return {
      price: Math.floor(Math.random() * 100) + 50,
      currency: "EUR",
      availability: true,
    };
  }
}
