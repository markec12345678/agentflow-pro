/**
 * Individual Amenity API for a property
 * GET, DELETE for a specific amenity
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; amenityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, amenityId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const amenity = await prisma.amenity.findFirst({
      where: { 
        id: amenityId,
        propertyId 
      }
    });

    if (!amenity) {
      return NextResponse.json({ error: "Amenity not found" }, { status: 404 });
    }

    return NextResponse.json(amenity);
  } catch (error) {
    logger.error("Amenity API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; amenityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, amenityId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existingAmenity = await prisma.amenity.findFirst({
      where: { 
        id: amenityId,
        propertyId 
      }
    });

    if (!existingAmenity) {
      return NextResponse.json({ error: "Amenity not found" }, { status: 404 });
    }

    await prisma.amenity.delete({
      where: { id: amenityId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Delete amenity API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
