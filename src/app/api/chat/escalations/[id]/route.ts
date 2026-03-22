import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

const ALLOWED_STATUSES = ["pending", "acknowledged", "resolved"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user
    ? (session.user as { userId?: string }).userId ?? session.user?.email ?? null
    : null;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Escalation ID required" },
      { status: 400 }
    );
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { status } = body;
  if (!status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const existing = await prisma.chatEscalation.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Escalation not found" },
      { status: 404 }
    );
  }

  // Only owner or admin can update
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = dbUser?.role === "ADMIN";
  if (existing.userId !== userId && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const updated = await prisma.chatEscalation.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ escalation: updated });
}
