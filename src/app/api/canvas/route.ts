import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { withRlsContext } from "@/lib/rls-context";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const teamIds = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  }).then((r) => r.map((m) => m.teamId));

  const boards = await withRlsContext(prisma, userId, async (tx) =>
    tx.campaignBoard.findMany({
      where: {
        OR: [
          { userId },
          ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
    })
  );

  return NextResponse.json({ boards });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    nodes?: unknown[];
    edges?: unknown[];
    teamId?: string;
    workspaceId?: string;
  };
  const name = body.name?.trim() || "Campaign Board";
  const teamId = body.teamId?.trim();

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    const role = membership?.role ?? "";
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Must be owner or admin to create team board" }, { status: 403 });
    }
  }

  let workspaceId: string | null = null;
  if (body.workspaceId?.trim()) {
    const ws = await prisma.workspace.findFirst({
      where: {
        id: body.workspaceId.trim(),
        team: { members: { some: { userId } } },
      },
    });
    if (ws) workspaceId = ws.id;
  }

  const board = await prisma.campaignBoard.create({
    data: {
      userId,
      name,
      teamId: teamId || userId,
      workspaceId,
      data: { nodes: body.nodes ?? [], edges: body.edges ?? [] } as object,
    },
  });

  return NextResponse.json(board);
}
