/**
 * AgentFlow Pro - Calculate Price API (TOURISM-EMAIL-ROADMAP §7)
 * GET /api/tourism/calculate-price?propertyId=&checkIn=&checkOut=
 * Returns calculated price with adjustments from PRICING_STRATEGIES.
 *
 * RUST-OPTIMIZED: Uses Rust pricing engine for 10-100x performance
 * with automatic TypeScript fallback.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parseISO } from "date-fns";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import {
  calculatePrice,
  calculatePriceBatch,
  getEngineInfo,
  type SeasonRatesJson,
} from "@/lib/tourism/pricing-engine-wrapper";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

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
    const seasonRates = property.seasonRates as SeasonRatesJson | null;

    // Use unified wrapper with automatic Rust/TS fallback
    const result = await calculatePrice(baseRate, checkIn, checkOut, {
      seasonRates: seasonRates ?? undefined,
    });

    const currency = property.currency ?? "EUR";
    const engineInfo = getEngineInfo();

    return NextResponse.json({
      nights: result.nights,
      baseTotal: result.baseTotal,
      adjustments: result.adjustments,
      finalPrice: result.finalPrice,
      currency,
      _meta: {
        engine: engineInfo.engine,
        rustAvailable: engineInfo.available,
      },
    });
  } catch (error) {
    console.error("Calculate price error:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for batch price calculations
 * Useful for calendar views and bulk pricing
 */
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
    const { propertyId, dates } = body;

    if (!propertyId || !dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: "propertyId and dates array are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const baseRate = property.basePrice ?? 100;
    const seasonRates = property.seasonRates as SeasonRatesJson | null;
    const currency = property.currency ?? "EUR";

    // Use unified batch processing with automatic Rust/TS fallback
    const batchRequests = dates.map((d: any, i: number) => ({
      id: `req_${i}`,
      baseRate: baseRate,
      checkIn: d.checkIn,
      checkOut: d.checkOut,
      options: {
        seasonRates: seasonRates ?? undefined,
      },
    }));

    const results = await calculatePriceBatch(batchRequests);
    const engineInfo = getEngineInfo();

    return NextResponse.json({
      results: results.map((r) => ({
        id: r.id,
        nights: r.result.nights,
        baseTotal: r.result.baseTotal,
        adjustments: r.result.adjustments,
        finalPrice: r.result.finalPrice,
        breakdown: r.result.breakdown,
        error: r.error,
      })),
      currency,
      _meta: {
        engine: engineInfo.engine,
        rustAvailable: engineInfo.available,
        batch: true,
      },
    });
  } catch (error) {
    console.error("Batch calculate price error:", error);
    return NextResponse.json(
      { error: "Failed to calculate batch prices" },
      { status: 500 }
    );
  }
}
