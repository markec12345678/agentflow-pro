import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

function _isAdmin(team: { ownerId: string; members: { userId: string; role: string }[] }, userId: string): boolean {
  if (team.ownerId === userId) return true;
  const member = team.members.find((m) => m.userId === userId);
  return member?.role === "admin" || member?.role === "owner" || false;
}

function isMember(team: { ownerId: string; members: { userId: string }[] }, userId: string): boolean {
  if (team.ownerId === userId) return true;
  return team.members.some((m) => m.userId === userId);
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
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      invites: true,
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  if (!isMember(team, userId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(team);
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
  const team = await prisma.team.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  if (team.ownerId !== userId) {
    return NextResponse.json({ error: "Only owner can delete team" }, { status: 403 });
  }

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
