/**
 * AgentFlow Pro - Condition evaluation and flow control
 */

import type { WorkflowNode, WorkflowEdge } from "./types";
import type { ConditionOperator } from "./nodes";

export interface ExecutionContext {
  [key: string]: unknown;
}

function resolveValue(val: string, context: ExecutionContext): unknown {
  if (val.startsWith("{{") && val.endsWith("}}")) {
    const path = val.slice(2, -2).trim();
    const parts = path.split(".");
    let v: unknown = context;
    for (const p of parts) {
      v = (v as Record<string, unknown>)?.[p];
    }
    return v;
  }
  return val;
}

export function evaluateCondition(
  operator: ConditionOperator,
  operandA: string,
  operandB: string,
  context: ExecutionContext
): boolean {
  const a = resolveValue(operandA, context);
  const b = operator === "isEmpty" ? null : resolveValue(operandB, context);

  switch (operator) {
    case "eq":
      return a == b || String(a) === String(b);
    case "ne":
      return a != b;
    case "gt":
      return Number(a) > Number(b);
    case "lt":
      return Number(a) < Number(b);
    case "gte":
      return Number(a) >= Number(b);
    case "lte":
      return Number(a) <= Number(b);
    case "contains":
      return String(a ?? "").includes(String(b ?? ""));
    case "isEmpty":
      return a == null || a === "" || (Array.isArray(a) && a.length === 0);
    default:
      return false;
  }
}

export function getNextBranch(
  conditionResult: boolean,
  node: WorkflowNode,
  edges: WorkflowEdge[]
): string[] {
  const sourceEdges = edges.filter((e) => e.source === node.id);
  if (sourceEdges.length === 0) return [];

  const handleKey = conditionResult ? "true" : "false";
  const matching = sourceEdges.filter((e) => (e.sourceHandle ?? "true") === handleKey);
  if (matching.length > 0) return matching.map((e) => e.target);

  return conditionResult
    ? [sourceEdges[0]?.target].filter(Boolean)
    : [sourceEdges[1]?.target ?? sourceEdges[0]?.target].filter(Boolean);
}

export async function executeParallel<T>(
  nodeIds: string[],
  executor: (nodeId: string, context: ExecutionContext) => Promise<T>,
  context: ExecutionContext
): Promise<T[]> {
  return Promise.all(nodeIds.map((id) => executor(id, context)));
}
