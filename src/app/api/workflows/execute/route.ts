import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeysForExecution } from "@/lib/user-keys";
import { getAppBackend } from "@/memory/app-backend";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const authorizationHeader = request.headers.get("Authorization");
    const body = (await request.json()) as {
      nodes?: unknown[];
      edges?: unknown[];
      context?: Record<string, unknown>;
      workflowId?: string;
      workflowName?: string;
    };

    let { nodes, edges, context, workflowId, workflowName } = body;
    let userApiKeys: Record<string, string> | undefined;
    let userId: string | undefined;

    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      const webhookToken = authorizationHeader.substring(7);
      const workflow = await prisma.workflow.findUnique({
        where: { webhookToken },
      });

      if (!workflow) {
        return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
      }

      nodes = workflow.nodes as unknown[];
      edges = workflow.edges as unknown[];
      workflowId = workflow.id;
      workflowName = workflow.name;
      userId = workflow.userId;

    } else {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        userId = (session.user as { userId?: string }).userId ?? session.user.email;
      }

      if (!nodes || !edges) {
        return NextResponse.json(
          { error: "Missing nodes or edges for session-based execution" },
          { status: 400 }
        );
      }
  
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        return NextResponse.json(
          { error: "nodes and edges must be arrays" },
          { status: 400 }
        );
      }
    }

    if (userId) {
      userApiKeys = await getUserApiKeysForExecution(userId);
    }

    const executor = new WorkflowExecutor(userApiKeys);
    const progress = await executor.execute(
      nodes as Parameters<WorkflowExecutor["execute"]>[0],
      edges as Parameters<WorkflowExecutor["execute"]>[1],
      (context ?? {}) as Record<string, unknown>
    );

    if (progress.status === "completed") {
      const backend = getAppBackend();
      const entityName = workflowId ?? progress.workflowId ?? `wf-${Date.now()}`;
      const obs = [
        JSON.stringify(progress.results),
        ...(workflowName ? [`Workflow: ${workflowName}`] : []),
      ];
      backend.createEntities([
        { name: entityName, entityType: "Workflow", observations: obs },
      ]);
    }

    return NextResponse.json({
      success: progress.status === "completed",
      progress,
      ...(progress.status === "error" && {
        error: progress.errors[0]?.message ?? "Execution failed",
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 }
    );
  }
}
