import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeysForExecution } from "@/lib/user-keys";
import { getAppBackend } from "@/memory/app-backend";
import { getUserId } from "@/lib/auth-users";
import { canRunAgent, recordAgentRun } from "@/api/usage";
import { withSentryLogging, ApiOperations } from "@/lib/sentry-api-logging";

export const POST = withSentryLogging(async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      nodes: unknown[];
      edges: unknown[];
      context?: Record<string, unknown>;
      workflowId?: string;
      workflowName?: string;
    };
    const { nodes, edges, context, workflowId, workflowName } = body;

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

    const userId = getUserId(session);
    if (userId) {
      const allowed = await canRunAgent(userId);
      if (!allowed) {
        return NextResponse.json(
          { error: "Usage limit reached. Upgrade your plan to continue." },
          { status: 429 }
        );
      }
    }

    let userApiKeys: Record<string, string> | undefined;
    if (userId) {
      userApiKeys = await getUserApiKeysForExecution(userId);
    }

    const executor = new WorkflowExecutor(userApiKeys);
    const progress = await executor.execute(
      nodes as Parameters<WorkflowExecutor["execute"]>[0],
      edges as Parameters<WorkflowExecutor["execute"]>[1],
      (context ?? {}) as Record<string, unknown>
    );

    if (userId) {
      if (progress.status === "completed") {
        await recordAgentRun(userId, "workflow", {
          workflowId: workflowId ?? progress.workflowId,
          creditsConsumed: 4,
          status: "completed",
        });
      } else if (progress.status === "error") {
        await recordAgentRun(userId, "workflow", {
          workflowId: workflowId ?? progress.workflowId,
          status: "failed",
          output: progress.errors?.[0]
            ? { error: progress.errors[0].message }
            : undefined,
        });
      }
    }

    if (progress.status === "completed") {
      const backend = getAppBackend();
      const entityName =
        workflowId ?? progress.workflowId ?? `wf-${Date.now()}`;
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
    console.error("Error in workflow execution API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 }
    );
  }
}
