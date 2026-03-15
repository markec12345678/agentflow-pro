/**
 * Custom Roles API - GET/POST
 * Manage custom roles with granular permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/roles - Get all custom roles for user
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

    const customRoles = await prisma.customRole.findMany({
      where: { userId: user.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({ roles: customRoles });
  } catch (error) {
    logger.error("Get roles error:", error);
    return NextResponse.json(
      { error: "Failed to get roles" },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create custom role
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    const customRole = await prisma.customRole.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        permissions: permissionIds
          ? {
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
                granted: true,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({ role: customRole });
  } catch (error) {
    logger.error("Create role error:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
