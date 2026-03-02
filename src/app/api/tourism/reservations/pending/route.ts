import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const propertyIds = await getPropertyIdsForUser(userId);

    const pendingReservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "pending",
      },
      include: {
        guest: true,
        property: {
          select: { name: true, reservationAutoApprovalRules: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Add "reason for manual review" logic
    const enriched = pendingReservations.map(res => {
      let reason = "Zahtevan ročni pregled";
      const rules = res.property.reservationAutoApprovalRules as { enabled?: boolean; maxAmount?: number; channels?: string[] };
      
      if (rules) {
        if (rules.enabled === false) reason = "Avtomatska potrditev onemogočena";
        else if (rules.maxAmount && (res.totalPrice || 0) > rules.maxAmount) reason = `Znesek presega limit (€${rules.maxAmount})`;
        else if (rules.channels && !rules.channels.includes(res.channel || "")) reason = `Kanal ${res.channel} zahteva pregled`;
      }

      return { ...res, reviewReason: reason };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Pending reservations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, reservationIds, notes } = body;

    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json({ error: "Reservation IDs required" }, { status: 400 });
    }

    const propertyIds = await getPropertyIdsForUser(userId);

    // Verify access
    const count = await prisma.reservation.count({
      where: {
        id: { in: reservationIds },
        propertyId: { in: propertyIds }
      }
    });

    if (count !== reservationIds.length) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "approve") {
      await prisma.reservation.updateMany({
        where: { id: { in: reservationIds } },
        data: { 
          status: "confirmed",
          ...(notes && { notes: { contains: notes } }) // Simple append or set
        }
      });
      
      // Update individual notes if provided
      if (notes) {
        for (const id of reservationIds) {
          const res = await prisma.reservation.findUnique({ where: { id }, select: { notes: true } });
          await prisma.reservation.update({
            where: { id },
            data: { notes: res?.notes ? `${res.notes}\n[Odobritev]: ${notes}` : `[Odobritev]: ${notes}` }
          });
        }
      }
    } else if (action === "reject") {
      await prisma.reservation.updateMany({
        where: { id: { in: reservationIds } },
        data: { status: "cancelled" }
      });
    } else if (action === "escalate") {
      // In a real system, this might set a flag like 'escalatedToDirector: true'
      // or send a notification. For now, we update notes.
      for (const id of reservationIds) {
        const res = await prisma.reservation.findUnique({ where: { id }, select: { notes: true } });
        await prisma.reservation.update({
          where: { id },
          data: { notes: res?.notes ? `${res.notes}\n[ESKALACIJA]: Posredovano direktorju.` : `[ESKALACIJA]: Posredovano direktorju.` }
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pending reservations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
