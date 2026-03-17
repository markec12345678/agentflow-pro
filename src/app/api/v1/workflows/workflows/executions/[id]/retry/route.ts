import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

/**
 * POST /api/workflows/executions/[id]/retry
 * Retry a failed workflow execution
 */
export async function POST(
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

    // Create new execution with same workflow
    const newExecution = await prisma.workflowExecution.create({
      data: {
        workflowId: execution.workflowId,
        status: "pending",
        logs: [{
          step: "Retry",
          message: `Ponovni zagon izvajanja (original: ${id})`,
          time: new Date().toISOString()
        }]
      }
    });

    // Simulate execution start (in production, trigger actual workflow)
    setTimeout(async () => {
      await prisma.workflowExecution.update({
        where: { id: newExecution.id },
        data: {
          status: "running",
          startedAt: new Date(),
          logs: {
            push: {
              step: "Start",
              message: "Začenjam ponovno izvajanje...",
              time: new Date().toISOString()
            }
          }
        }
      });

      // Simulate completion (replace with actual workflow execution)
      setTimeout(async () => {
        await prisma.workflowExecution.update({
          where: { id: newExecution.id },
          data: {
            status: "completed",
            finishedAt: new Date(),
            logs: {
              push: {
                step: "Complete",
                message: "Ponovno izvajanje uspešno zaključeno.",
                time: new Date().toISOString()
              }
            },
            result: { success: true, retriedFrom: id }
          }
        });
      }, 3000);
    }, 500);

    return NextResponse.json(newExecution);
  } catch (error) {
    logger.error("Error retrying execution:", error);
    return NextResponse.json(
      { error: "Failed to retry execution" },
      { status: 500 }
    );
  }
}
