import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({
      basePrice: property.basePrice,
      currency: property.currency,
      seasonRates: property.seasonRates,
      pricingRules: property.pricingRules,
    });
  } catch (error) {
    console.error("Pricing API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const { basePrice, seasonRates, pricingRules } = body;

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(seasonRates !== undefined && { seasonRates }),
        ...(pricingRules !== undefined && { pricingRules }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Pricing update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
