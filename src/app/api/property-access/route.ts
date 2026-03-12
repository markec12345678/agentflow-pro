/**
 * Property Access API - GET/PUT
 * Manage property-level access control
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/property-access - Get property access for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId");

    if (propertyId) {
      // Get access for specific property
      const access = await prisma.propertyAccess.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });

      return NextResponse.json({ access });
    } else {
      // Get all property access for user
      const accessList = await prisma.propertyAccess.findMany({
        where: { userId: user.id },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return NextResponse.json({ accessList });
    }
  } catch (error) {
    console.error("Get property access error:", error);
    return NextResponse.json(
      { error: "Failed to get property access" },
      { status: 500 }
    );
  }
}

// PUT /api/property-access - Update/create property access
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is admin or has manage settings permission
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      propertyId,
      canView,
      canEdit,
      canDelete,
      canManageReservations,
      canManageReports,
      canManageSettings,
    } = body;

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: "userId and propertyId are required" },
        { status: 400 }
      );
    }

    const access = await prisma.propertyAccess.upsert({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      update: {
        canView,
        canEdit,
        canDelete,
        canManageReservations,
        canManageReports,
        canManageSettings,
      },
      create: {
        userId,
        propertyId,
        canView: canView ?? true,
        canEdit: canEdit ?? false,
        canDelete: canDelete ?? false,
        canManageReservations: canManageReservations ?? false,
        canManageReports: canManageReports ?? false,
        canManageSettings: canManageSettings ?? false,
      },
    });

    return NextResponse.json({ access });
  } catch (error) {
    console.error("Update property access error:", error);
    return NextResponse.json(
      { error: "Failed to update property access" },
      { status: 500 }
    );
  }
}
