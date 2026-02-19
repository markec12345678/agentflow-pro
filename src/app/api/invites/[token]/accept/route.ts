import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

function getUserId(session: { user?: { userId?: string; email?: string } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    await prisma.invite.delete({ where: { id: invite.id } });
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Invite was sent to a different email address" },
      { status: 403 }
    );
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId } },
  });
  if (existing) {
    await prisma.invite.delete({ where: { id: invite.id } });
    return NextResponse.json({ success: true, message: "Already a member" });
  }

  await prisma.teamMember.create({
    data: {
      teamId: invite.teamId,
      userId,
      role: invite.role,
    },
  });

  await prisma.invite.delete({ where: { id: invite.id } });

  const team = await prisma.team.findUnique({
    where: { id: invite.teamId },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  });

  return NextResponse.json({ success: true, team });
}
