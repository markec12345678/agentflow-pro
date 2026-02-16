/**
 * AgentFlow Pro - Node type definitions and factory
 */

import type { WorkflowNode, Position } from "./types";

export type AgentType = "research" | "content" | "code" | "deploy";

export type ConditionOperator =
  | "eq"
  | "ne"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "contains"
  | "isEmpty";

export type TriggerType = "manual" | "webhook" | "schedule";

export interface AgentNodeData {
  agentType: AgentType;
  input?: Record<string, unknown>;
  label?: string;
}

export interface ConditionNodeData {
  operator: ConditionOperator;
  operandA: string;
  operandB: string;
  branchTrue?: string;
  branchFalse?: string;
  label?: string;
}

export interface ActionNodeData {
  action: string;
  params?: Record<string, unknown>;
  label?: string;
}

export interface TriggerNodeData {
  triggerType: TriggerType;
  config?: Record<string, unknown>;
  label?: string;
}

export const NODE_TYPES = ["Agent", "Condition", "Action", "Trigger"] as const;

let nodeIdCounter = 0;

export function createNode(
  id: string | undefined,
  type: WorkflowNode["type"],
  data: Record<string, unknown>,
  position?: Position
): WorkflowNode {
  const nodeId = id ?? `node_${++nodeIdCounter}_${Date.now()}`;
  const label = (data?.label as string) ?? type;
  return {
    id: nodeId,
    type,
    data: { ...data, label },
    position: position ?? { x: 0, y: 0 },
  };
}
