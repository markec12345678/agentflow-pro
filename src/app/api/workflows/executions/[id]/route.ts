import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

/**
 * DELETE /api/workflows/executions/[id]
 * Delete a workflow execution
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // Get the execution and verify it belongs to the user
    const execution = await prisma.workflowExecution.findUnique({
      where: { id },
      include: {
        workflow: {
          select: { userId: true }
        }
      }
    });

    if (!execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    if (execution.workflow.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the execution
    await prisma.workflowExecution.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting execution:", error);
    return NextResponse.json(
      { error: "Failed to delete execution" },
      { status: 500 }
    );
  }
}
