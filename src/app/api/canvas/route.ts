import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

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

  const boards = await prisma.campaignBoard.findMany({
    where: {
      OR: [
        { userId },
        ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

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
  };
  const name = body.name?.trim() || "Campaign Board";
  let teamId: string | undefined;

  if (body.teamId?.trim()) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: body.teamId.trim(), userId } },
    });
    const role = membership?.role ?? "";
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Must be owner or admin to create team board" }, { status: 403 });
    }
    teamId = body.teamId.trim();
  }

  const board = await prisma.campaignBoard.create({
    data: {
      userId,
      name,
      teamId: teamId ?? null,
      nodes: (body.nodes ?? []) as object[],
      edges: (body.edges ?? []) as object[],
    },
  });

  return NextResponse.json(board);
}
