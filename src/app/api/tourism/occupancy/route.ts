/**
 * GET /api/tourism/occupancy
 * Returns occupancy and revenue for today, today+1, today+2, MTD, YTD.
 * Query: propertyId (required), date (optional, yyyy-MM-dd)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { getOccupancyForProperty } from "@/lib/tourism/occupancy";
import { startOfDay } from "date-fns";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const dateParam = searchParams.get("date");

    if (!propertyIdParam?.trim()) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyIdParam, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const baseDate = dateParam ? startOfDay(new Date(dateParam)) : startOfDay(new Date());
    const data = await getOccupancyForProperty(prisma, [property.id], baseDate);

    return NextResponse.json({
      date: data.date,
      today: { ...data.today, label: "Danes" },
      todayPlus1: { ...data.todayPlus1, label: "Jutri" },
      todayPlus2: { ...data.todayPlus2, label: "Pojutrišnjem" },
      mtd: { ...data.mtd, label: "MTD" },
      ytd: { ...data.ytd, label: "YTD" },
    });
  } catch (error) {
    console.error("Occupancy error:", error);
    return NextResponse.json({ error: "Failed to fetch occupancy" }, { status: 500 });
  }
}
