import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get("agentType")?.trim() || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: { userId: string; agentType?: string; createdAt?: { gte?: Date; lte?: Date } } = {
      userId,
    };
    if (agentType) where.agentType = agentType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const runs = await prisma.agentRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      runs: runs.map((r) => ({
        id: r.id,
        agentType: r.agentType,
        status: r.status,
        input: r.input,
        output: r.output,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch audit" },
      { status: 500 }
    );
  }
}
