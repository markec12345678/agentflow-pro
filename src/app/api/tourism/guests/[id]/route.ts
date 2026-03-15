import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";

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
    const { id } = resolvedParams;
    const propertyIds = await getPropertyIdsForUser(userId);

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
          include: { property: { select: { name: true } } }
        },
        communications: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!guest || !propertyIds.includes(guest.propertyId || "")) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch (error) {
    logger.error("Guest details API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { id } = resolvedParams;
    const body = await request.json();
    const propertyIds = await getPropertyIdsForUser(userId);

    const guest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!guest || !propertyIds.includes(guest.propertyId || "")) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const { name, email, phone, riskScore, isVip, gdprConsent, preferences, notes } = body;

    const updated = await prisma.guest.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(riskScore !== undefined && { riskScore }),
        ...(isVip !== undefined && { isVip }),
        ...(gdprConsent !== undefined && { gdprConsent }),
        ...(preferences !== undefined && { preferences }),
        ...(notes !== undefined && { notes }),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Guest update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
