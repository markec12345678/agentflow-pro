/**
 * GET /api/tourism/housekeeping/staff
 * Get housekeeping staff for a property
 * Query: propertyId
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

    // Fetch employees for the property
    const employees = await prisma.employee.findMany({
      where: {
        propertyId,
        status: "active",
      },
      include: {
        tasks: {
          where: {
            status: { in: ["pending", "in_progress"] },
          },
          select: {
            id: true,
            taskType: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform staff data
    const staff = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      email: emp.email,
      phone: emp.phone,
      isAvailable: emp.status === "active",
      currentTasks: emp.tasks.length,
      maxTasks: emp.maxTasks,
      avatar: emp.avatar,
    }));

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("[Housekeeping Staff] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping staff" },
      { status: 500 }
    );
  }
}
