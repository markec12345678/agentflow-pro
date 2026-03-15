import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import {
  getPropertyForUser,
  getPropertyIdsForUser,
} from "@/lib/tourism/property-access";

// GET /api/tourism/search - global search across all tourism data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const propertyId = searchParams.get("propertyId");
    const limit = parseInt(searchParams.get("limit") || "20");

    let allowedPropertyIds: string[];
    if (propertyId) {
      const property = await getPropertyForUser(propertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
      allowedPropertyIds = [propertyId];
    } else {
      allowedPropertyIds = await getPropertyIdsForUser(userId);
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.toLowerCase().trim();
    const results: Array<{
      id: string;
      type: "reservation" | "guest" | "property" | "content" | "template";
      title: string;
      subtitle: string;
      url: string;
      icon: string;
    }> = [];

    // Search Reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
        OR: [
          { notes: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      include: { guest: true, property: true },
      take: limit,
    });

    results.push(
      ...reservations.map((r) => ({
        id: r.id,
        type: "reservation" as const,
        title: "Rezervacija",
        subtitle: `Rezervacija • ${new Date(r.checkIn).toLocaleDateString("sl-SI")}`,
        url: `/dashboard/tourism/calendar?reservation=${r.id}`,
        icon: "📅",
      }))
    );

    // Search Guests
    const guests = await prisma.guest.findMany({
      where: {
        propertyId: { in: allowedPropertyIds },
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    results.push(
      ...guests.map((g) => ({
        id: g.id,
        type: "guest" as const,
        title: g.name,
        subtitle: g.email || g.phone || "",
        url: `/dashboard/tourism/guest-communication?guest=${g.id}`,
        icon: "👤",
      }))
    );

    // Search Properties
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { location: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    results.push(
      ...properties.map((p) => ({
        id: p.id,
        type: "property" as const,
        title: p.name,
        subtitle: p.location || "",
        url: `/dashboard/tourism/properties?id=${p.id}`,
        icon: "🏨",
      }))
    );

    // Search Content History
    const content = await prisma.contentHistory.findMany({
      where: {
        userId,
        content: { contains: searchTerm, mode: "insensitive" },
        ...(allowedPropertyIds.length > 0
          ? {
              OR: [
                { propertyId: { in: allowedPropertyIds } },
                { propertyId: null },
              ],
            }
          : { propertyId: null }),
      },
      take: limit,
    });

    results.push(
      ...content.map((c) => ({
        id: c.id,
        type: "content" as const,
        title: c.type,
        subtitle: c.content.slice(0, 50) + "...",
        url: `/dashboard/tourism/generate?content=${c.id}`,
        icon: "📝",
      }))
    );

    // Search Templates
    const templates = await prisma.userTemplate.findMany({
      where: {
        userId,
        ...(allowedPropertyIds.length > 0
          ? {
              OR: [
                { propertyId: { in: allowedPropertyIds } },
                { propertyId: null },
              ],
            }
          : { propertyId: null }),
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { basePrompt: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    results.push(
      ...templates.map((t) => ({
        id: t.id,
        type: "template" as const,
        title: t.name,
        subtitle: t.basePrompt.replace(/-/g, " "),
        url: `/dashboard/tourism/generate?template=${t.id}`,
        icon: "📋",
      }))
    );

    // Sort by relevance (simple: title starts with query first)
    const sortedResults = results.sort((a, b) => {
      const aStartsWith = a.title.toLowerCase().startsWith(searchTerm);
      const bStartsWith = b.title.toLowerCase().startsWith(searchTerm);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return 0;
    });

    return NextResponse.json({
      results: sortedResults.slice(0, limit),
      query: searchTerm,
      total: sortedResults.length,
    });
  } catch (error) {
    logger.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    );
  }
}
