import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { triggerCanvasUpdate } from "@/lib/pusher";
import { withRlsContext } from "@/lib/rls-context";

async function canAccessBoard(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.campaignBoard.findUnique({ where: { id: boardId } });
  if (!board) return false;
  if (board.userId === userId) return true;
  if (board.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: board.teamId } },
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
    data?: { nodes?: unknown[]; edges?: unknown[] } | null;
  };

  const updated = await withRlsContext(prisma, userId, (tx) =>
    tx.campaignBoard.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.data !== undefined && { data: body.data as object }),
      },
    })
  );

  const data = updated.data as { nodes?: unknown[]; edges?: unknown[] } | null;
  triggerCanvasUpdate(id, {
    nodes: data?.nodes ?? [],
    edges: data?.edges ?? [],
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

  await withRlsContext(prisma, userId, (tx) =>
    tx.campaignBoard.delete({ where: { id } })
  );
  return NextResponse.json({ success: true });
}
