import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  const teamIds = await prisma.teamMember
    .findMany({
      where: { userId },
      select: { teamId: true },
    })
    .then((r) => r.map((m) => m.teamId));

  const workspaces = await prisma.workspace.findMany({
    where: {
      teamId: teamId && teamIds.includes(teamId) ? teamId : { in: teamIds },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      team: { select: { id: true, name: true } },
      _count: { select: { campaignBoards: true } },
    },
  });
  return NextResponse.json(workspaces);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    teamId?: string;
    name?: string;
    type?: string;
  };
  const teamId = body.teamId?.trim();
  const name = body.name?.trim() ?? "New Workspace";
  const type = (body.type === "content_pipeline" || body.type === "campaign")
    ? body.type
    : "campaign";

  if (!teamId) {
    return NextResponse.json(
      { error: "teamId is required" },
      { status: 400 }
    );
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const workspace = await prisma.workspace.create({
    data: { teamId, name, type },
  });
  return NextResponse.json(workspace);
}
