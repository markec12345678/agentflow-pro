import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId },
    });

    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: "running",
        startedAt: new Date(),
        logs: [{ step: "Start", message: "Začenjam izvajanje delovnega toka...", time: new Date().toISOString() }],
      },
    });

    // Simulate execution logic
    // In production, this would trigger a background job or LangGraph run
    setTimeout(async () => {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          finishedAt: new Date(),
          logs: [
            { step: "Start", message: "Začenjam izvajanje delovnega toka...", time: new Date().toISOString() },
            { step: "Agent", message: "Agent 'Content Creator' je uspešno obdelal vhodne podatke.", time: new Date().toISOString() },
            { step: "Finish", message: "Delovni tok uspešno zaključen.", time: new Date().toISOString() }
          ],
          result: { success: true, message: "Workflow executed successfully" }
        }
      });
    }, 2000);

    return NextResponse.json(execution);
  } catch (error) {
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
