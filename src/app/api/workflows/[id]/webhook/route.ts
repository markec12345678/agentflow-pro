import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";
import crypto from "crypto";

const prisma = new PrismaClient();

// POST handler to create/reset a webhook token
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { userId?: string }).userId ?? session.user.email;
    const workflowId = params.id;

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found or you do not have permission to access it" }, { status: 404 });
    }

    const webhookToken = crypto.randomBytes(20).toString('hex');

    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: { webhookToken },
    });

    return NextResponse.json({ webhookToken: updatedWorkflow.webhookToken });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate webhook token" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a webhook token
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { userId?: string }).userId ?? session.user.email;
    const workflowId = params.id;

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found or you do not have permission to access it" }, { status: 404 });
    }

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { webhookToken: null },
    });

    return NextResponse.json({ message: "Webhook token removed successfully" });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove webhook token" },
      { status: 500 }
    );
  }
}
