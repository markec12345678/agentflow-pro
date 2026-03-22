/**
 * Tourism Properties API
 * GET: list all properties for user
 * POST: create new property
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getAppBackend } from "@/memory/app-backend";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { syncPropertyToKg } from "@/lib/tourism/tourism-kg-sync";
import { createPropertySchema } from "@/lib/validations/property-schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const propertyIds = await getPropertyIdsForUser(userId);
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate input with Zod schema
    const validationResult = createPropertySchema.safeParse(body);
    if (!validationResult.success) {
      // Check if name is missing specifically
      const nameError = validationResult.error.issues.find(e => e.path.includes("name"));
      if (nameError) {
        return NextResponse.json({
          error: "Property name is required"
        }, { status: 400 });
      }
      return NextResponse.json({
        error: "Validation failed",
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    const property = await prisma.property.create({
      data: {
        userId,
        name: validatedData.name,
        location: validatedData.location || null,
        type: validatedData.type || null,
        capacity: validatedData.capacity || null,
        description: validatedData.description || null,
        basePrice: validatedData.basePrice || null,
        currency: validatedData.currency || null,
        seasonRates: validatedData.seasonRates || null,
        pricingRules: validatedData.pricingRules || null,
        reservationAutoApprovalRules: validatedData.reservationAutoApprovalRules || null,
        eturizemId: validatedData.eturizemId || null,
        rnoId: validatedData.rnoId || null,
      },
    });

    try {
      await syncPropertyToKg(getAppBackend(), property.id);
    } catch {
      /* KG sync optional */
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("Property creation error:", error);
    return NextResponse.json({ 
      error: "Failed to create property" 
    }, { status: 500 });
  }
}
