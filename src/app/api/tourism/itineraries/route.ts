/**
 * Tourism Itineraries API - GET (list), POST (create)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const where: { userId: string; propertyId?: string | null } = { userId };
    if (propertyId) {
      where.propertyId = propertyId;
    }

    const itineraries = await prisma.itinerary.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ itineraries });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch itineraries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      title: string;
      propertyId?: string | null;
      days?: unknown;
    };

    const { title, propertyId, days } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (propertyId?.trim()) {
      const property = await getPropertyForUser(propertyId.trim(), userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
    }

    const daysData = Array.isArray(days) ? days : [{ day: 1, activities: [] }];

    const itinerary = await prisma.itinerary.create({
      data: {
        userId,
        propertyId: propertyId?.trim() || null,
        title: title.trim(),
        days: daysData,
      },
    });

    return NextResponse.json({ itinerary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create itinerary" },
      { status: 500 }
    );
  }
}
