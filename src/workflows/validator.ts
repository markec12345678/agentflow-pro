/**
 * AgentFlow Pro - Workflow validation
 */

import type { Workflow, WorkflowNode, WorkflowEdge } from "./types";
import type { AgentType } from "./nodes";

const VALID_AGENT_TYPES: AgentType[] = ["research", "content", "code", "deploy"];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function getReachableNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): Set<string> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e.target);
  }
  const triggerIds = nodes.filter((n) => n.type === "Trigger").map((n) => n.id);
  const visited = new Set<string>();
  const queue = [...triggerIds];
  for (const id of triggerIds) visited.add(id);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of outgoing.get(cur) ?? []) {
      if (!visited.has(next) && nodeIds.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      if (!outgoing.has(e.source)) outgoing.set(e.source, []);
      outgoing.get(e.source)!.push(e.target);
    }
  }
  const indegree = new Map<string, number>();
  for (const id of nodeIds) indegree.set(id, 0);
  for (const targets of outgoing.values()) {
    for (const t of targets) indegree.set(t, (indegree.get(t) ?? 0) + 1);
  }
  const queue: string[] = [];
  for (const [id, d] of indegree) {
    if (d === 0) queue.push(id);
  }
  let sorted = 0;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    sorted++;
    for (const next of outgoing.get(cur) ?? []) {
      indegree.set(next, (indegree.get(next) ?? 0) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  return sorted !== nodeIds.size;
}

export function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: string[] = [];
  const { nodes, edges } = workflow;

  if (!nodes || nodes.length === 0) {
    errors.push("Workflow must have at least one node");
    return { valid: false, errors };
  }

  const triggerCount = nodes.filter((n) => n.type === "Trigger").length;
  if (triggerCount === 0) {
    errors.push("Workflow must have at least one Trigger node");
  }

  const reachable = getReachableNodes(nodes, edges);
  const orphans = nodes.filter((n) => !reachable.has(n.id));
  if (orphans.length > 0) {
    errors.push(`Orphan nodes (unreachable): ${orphans.map((n) => n.id).join(", ")}`);
  }

  if (hasCycle(nodes, edges)) {
    errors.push("Workflow contains a cycle (must be a DAG)");
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    if (n.type === "Agent") {
      const agentType = n.data?.agentType as string | undefined;
      if (!agentType) {
        errors.push(`Agent node ${n.id} missing agentType`);
      } else if (!VALID_AGENT_TYPES.includes(agentType as AgentType)) {
        errors.push(`Agent node ${n.id} has invalid agentType: ${agentType}`);
      }
    }
    if (n.type === "Condition") {
      const op = n.data?.operator;
      const a = n.data?.operandA;
      const b = n.data?.operandB;
      if (op == null || op === "") errors.push(`Condition node ${n.id} missing operator`);
      if (a == null || a === "") errors.push(`Condition node ${n.id} missing operandA`);
      if (b == null && (op as string) !== "isEmpty")
        errors.push(`Condition node ${n.id} missing operandB (except for isEmpty)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
