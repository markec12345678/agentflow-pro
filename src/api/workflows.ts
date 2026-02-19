/**
 * AgentFlow Pro - Workflow API service
 * Persists workflows to PostgreSQL via Prisma.
 */

import { prisma } from "@/database/schema";
import type { Workflow } from "@/workflows/types";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";

const ANONYMOUS_USER_ID = "anonymous-user-id";

function toWorkflow(row: {
  id: string;
  name: string;
  nodes: unknown;
  edges: unknown;
  metadata: unknown;
}): Workflow {
  return {
    id: row.id,
    name: row.name,
    nodes: Array.isArray(row.nodes) ? row.nodes : [],
    edges: Array.isArray(row.edges) ? row.edges : [],
    metadata: row.metadata as Workflow["metadata"],
  };
}

export async function createOrUpdateWorkflow(
  w: Workflow,
  userId: string = ANONYMOUS_USER_ID
): Promise<Workflow> {
  const row = await prisma.workflow.upsert({
    where: { id: w.id },
    create: {
      id: w.id,
      name: w.name,
      nodes: w.nodes as object[],
      edges: w.edges as object[],
      metadata: (w.metadata ?? undefined) as object | undefined,
      userId,
    },
    update: {
      name: w.name,
      nodes: w.nodes as object[],
      edges: w.edges as object[],
      metadata: (w.metadata ?? undefined) as object | undefined,
    },
  });
  return toWorkflow(row);
}

export async function getWorkflow(id: string): Promise<Workflow | undefined> {
  const row = await prisma.workflow.findUnique({
    where: { id },
  });
  return row ? toWorkflow(row) : undefined;
}

export async function updateWorkflow(
  id: string,
  w: Workflow
): Promise<Workflow | undefined> {
  try {
    const row = await prisma.workflow.update({
      where: { id },
      data: {
        name: w.name,
        nodes: w.nodes as object[],
        edges: w.edges as object[],
        metadata: (w.metadata ?? undefined) as object | undefined,
      },
    });
    return toWorkflow(row);
  } catch {
    return undefined;
  }
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const result = await prisma.workflow.delete({
    where: { id },
  }).catch(() => null);
  return result != null;
}

export async function listWorkflows(
  userId?: string
): Promise<Workflow[]> {
  const rows = await prisma.workflow.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toWorkflow);
}

export async function runWorkflow(
  id: string,
  context?: Record<string, unknown>,
  userApiKeys?: Record<string, string>
): Promise<{ success: boolean; steps: unknown[]; output: Record<string, unknown> }> {
  const w = await getWorkflow(id);
  if (!w) throw new Error(`Workflow ${id} not found`);
  const executor = new WorkflowExecutor(userApiKeys);
  const progress = await executor.execute(
    w.nodes,
    w.edges,
    (context ?? {}) as Record<string, unknown>
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
