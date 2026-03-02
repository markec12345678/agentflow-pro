import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(executions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch executions" }, { status: 500 });
  }
}
