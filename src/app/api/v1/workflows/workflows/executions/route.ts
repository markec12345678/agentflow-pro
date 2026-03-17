import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

/**
 * GET /api/workflows/executions
 * Fetch all workflow executions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user's workflows first
    const userWorkflows = await prisma.workflow.findMany({
      where: { userId },
      select: { id: true }
    });

    const workflowIds = userWorkflows.map(w => w.id);

    // Fetch executions for user's workflows
    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflowId: {
          in: workflowIds
        }
      },
      include: {
        workflow: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Limit to last 100 executions
    });

    return NextResponse.json(executions);
  } catch (error) {
    logger.error("Error fetching executions:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}
