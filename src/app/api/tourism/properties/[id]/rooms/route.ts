import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const rooms = await prisma.room.findMany({
      where: { propertyId },
      include: {
        blockedDates: true
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Rooms API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, capacity, beds, basePrice, amenities, description } = body;

    if (!name || !type || !capacity) {
      return NextResponse.json({ error: "Name, type and capacity are required" }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        propertyId,
        name,
        type,
        capacity: parseInt(capacity),
        beds: beds ? parseInt(beds) : null,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        amenities: Array.isArray(amenities) ? amenities : [],
        description
      }
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Create room API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
