import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { triggerCanvasUpdate } from "@/lib/pusher";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

async function canAccessBoard(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.campaignBoard.findUnique({ where: { id: boardId } });
  if (!board) return false;
  if (board.userId === userId) return true;
  if (board.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: board.teamId, userId } },
    });
    return !!membership;
  }
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await canAccessBoard(userId, id);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const board = await prisma.campaignBoard.findUnique({ where: { id } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(board);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await canAccessBoard(userId, id);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    nodes?: unknown[];
    edges?: unknown[];
    metadata?: unknown;
  };

  const updated = await prisma.campaignBoard.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nodes !== undefined && { nodes: body.nodes as object[] }),
      ...(body.edges !== undefined && { edges: body.edges as object[] }),
      ...(body.metadata !== undefined && { metadata: body.metadata as object }),
    },
  });

  triggerCanvasUpdate(id, {
    nodes: (updated.nodes as unknown[]) ?? [],
    edges: (updated.edges as unknown[]) ?? [],
    name: updated.name,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await canAccessBoard(userId, id);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.campaignBoard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
