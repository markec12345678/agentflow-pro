/**
 * API Route: Tourism Calendar
 * 
 * GET  /api/tourism/calendar - Get availability calendar
 * POST /api/tourism/calendar - Create reservation or block date
 * 
 * Refactored to use GetCalendar use case
 */

import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getUserId } from "@/lib/auth-users"
import { GetCalendar } from "@/core/use-cases/get-calendar"
import { handleApiError, withRequestLogging } from "@/app/api/middleware"

/**
 * GET /api/tourism/calendar
 * Get availability calendar for property
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions)
        const userId = getUserId(session)
        
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          )
        }

        // 2. Parse query params
        const { searchParams } = new URL(request.url)
        const propertyId = searchParams.get("propertyId")
        const roomId = searchParams.get("roomId")
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))

        // 3. Validate
        if (!propertyId) {
          return NextResponse.json(
            { error: "Property ID is required" },
            { status: 400 }
          )
        }

        // 4. Execute use case
        // TODO: Inject real repositories
        const useCase = new GetCalendar(
          {} as any, // CalendarRepository
          {} as any  // PropertyRepository
        )

        const result = await useCase.execute({
          propertyId,
          userId,
          year,
          month,
          roomId: roomId || undefined
        })

        // 5. Return response
        return NextResponse.json(result)
      } catch (error) {
        return handleApiError(error, {
          route: "/api/tourism/calendar",
          method: "GET"
        })
      }
    },
    "/api/tourism/calendar"
  )
}

// POST handler remains the same for now (will be refactored separately)
export async function POST(request: NextRequest) {
  // TODO: Refactor to use use cases
  // For now, keep existing implementation
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 })
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
    logger.error("Calendar PATCH error:", error);
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
    logger.error("Calendar DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
