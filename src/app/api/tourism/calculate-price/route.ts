/**
 * AgentFlow Pro - Calculate Price API (TOURISM-EMAIL-ROADMAP §7)
 * GET /api/tourism/calculate-price?propertyId=&checkIn=&checkOut=
 * Returns calculated price with adjustments from PRICING_STRATEGIES.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parseISO } from "date-fns";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { calculatePrice, type SeasonRatesJson } from "@/lib/tourism/pricing-engine";
import { authOptions } from "@/lib/auth-options";

function getUserId(session: {
  user?: { userId?: string; email?: string | null };
} | null): string | null {
  if (!session?.user) return null;
  return (
    (session.user as { userId?: string }).userId ?? session.user.email ?? null
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");

    if (!propertyId || !checkInParam || !checkOutParam) {
      return NextResponse.json(
        { error: "propertyId, checkIn, and checkOut are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const checkIn = parseISO(checkInParam);
    const checkOut = parseISO(checkOutParam);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        { error: "Invalid checkIn or checkOut date (use ISO 8601)" },
        { status: 400 }
      );
    }
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "checkOut must be after checkIn" },
        { status: 400 }
      );
    }

    const baseRate = property.basePrice ?? 100;
    const seasonRates = (property.seasonRates as SeasonRatesJson) ?? null;
    const result = calculatePrice(baseRate, checkIn, checkOut, { seasonRates });
    const currency = property.currency ?? "EUR";

    return NextResponse.json({
      nights: result.nights,
      baseTotal: result.baseTotal,
      adjustments: result.adjustments,
      finalPrice: result.finalPrice,
      currency,
    });
  } catch (error) {
    console.error("Calculate price error:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
