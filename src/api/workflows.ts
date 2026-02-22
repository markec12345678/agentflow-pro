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
  userId?: string
): Promise<{
  success: boolean;
  steps: unknown[];
  output: Record<string, unknown>;
  status?: string;
  checkpointId?: string;
}> {
  if (userId) {
    const ownedWorkflow = await getWorkflow(id, userId);
    if (!ownedWorkflow) {
      throw new Error(`Workflow ${id} not found or not owned by user ${userId}`);
    }
  }

  const w = await getWorkflow(id, userId || "");
  if (!w) throw new Error(`Workflow ${id} not found`);

  const executor = new WorkflowExecutor(userApiKeys);
  const progress = await executor.execute(
    w.nodes as Parameters<WorkflowExecutor["execute"]>[0],
    w.edges as Parameters<WorkflowExecutor["execute"]>[1],
    (context ?? {}) as Record<string, unknown>,
    id,
    userId
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

  const result: {
    success: boolean;
    steps: unknown[];
    output: Record<string, unknown>;
    status?: string;
    checkpointId?: string;
  } = {
    success: progress.status === "completed",
    steps,
    output,
  };
  if (progress.status === "pending_approval" && progress.checkpointId) {
    result.status = "pending_approval";
    result.checkpointId = progress.checkpointId;
  }
  return result;
}

export async function listPendingCheckpoints(userId: string) {
  const checkpoints = await prisma.workflowCheckpoint.findMany({
    where: {
      status: "pending_approval",
      workflow: { userId },
    },
    include: { workflow: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return checkpoints;
}

export async function approveCheckpoint(
  checkpointId: string,
  userId: string,
  userApiKeys?: Record<string, string>
): Promise<{ success: boolean; steps: unknown[]; output: Record<string, unknown> }> {
  const cp = await prisma.workflowCheckpoint.findFirst({
    where: { id: checkpointId, status: "pending_approval" },
    include: { workflow: true },
  });
  if (!cp || cp.workflow.userId !== userId) {
    throw new Error("Checkpoint not found or access denied");
  }

  const nodes = cp.workflow.nodes as Array<WorkflowNode>;
  const edges = cp.workflow.edges as Array<{ source: string; target: string }>;
  const node = nodes.find((n) => n.id === cp.nodeId) as WorkflowNode | undefined;
  if (!node || getNodeType(node) !== "Agent") {
    throw new Error("Invalid checkpoint: node not found or not an Agent");
  }

  const executor = new WorkflowExecutor(userApiKeys);
  const output = await executor.executeAgentNode(node, cp.contextSnapshot as Record<string, unknown>);
  const context = { ...(cp.contextSnapshot as Record<string, unknown>), [`${cp.nodeId}_output`]: output };

  await prisma.workflowCheckpoint.update({
    where: { id: checkpointId },
    data: { status: "approved", approvedAt: new Date(), approvedBy: userId },
  });

  const edge = edges.find((e) => e.source === cp.nodeId);
  const nextNodeId = edge?.target;
  if (!nextNodeId) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(context)) if (k.endsWith("_output")) out[k] = v;
    return { success: true, steps: [{ nodeId: cp.nodeId, success: true, output }], output: out };
  }

  const exec = new WorkflowExecutor(userApiKeys);
  const progress = await exec.execute(
    nodes as Parameters<WorkflowExecutor["execute"]>[0],
    edges as Parameters<WorkflowExecutor["execute"]>[1],
    {},
    cp.workflowId,
    userId,
    { startFromNodeId: nextNodeId, initialContext: context }
  );

  const steps = progress.results.map((r) => ({
    nodeId: r.nodeId,
    success: r.status === "success",
    output: r.output,
    error: r.error,
  }));
  const out: Record<string, unknown> = {};
  for (const r of progress.results) {
    if (r.output != null) out[`${r.nodeId}_output`] = r.output;
  }
  for (const [k, v] of Object.entries(context)) {
    if (k.endsWith("_output") && !(k in out)) out[k] = v;
  }

  return {
    success: progress.status === "completed",
    steps: [{ nodeId: cp.nodeId, success: true, output }, ...steps],
    output: out,
  };
}

export async function rejectCheckpoint(
  checkpointId: string,
  userId: string,
  reason?: string
): Promise<void> {
  const cp = await prisma.workflowCheckpoint.findFirst({
    where: { id: checkpointId, status: "pending_approval" },
    include: { workflow: true },
  });
  if (!cp || cp.workflow.userId !== userId) {
    throw new Error("Checkpoint not found or access denied");
  }
  await prisma.workflowCheckpoint.update({
    where: { id: checkpointId },
    data: { status: "rejected", approvedAt: new Date(), approvedBy: userId, rejectionReason: reason ?? null },
  });
}

function getNodeType(node: WorkflowNode): string {
  const topType = node.type;
  const dataType = node.data?.type as string | undefined;
  if (topType && topType !== "workflowNode") return topType;
  if (dataType) return dataType;
  return "Action";
}

type WorkflowNode = { id: string; type?: string; data?: Record<string, unknown> };
