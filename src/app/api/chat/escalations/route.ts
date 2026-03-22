import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user
    ? (session.user as { userId?: string }).userId ?? session.user?.email ?? null
    : null;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  const statusFilter = searchParams.get("status"); // pending | acknowledged | resolved | all
  const all = searchParams.get("all") === "true"; // admin: show all users' escalations

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = dbUser?.role === "ADMIN";

  const where: { userId?: string; status?: string; threadId?: string } = {};
  if (threadId) where.threadId = threadId;
  if (!all || !isAdmin) {
    where.userId = userId;
  }
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  } else if (!statusFilter) {
    where.status = "pending"; // default: only pending
  }

  const take = all && isAdmin ? 50 : 5;
  const escalations = await prisma.chatEscalation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    ...(all && isAdmin
      ? { include: { user: { select: { email: true, name: true } } } }
      : {}),
  });

  return NextResponse.json({ escalations });
}
