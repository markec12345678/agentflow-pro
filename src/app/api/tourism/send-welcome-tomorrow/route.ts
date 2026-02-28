/**
 * POST /api/tourism/send-welcome-tomorrow
 * Create and send welcome/confirmation emails to all guests arriving tomorrow.
 * Body: { propertyId?: string } - optional filter by property
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { startOfDay, addDays, format } from "date-fns";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/database/schema";
import { getPropertyIdsForUser, getPropertyForUser } from "@/lib/tourism/property-access";
import { sendPendingGuestEmails } from "@/lib/tourism/email-sender";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002")
  );
}

/**
 * GET /api/tourism/send-welcome-tomorrow
 * Returns count of guests arriving tomorrow (for UI label).
 * Query: propertyId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    let propertyIds: string[];

    if (propertyIdParam?.trim()) {
      const property = await getPropertyForUser(propertyIdParam, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
      propertyIds = [property.id];
    } else {
      propertyIds = await getPropertyIdsForUser(userId);
    }

    if (propertyIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);

    const count = await prisma.reservation.count({
      where: {
        propertyId: { in: propertyIds },
        status: "confirmed",
        checkIn: { gte: tomorrow, lt: dayAfterTomorrow },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("send-welcome-tomorrow GET error:", error);
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as { propertyId?: string };
    let propertyIds: string[];

    if (body.propertyId?.trim()) {
      const property = await getPropertyForUser(body.propertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
      propertyIds = [property.id];
    } else {
      propertyIds = await getPropertyIdsForUser(userId);
    }

    if (propertyIds.length === 0) {
      return NextResponse.json({ queued: 0, sent: 0, message: "No properties" });
    }

    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);

    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "confirmed",
        checkIn: { gte: tomorrow, lt: dayAfterTomorrow },
      },
      include: {
        guest: true,
        property: { select: { name: true } },
      },
    });

    let queued = 0;
    for (const r of reservations) {
      if (!r.guest?.email?.trim() || !r.guest.email.includes("@")) continue;

      const existing = await prisma.guestCommunication.findFirst({
        where: {
          propertyId: r.propertyId,
          guestId: r.guestId,
          type: "booking-confirmation",
          variables: { path: ["reservationId"], equals: r.id },
        },
      });
      if (existing) continue;

      const guestName = r.guest?.name ?? "Guest";
      const propertyName = r.property?.name ?? "Property";
      const checkInStr = format(r.checkIn, "yyyy-MM-dd");
      const checkOutStr = format(r.checkOut, "yyyy-MM-dd");
      const totalPrice = r.totalPrice != null ? String(r.totalPrice) : "—";
      const checkInSection =
        r.checkInToken != null
          ? `\n\nSelf check-in (eTurizem): ${getBaseUrl()}/check-in/${r.checkInToken}\n\n`
          : "\n\n";

      const content = `Dear ${guestName},

Thank you for your reservation at ${propertyName}.

**Reservation details:**
- Check-in: ${checkInStr}
- Check-out: ${checkOutStr}
- Total: ${totalPrice}
${checkInSection}We look forward to welcoming you.

Best regards,
${propertyName}`;

      await prisma.guestCommunication.create({
        data: {
          propertyId: r.propertyId,
          guestId: r.guestId,
          type: "booking-confirmation",
          channel: "email",
          subject: `Booking confirmation – ${propertyName}`,
          content,
          status: "pending",
          variables: {
            guest_name: guestName,
            property_name: propertyName,
            check_in: checkInStr,
            check_out: checkOutStr,
            total_price: totalPrice,
            reservationId: r.id,
          },
        },
      });
      queued++;
    }

    const emailResult = await sendPendingGuestEmails();

    return NextResponse.json({
      queued,
      sent: emailResult.sent,
      total: reservations.length,
    });
  } catch (error) {
    console.error("send-welcome-tomorrow error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send" },
      { status: 500 }
    );
  }
}
