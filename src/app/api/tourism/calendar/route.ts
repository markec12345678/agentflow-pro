import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

// GET /api/tourism/calendar - get availability calendar
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const roomId = searchParams.get("roomId");
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

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

    // Get date range for the requested month
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Fetch reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        ...(roomId ? { roomId } : {}),
        OR: [
          {
            checkIn: { lte: endDate },
            checkOut: { gte: startDate },
          },
        ],
      },
      include: {
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Fetch blocked dates (maintenance, owner stays, etc.)
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        propertyId,
        ...(roomId ? { roomId } : {}),
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Build calendar grid
    const calendar = days.map((day) => {
      const dayReservations = reservations.filter(
        (r) => day >= r.checkIn && day < r.checkOut
      );
      const isBlocked = blockedDates.some((b) => isSameDay(b.date, day));

      let status: "available" | "booked" | "blocked" | "check-in" | "check-out" = "available";

      if (isBlocked) {
        status = "blocked";
      } else if (dayReservations.length > 0) {
        const reservation = dayReservations[0];
        if (isSameDay(day, reservation.checkIn)) {
          status = "check-in";
        } else if (isSameDay(day, reservation.checkOut)) {
          status = "check-out";
        } else {
          status = "booked";
        }
      }

      return {
        date: format(day, "yyyy-MM-dd"),
        day: day.getDate(),
        status,
        reservation: dayReservations.length > 0 ? {
          id: dayReservations[0].id,
          guestName: dayReservations[0].guest?.name,
          guestEmail: dayReservations[0].guest?.email,
          checkIn: format(dayReservations[0].checkIn, "yyyy-MM-dd"),
          checkOut: format(dayReservations[0].checkOut, "yyyy-MM-dd"),
          channel: dayReservations[0].channel,
          totalAmount: dayReservations[0].totalPrice,
        } : null,
      };
    });

    // Calculate statistics
    const totalDays = calendar.length;
    const bookedDays = calendar.filter((d) => d.status === "booked").length;
    const availableDays = calendar.filter((d) => d.status === "available").length;
    const occupancyRate = Math.round((bookedDays / totalDays) * 100);

    return NextResponse.json({
      calendar,
      month: format(startDate, "MMMM yyyy"),
      stats: {
        totalDays,
        bookedDays,
        availableDays,
        occupancyRate,
        revenue: reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0),
      },
    });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/calendar - create reservation or block date
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      propertyId,
      roomId,
      type, // 'reservation' | 'blocked'
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestPhone,
      channel, // 'direct', 'booking.com', 'airbnb', 'expedia'
      totalAmount,
      deposit,
      touristTax,
      notes,
      allowOverbooking,
    } = body;

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check for conflicts
    const existingReservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        ...(roomId ? { roomId } : {}),
        OR: [
          {
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        ],
      },
    });

    let overbookingWarning: string | undefined;
    if (existingReservations.length > 0) {
      if (!allowOverbooking) {
        return NextResponse.json(
          { error: "Date range conflicts with existing reservation", conflicts: existingReservations },
          { status: 409 }
        );
      }
      overbookingWarning = `Overbooking – prekrivanje z rezervacijo ${existingReservations[0].id}`;
    }

    if (type === "reservation") {
      // Create or find guest
      let guest;
      if (guestEmail) {
        guest = await prisma.guest.findFirst({ where: { email: guestEmail } });
        if (!guest) {
          guest = await prisma.guest.create({
            data: {
              name: guestName || "Guest",
              email: guestEmail,
              phone: guestPhone,
            },
          });
        }
      } else {
        guest = await prisma.guest.create({
          data: {
            name: guestName || "Guest",
            email: `${Date.now()}@temp.com`,
            phone: guestPhone,
          },
        });
      }

      const checkInToken = randomBytes(24).toString("base64url");
      const reservation = await prisma.reservation.create({
        data: {
          propertyId,
          roomId,
          guestId: guest.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          channel: channel || "direct",
          totalPrice: totalAmount,
          deposit: deposit != null ? deposit : undefined,
          touristTax: touristTax != null ? touristTax : undefined,
          notes,
          status: "confirmed",
          checkInToken,
        },
      });

      const { triggerBookingConfirmation } = await import("@/lib/tourism/email-triggers");
      triggerBookingConfirmation(
        reservation.id,
        propertyId,
        guest.id
      ).catch((err) => console.error("Booking confirmation trigger:", err));

      await prisma.notification.create({
        data: {
          userId,
          propertyId,
          type: "success",
          title: "Nova rezervacija",
          message: `${guestName || "Gost"} · ${format(checkInDate, "d.M.yyyy")} - ${format(checkOutDate, "d.M.yyyy")}`,
          link: `/dashboard/tourism/calendar?reservation=${reservation.id}`,
        },
      });

      return NextResponse.json({
        reservation,
        guest,
        ...(overbookingWarning && { warning: overbookingWarning }),
      });
    } else {
      // Block dates
      const days = eachDayOfInterval({ start: checkInDate, end: checkOutDate });
      const blockedDates = await prisma.$transaction(
        days.map((day) =>
          prisma.blockedDate.create({
            data: {
              propertyId,
              roomId,
              date: day,
              reason: notes || "Blocked",
            },
          })
        )
      );

      return NextResponse.json({ blockedDates });
    }
  } catch (error) {
    console.error("Calendar POST error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

// PATCH /api/tourism/calendar - update reservation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes, totalAmount, deposit, touristTax } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.reservation.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(existing.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const updateData: {
      status?: string;
      notes?: string;
      totalPrice?: number;
      deposit?: number | null;
      touristTax?: number | null;
    } = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (totalAmount !== undefined) updateData.totalPrice = totalAmount;
    if (deposit !== undefined) updateData.deposit = deposit == null ? null : Number(deposit);
    if (touristTax !== undefined) updateData.touristTax = touristTax == null ? null : Number(touristTax);

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Calendar PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}

// DELETE /api/tourism/calendar - cancel reservation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "reservation"; // 'reservation' | 'blocked'

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    let propertyId: string | null = null;
    if (type === "reservation") {
      const res = await prisma.reservation.findUnique({
        where: { id },
        select: { propertyId: true },
      });
      propertyId = res?.propertyId ?? null;
    } else {
      const blocked = await prisma.blockedDate.findUnique({
        where: { id },
        select: { propertyId: true },
      });
      propertyId = blocked?.propertyId ?? null;
    }

    if (!propertyId) {
      return NextResponse.json({ error: type === "reservation" ? "Reservation not found" : "Blocked date not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    if (type === "reservation") {
      await prisma.reservation.update({
        where: { id },
        data: { status: "cancelled" },
      });
    } else {
      await prisma.blockedDate.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
