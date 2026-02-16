/**
 * AgentFlow Pro - Workflow API service
 */

import type { Workflow } from "@/workflows/types";
import { executeWorkflow } from "@/workflows/executor";
import { Orchestrator } from "@/orchestrator/Orchestrator";
import { createResearchAgent } from "@/agents/research/ResearchAgent";
import { createContentAgent } from "@/agents/content/ContentAgent";
import { createCodeAgent } from "@/agents/code/CodeAgent";
import { createDeployAgent } from "@/agents/deploy/DeployAgent";

const store = new Map<string, Workflow>();

function getOrchestrator(): Orchestrator {
  const orch = new Orchestrator();
  orch.registerAgent(createResearchAgent());
  orch.registerAgent(createContentAgent());
  orch.registerAgent(createCodeAgent());
  orch.registerAgent(createDeployAgent());
  return orch;
}

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
  context?: Record<string, unknown>
): Promise<{ success: boolean; steps: unknown[]; output: Record<string, unknown> }> {
  const w = store.get(id);
  if (!w) throw new Error(`Workflow ${id} not found`);
  const orch = getOrchestrator();
  const result = await executeWorkflow(w, orch, context ?? {});
  return {
    success: result.success,
    steps: result.steps,
    output: result.output,
  };
}
