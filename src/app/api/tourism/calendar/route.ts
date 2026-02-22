import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

// GET /api/tourism/calendar - get availability calendar
export async function GET(request: NextRequest) {
  try {
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
          totalAmount: dayReservations[0].totalAmount,
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
        revenue: reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
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
      notes,
    } = body;

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    if (existingReservations.length > 0) {
      return NextResponse.json(
        { error: "Date range conflicts with existing reservation", conflicts: existingReservations },
        { status: 409 }
      );
    }

    if (type === "reservation") {
      // Create or find guest
      const guest = await prisma.guest.upsert({
        where: { email: guestEmail || `${Date.now()}@temp.com` },
        update: { name: guestName, phone: guestPhone },
        create: {
          name: guestName || "Guest",
          email: guestEmail || `${Date.now()}@temp.com`,
          phone: guestPhone,
          propertyId,
        },
      });

      const reservation = await prisma.reservation.create({
        data: {
          propertyId,
          roomId,
          guestId: guest.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          channel: channel || "direct",
          totalAmount,
          notes,
          status: "confirmed",
        },
      });

      return NextResponse.json({ reservation, guest });
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
    const body = await request.json();
    const { id, status, notes, totalAmount } = body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        status,
        notes,
        totalAmount,
      },
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "reservation"; // 'reservation' | 'blocked'

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
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
