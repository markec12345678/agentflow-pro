/**
 * AgentFlow Pro - Guest Portal
 * Self check-in, digital registration, and guest communication
 */

import { prisma } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Verify token and get property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        metadata: {
          path: ["guestPortalToken"],
          equals: token,
        },
      },
      include: {
        reservations: {
          where: {
            status: { in: ["confirmed", "pending"] },
            checkOut: { gte: new Date() },
          },
          orderBy: { checkIn: "asc" },
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({
      property: {
        id: property.id,
        name: property.name,
        description: property.description,
        address: property.address,
        checkInTime: property.checkInTime || "15:00",
        checkOutTime: property.checkOutTime || "11:00",
        wifiPassword: property.metadata?.wifiPassword,
        doorCode: property.metadata?.doorCode,
        emergencyContact: property.metadata?.emergencyContact,
        houseRules: property.houseRules,
        imageUrl: property.imageUrl,
      },
      upcomingReservation: property.reservations[0] || null,
    });
  } catch (error) {
    logger.error("[Guest Portal] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
