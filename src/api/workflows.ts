/**
 * AgentFlow Pro - Workflow API service
 */

import type { Workflow } from "@/workflows/types";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";

const store = new Map<string, Workflow>();

export function createWorkflow(w: Workflow): Workflow {
  store.set(w.id, { ...w });
  return store.get(w.id)!;
}

export function getWorkflow(id: string): Workflow | undefined {
  return store.get(id);
}

export function updateWorkflow(id: string, w: Workflow): Workflow | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  store.set(id, { ...w, id });
  return store.get(id);
}

export function deleteWorkflow(id: string): boolean {
  return store.delete(id);
}

export function listWorkflows(): Workflow[] {
  return Array.from(store.values());
}

export async function runWorkflow(
  id: string,
  context?: Record<string, unknown>,
  userApiKeys?: Record<string, string>
): Promise<{ success: boolean; steps: unknown[]; output: Record<string, unknown> }> {
  const w = store.get(id);
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
