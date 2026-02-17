import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeysForExecution } from "@/lib/user-keys";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      nodes: unknown[];
      edges: unknown[];
      context?: Record<string, unknown>;
    };
    const { nodes, edges, context } = body;

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: "Missing nodes or edges" },
        { status: 400 }
      );
    }

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: "nodes and edges must be arrays" },
        { status: 400 }
      );
    }

    let userApiKeys: Record<string, string> | undefined;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId =
        (session.user as { userId?: string }).userId ?? session.user.email;
      if (userId) {
        userApiKeys = await getUserApiKeysForExecution(userId);
      }
    }

    const executor = new WorkflowExecutor(userApiKeys);
    const progress = await executor.execute(
      nodes as Parameters<WorkflowExecutor["execute"]>[0],
      edges as Parameters<WorkflowExecutor["execute"]>[1],
      (context ?? {}) as Record<string, unknown>
    );

    return NextResponse.json({
      success: progress.status === "completed",
      progress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 }
    );
  }
}
