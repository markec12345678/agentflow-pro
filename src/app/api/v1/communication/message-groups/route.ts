/**
 * Message Groups API
 * GET - Get user's groups
 * POST - Create new group
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/message-groups - Get user's groups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.messageGroupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const groups = memberships.map(m => m.group);

    return NextResponse.json({ groups });
  } catch (error) {
    logger.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Failed to get groups" },
      { status: 500 }
    );
  }
}

// POST /api/message-groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, propertyId, memberIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Group name required" },
        { status: 400 }
      );
    }

    // Create group
    const group = await prisma.messageGroup.create({
      data: {
        name,
        description: description || null,
        propertyId: propertyId || null,
        createdBy: session.user.id,
        members: {
          create: [
            // Add creator as admin
            {
              userId: session.user.id,
              role: "admin"
            },
            // Add other members
            ...(memberIds || []).map((userId: string) => ({
              userId,
              role: "member"
            }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    logger.error("Create group error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
