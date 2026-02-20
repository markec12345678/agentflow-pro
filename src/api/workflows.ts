/**
 * AgentFlow Pro - Workflow API service
 * Persists workflows to PostgreSQL via Prisma.
 */

import { prisma } from "@/database/schema";
import type { Workflow } from "@/workflows/types";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";

function toWorkflow(row: {
  id: string;
  name: string;
  nodes: unknown;
  edges: unknown;
  metadata: unknown;
  slackWebhookUrl: string | null;
}): Workflow {
  return {
    id: row.id,
    name: row.name,
    nodes: Array.isArray(row.nodes) ? row.nodes : [],
    edges: Array.isArray(row.edges) ? row.edges : [],
    metadata: row.metadata as Workflow["metadata"],
    slackWebhookUrl: row.slackWebhookUrl,
  };
}

export async function createOrUpdateWorkflow(
  w: Workflow,
  userId: string
): Promise<Workflow> {
  const row = await prisma.workflow.upsert({
    where: { id: w.id },
    create: {
      id: w.id,
      name: w.name,
      nodes: w.nodes as object[],
      edges: w.edges as object[],
      metadata: (w.metadata ?? undefined) as object | undefined,
      slackWebhookUrl: w.slackWebhookUrl,
      userId,
    },
    update: {
      name: w.name,
      nodes: w.nodes as object[],
      edges: w.edges as object[],
      metadata: (w.metadata ?? undefined) as object | undefined,
      slackWebhookUrl: w.slackWebhookUrl,
    },
  });
  return toWorkflow(row);
}

export async function getWorkflow(id: string, userId: string): Promise<Workflow | undefined> {
  const row = await prisma.workflow.findUnique({
    where: { id, userId },
  });
  return row ? toWorkflow(row) : undefined;
}

export async function updateWorkflow(
  id: string,
  w: Workflow,
  userId: string
): Promise<Workflow | undefined> {
  try {
    const row = await prisma.workflow.update({
      where: { id, userId },
      data: {
        name: w.name,
        nodes: w.nodes as object[],
        edges: w.edges as object[],
        metadata: (w.metadata ?? undefined) as object | undefined,
        slackWebhookUrl: w.slackWebhookUrl,
      },
    });
    return toWorkflow(row);
  } catch (err) {
    console.error(`Error updating workflow ${id} for user ${userId}:`, err);
    return undefined;
  }
}

export async function deleteWorkflow(id: string, userId: string): Promise<boolean> {
  try {
    const result = await prisma.workflow.delete({
      where: { id, userId },
    });
    return result != null;
  } catch (err) {
    console.error(`Error deleting workflow ${id} for user ${userId}:`, err);
    return false;
  }
}

export async function listWorkflows(userId: string): Promise<Workflow[]> {
  const rows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toWorkflow);
}

export async function runWorkflow(
  id: string,
  context?: Record<string, unknown>,
  userApiKeys?: Record<string, string>,
  userId?: string // New optional userId parameter
): Promise<{ success: boolean; steps: unknown[]; output: Record<string, unknown> }> {
  // If userId is provided, ensure the user owns the workflow
  if (userId) {
    const ownedWorkflow = await getWorkflow(id, userId);
    if (!ownedWorkflow) {
      throw new Error(`Workflow ${id} not found or not owned by user ${userId}`);
    }
  }

  const w = await getWorkflow(id, userId || ""); // Use userId for fetching, or empty string if not provided for backward compatibility
  if (!w) throw new Error(`Workflow ${id} not found`);

  const executor = new WorkflowExecutor(userApiKeys);
  const progress = await executor.execute(
    w.nodes,
    w.edges,
    (context ?? {}) as Record<string, unknown>,
    id
  );

  const steps = progress.results.map((r) => ({
    nodeId: r.nodeId,
    success: r.status === "success",
    output: r.output,
    error: r.error,
  }));

  const output: Record<string, unknown> = {};
  for (const r of progress.results) {
    if (r.output != null) output[`${r.nodeId}_output`] = r.output;
  }

  return {
    success: progress.status === "completed",
    steps,
    output,
  };
}
