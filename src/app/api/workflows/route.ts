import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const where: any = { userId };
    if (propertyId) where.propertyId = propertyId;

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { name, description, propertyId, nodes = [], edges = [] } = body;

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        propertyId,
        name: name || "Brez imena",
        description,
        nodes,
        edges,
        status: "draft",
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
