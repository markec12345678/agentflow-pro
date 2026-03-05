import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId },
      include: {
        executions: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, description, nodes, edges, status } = body;

    const updated = await prisma.workflow.update({
      where: { id, userId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(nodes && { nodes }),
        ...(edges && { edges }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    await prisma.workflow.delete({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
