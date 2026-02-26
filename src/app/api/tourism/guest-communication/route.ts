import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getPropertyForUser } from "@/lib/tourism/property-access";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

// GET /api/tourism/guest-communication - list guest emails
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const type = searchParams.get("type"); // 'pre-arrival', 'post-stay', 'all'

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const where: { propertyId: string; type?: string } = { propertyId };
    if (type && type !== "all") {
      where.type = type;
    }

    const communications = await prisma.guestCommunication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ communications });
  } catch (error) {
    console.error("Error fetching guest communications:", error);
    return NextResponse.json(
      { error: "Failed to fetch communications" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/guest-communication - create guest email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyId,
      guestId,
      type, // 'pre-arrival', 'post-stay'
      content,
      scheduledFor,
      variables, // { ime_gosta, lokacija, datum_prihoda, ... }
    } = body;

    if (!propertyId || !guestId || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    // Create or update guest
    const guest = await prisma.guest.upsert({
      where: { id: guestId },
      update: {
        name: variables?.ime_gosta || "Guest",
        email: variables?.email,
        phone: variables?.phone,
      },
      create: {
        id: guestId,
        name: variables?.ime_gosta || "Guest",
        email: variables?.email,
        phone: variables?.phone,
        propertyId,
      },
    });

    const communication = await prisma.guestCommunication.create({
      data: {
        propertyId,
        guestId: guest.id,
        type,
        content,
        variables: variables || {},
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? "scheduled" : "draft",
      },
    });

    return NextResponse.json({ communication, guest });
  } catch (error) {
    console.error("Error creating guest communication:", error);
    return NextResponse.json(
      { error: "Failed to create communication" },
      { status: 500 }
    );
  }
}

// PATCH /api/tourism/guest-communication - update status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, sentAt } = body;

    const communication = await prisma.guestCommunication.update({
      where: { id },
      data: {
        status,
        sentAt: sentAt ? new Date(sentAt) : undefined,
      },
    });

    return NextResponse.json({ communication });
  } catch (error) {
    console.error("Error updating communication:", error);
    return NextResponse.json(
      { error: "Failed to update communication" },
      { status: 500 }
    );
  }
}

// DELETE /api/tourism/guest-communication/:id
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
        { error: "Communication ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.guestCommunication.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Communication not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(existing.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    await prisma.guestCommunication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting communication:", error);
    return NextResponse.json(
      { error: "Failed to delete communication" },
      { status: 500 }
    );
  }
}
