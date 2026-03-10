/**
 * GET /api/tourism/dynamic-pricing/settings
 * Get dynamic pricing settings for a property
 * Query: propertyId
 * 
 * PUT /api/tourism/dynamic-pricing/settings
 * Update dynamic pricing settings
 * Body: { dynamicPricingEnabled, pricingRules, seasonRates }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    // Extract dynamic pricing settings
    const pricingRules = (property.pricingRules as any) || {};
    const seasonRates = (property.seasonRates as any) || {};

    return NextResponse.json({
      settings: {
        dynamicPricingEnabled: pricingRules.enabled ?? false,
        competitorBasedPricing: pricingRules.competitorBased ?? false,
        competitorAdjustment: pricingRules.competitorAdjustment ?? 0, // percentage
        minPrice: pricingRules.minPrice ?? null,
        maxPrice: pricingRules.maxPrice ?? null,
        weekendMultiplier: pricingRules.weekendMultiplier ?? 1.0,
        lastMinuteDiscount: pricingRules.lastMinuteDiscount ?? 0,
        earlyBirdDiscount: pricingRules.earlyBirdDiscount ?? 0,
        seasonRates: seasonRates || null,
        basePrice: property.basePrice,
      },
    });
  } catch (error) {
    console.error("[Dynamic Pricing Settings GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dynamic pricing settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      dynamicPricingEnabled,
      competitorBasedPricing,
      competitorAdjustment,
      minPrice,
      maxPrice,
      weekendMultiplier,
      lastMinuteDiscount,
      earlyBirdDiscount,
      seasonRates,
    } = body;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    // Build pricingRules JSON
    const pricingRules = {
      enabled: dynamicPricingEnabled ?? false,
      competitorBased: competitorBasedPricing ?? false,
      competitorAdjustment: competitorAdjustment ?? 0,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      weekendMultiplier: weekendMultiplier ?? 1.0,
      lastMinuteDiscount: lastMinuteDiscount ?? 0,
      earlyBirdDiscount: earlyBirdDiscount ?? 0,
    };

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        pricingRules: pricingRules as any,
        seasonRates: seasonRates ? (seasonRates as any) : property.seasonRates,
      },
    });

    return NextResponse.json({
      settings: {
        dynamicPricingEnabled: pricingRules.enabled,
        competitorBasedPricing: pricingRules.competitorBased,
        competitorAdjustment: pricingRules.competitorAdjustment,
        minPrice: pricingRules.minPrice,
        maxPrice: pricingRules.maxPrice,
        weekendMultiplier: pricingRules.weekendMultiplier,
        lastMinuteDiscount: pricingRules.lastMinuteDiscount,
        earlyBirdDiscount: pricingRules.earlyBirdDiscount,
        seasonRates: updatedProperty.seasonRates,
        basePrice: updatedProperty.basePrice,
      },
    });
  } catch (error) {
    console.error("[Dynamic Pricing Settings PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update dynamic pricing settings" },
      { status: 500 }
    );
  }
}
