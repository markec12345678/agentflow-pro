import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { parseISO, startOfDay, endOfDay, format } from "date-fns";
import { sendEmail } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");
    const roomId = searchParams.get("roomId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const q = searchParams.get("q");

    const userPropertyIds = await getPropertyIdsForUser(userId);
    
    // If specific propertyId requested, check if user has access
    const targetPropertyIds = propertyId 
      ? (userPropertyIds.includes(propertyId) ? [propertyId] : [])
      : userPropertyIds;

    if (targetPropertyIds.length === 0 && propertyId) {
      return NextResponse.json({ error: "Property access denied" }, { status: 403 });
    }

    const where: any = {
      propertyId: { in: targetPropertyIds },
    };

    if (status) {
      where.status = status;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (startDate || endDate) {
      where.OR = [
        {
          checkIn: {
            ...(startDate ? { gte: startOfDay(parseISO(startDate)) } : {}),
            ...(endDate ? { lte: endOfDay(parseISO(endDate)) } : {}),
          },
        },
        {
          checkOut: {
            ...(startDate ? { gte: startOfDay(parseISO(startDate)) } : {}),
            ...(endDate ? { lte: endOfDay(parseISO(endDate)) } : {}),
          },
        },
      ];
    }

    if (q) {
      where.OR = [
        ...(where.OR || []),
        { id: { contains: q, mode: "insensitive" } },
        { guest: { name: { contains: q, mode: "insensitive" } } },
        { guest: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        guest: true,
        property: { select: { name: true } },
      },
      orderBy: { checkIn: "desc" },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Reservations API error:", error);
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
    const { action, reservationIds, reservationData } = body;

    const userPropertyIds = await getPropertyIdsForUser(userId);

    // 1. Bulk actions
    if (action === "check-in" || action === "check-out") {
      if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
        return NextResponse.json({ error: "Reservation IDs required" }, { status: 400 });
      }

      const reservations = await prisma.reservation.findMany({
        where: {
          id: { in: reservationIds },
          propertyId: { in: userPropertyIds },
        },
      });

      if (reservations.length !== reservationIds.length) {
        return NextResponse.json({ error: "Access denied to some reservations" }, { status: 403 });
      }

      if (action === "check-in") {
        await prisma.reservation.updateMany({
          where: { id: { in: reservationIds } },
          data: { status: "checked-in" },
        });
      } else {
        await prisma.reservation.updateMany({
          where: { id: { in: reservationIds } },
          data: { status: "checked-out" },
        });
      }

      return NextResponse.json({ success: true, updated: reservationIds.length });
    }

    // 2. Create new reservation
    if (!reservationData) {
      return NextResponse.json({ error: "Reservation data required" }, { status: 400 });
    }

    const { 
      propertyId, 
      guestId, 
      guestData, 
      checkIn, 
      checkOut, 
      roomId, 
      totalPrice, 
      notes, 
      channel = "direct",
      sendEmail: shouldSendEmail = true
    } = reservationData;

    if (!propertyId || !userPropertyIds.includes(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    let finalGuestId = guestId;

    // Create guest if doesn't exist
    if (!finalGuestId && guestData) {
      const guest = await prisma.guest.create({
        data: {
          ...guestData,
          propertyId,
        },
      });
      finalGuestId = guest.id;
    }

    if (!finalGuestId) {
      return NextResponse.json({ error: "Guest information required" }, { status: 400 });
    }

    const newReservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestId: finalGuestId,
        roomId,
        checkIn: parseISO(checkIn),
        checkOut: parseISO(checkOut),
        totalPrice,
        notes,
        channel,
        status: "confirmed",
      },
      include: {
        guest: true,
        property: true,
      },
    });

    // Send confirmation email if requested
    if (shouldSendEmail && newReservation.guest?.email) {
      try {
        const checkInDate = format(newReservation.checkIn, "d. MMM yyyy");
        const checkOutDate = format(newReservation.checkOut, "d. MMM yyyy");
        
        await sendEmail(
          newReservation.guest.email,
          `Potrditev rezervacije: ${newReservation.property.name}`,
          `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; max-width: 600px;">
  <h2 style="color: #1e3a8a;">Potrditev vaše rezervacije</h2>
  <p>Pozdravljeni, <strong>${newReservation.guest.name}</strong>!</p>
  <p>Z veseljem potrjujemo vašo rezervacijo v <strong>${newReservation.property.name}</strong>.</p>
  
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; color: #64748b;">Šifra rezervacije: <strong>#${newReservation.id.slice(-6).toUpperCase()}</strong></p>
    <div style="display: flex; gap: 40px; margin-top: 15px;">
      <div>
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Prihod</p>
        <p style="margin: 5px 0 0 0; font-weight: bold;">${checkInDate}</p>
      </div>
      <div style="margin-left: 40px;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Odhod</p>
        <p style="margin: 5px 0 0 0; font-weight: bold;">${checkOutDate}</p>
      </div>
    </div>
    <p style="margin-top: 15px; font-size: 14px;">Skupni znesek: <strong>${newReservation.totalPrice?.toLocaleString("sl-SI")} €</strong></p>
  </div>
  
  <p>Veselimo se vašega obiska!</p>
  <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; pt: 15px; font-size: 12px; color: #94a3b8;">
    Ta e-pošta je bila poslana preko AgentFlow Pro sistema.
  </p>
</body>
</html>`
        );
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
        // We don't fail the whole request if email fails
      }
    }

    return NextResponse.json(newReservation);
  } catch (error) {
    console.error("Reservations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
