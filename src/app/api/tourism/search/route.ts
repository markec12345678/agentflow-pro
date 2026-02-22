import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tourism/search - global search across all tourism data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const propertyId = searchParams.get("propertyId");
    const limit = parseInt(searchParams.get("limit") || "20");

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
          { guest: { name: { contains: searchTerm, mode: "insensitive" } } },
          { guest: { email: { contains: searchTerm, mode: "insensitive" } } },
        ],
      },
      include: { guest: true, property: true },
      take: limit,
    });

    results.push(
      ...reservations.map((r) => ({
        id: r.id,
        type: "reservation" as const,
        title: r.guest?.name || "Rezervacija",
        subtitle: `${r.property?.name || "Nastanitev"} • ${new Date(r.checkIn).toLocaleDateString("sl-SI")}`,
        url: `/dashboard/tourism/calendar?reservation=${r.id}`,
        icon: "📅",
      }))
    );

    // Search Guests
    const guests = await prisma.guest.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
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
          { description: { contains: searchTerm, mode: "insensitive" } },
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
        ...(propertyId ? { propertyId } : {}),
        OR: [
          { content: { contains: searchTerm, mode: "insensitive" } },
          { promptType: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    results.push(
      ...content.map((c) => ({
        id: c.id,
        type: "content" as const,
        title: c.promptType.replace(/-/g, " "),
        subtitle: c.content.slice(0, 50) + "...",
        url: `/dashboard/tourism/generate?content=${c.id}`,
        icon: "📝",
      }))
    );

    // Search Templates
    const templates = await prisma.userTemplate.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
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
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    );
  }
}
