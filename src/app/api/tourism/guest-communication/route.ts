import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

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
    const guestId = searchParams.get("guestId");
    const type = searchParams.get("type"); // 'pre-arrival', 'post-stay', 'all'

    const where: any = {};
    if (propertyId) {
      const property = await getPropertyForUser(propertyId, userId);
      if (!property) return NextResponse.json({ error: "Property not found" }, { status: 403 });
      where.propertyId = propertyId;
    }
    if (guestId) where.guestId = guestId;
    if (type && type !== "all") where.type = type;

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
      guest: guestData,
      type,
      channel = "email",
      content,
      subject,
      scheduledAt,
      language = "sl",
      templateId,
      variables,
    } = body;

    if (!propertyId || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields: propertyId, type, content" },
        { status: 400 }
      );
    }
    if (!guestId && !guestData?.name) {
      return NextResponse.json(
        { error: "Provide guestId or guest: { name, email?, phone? }" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const name = variables?.ime_gosta || guestData?.name || "Guest";
    const email = variables?.email ?? guestData?.email ?? null;
    const phone = variables?.phone ?? guestData?.phone ?? null;

    let guest;
    if (guestId) {
      guest = await prisma.guest.upsert({
        where: { id: guestId },
        update: { name, email: email ?? undefined, phone: phone ?? undefined },
        create: {
          id: guestId,
          name,
          email: email ?? undefined,
          phone: phone ?? undefined,
          propertyId,
        },
      });
    } else {
      guest = await prisma.guest.create({
        data: {
          name,
          email: email ?? undefined,
          phone: phone ?? undefined,
          propertyId,
        },
      });
    }

    const validChannel = channel === "whatsapp" ? "whatsapp" : "email";
    if (validChannel === "whatsapp" && !guest.phone?.trim()) {
      return NextResponse.json(
        { error: "Guest phone is required for WhatsApp. Add phone in variables." },
        { status: 400 }
      );
    }

    const communication = await prisma.guestCommunication.create({
      data: {
        propertyId,
        guestId: guest.id,
        type,
        channel: validChannel,
        subject: subject ?? (validChannel === "email" ? "Sporočilo nastanitve" : null),
        content,
        variables: variables || {},
        status: scheduledAt ? "scheduled" : "pending",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        language: language || "sl",
        templateId: templateId || null,
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

    const action = body.action; // 'bulk-approve' or single update
    if (action === "bulk-approve") {
      const { propertyId: bulkPropertyId, type: bulkType } = body;
      if (!bulkPropertyId) {
        return NextResponse.json(
          { error: "propertyId is required for bulk-approve" },
          { status: 400 }
        );
      }

      const session = await getServerSession(authOptions);
      const userId = getUserId(session);
      if (!userId) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const property = await getPropertyForUser(bulkPropertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }

      const where: { propertyId: string; status: { in: string[] }; type?: string } = {
        propertyId: bulkPropertyId,
        status: { in: ["draft", "pending"] },
      };
      if (bulkType) where.type = bulkType;

      const result = await prisma.guestCommunication.updateMany({
        where,
        data: { status: "pending" },
      });

      return NextResponse.json({ approved: result.count });
    }

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
