import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const propertyIds = await getPropertyIdsForUser(userId);
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const where: any = {
      propertyId: propertyId ? propertyId : { in: propertyIds },
    };

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        guest: { select: { name: true, email: true } },
        property: { select: { name: true } }
      }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { action, reviewId, responseContent } = body;

    if (action === "analyze") {
      const { content } = body;
      // Simulate AI Sentiment Analysis
      const sentiment = content.toLowerCase().includes("odlično") || content.toLowerCase().includes("super") ? "positive" : "negative";
      const score = sentiment === "positive" ? 0.95 : 0.25;
      
      const suggestedResponse = sentiment === "positive" 
        ? "Hvala za vaše mnenje! Veseli smo, da ste uživali."
        : "Žal nam je za vašo izkušnjo. Bomo preverili in izboljšali.";

      return NextResponse.json({ sentiment, score, suggestedResponse });
    }

    if (action === "respond") {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
          response: responseContent,
          respondedAt: new Date(),
          respondedBy: userId,
          status: "responded"
        }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
