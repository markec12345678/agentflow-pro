/**
 * Blocked Dates API for a property
 * GET: list blocked dates, POST: create, DELETE: remove by id
 */

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

    const blockedDates = await prisma.blockedDate.findMany({
      where: { propertyId },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error("Blocked dates API error:", error);
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
    const { date, reason, roomId, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const blockedDate = await prisma.blockedDate.create({
      data: {
        propertyId,
        date: new Date(date),
        reason: reason || null,
        roomId: roomId || null,
        notes: notes || null
      }
    });

    return NextResponse.json(blockedDate);
  } catch (error) {
    console.error("Create blocked date API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const blockedDateId = searchParams.get("id");

    if (!blockedDateId) {
      return NextResponse.json({ error: "Blocked date ID is required" }, { status: 400 });
    }

    // Verify the blocked date belongs to this property
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        id: blockedDateId,
        propertyId
      }
    });

    if (!blockedDate) {
      return NextResponse.json({ error: "Blocked date not found" }, { status: 404 });
    }

    await prisma.blockedDate.delete({
      where: { id: blockedDateId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete blocked date API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
