/**
 * AgentFlow Pro - Workflow schema types
 */

export type NodeType = "Agent" | "Condition" | "Action" | "Trigger";

export interface Position {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  data: Record<string, unknown>;
  position?: Position;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Connection {
  source: string;
  target: string;
}

export interface WorkflowMetadata {
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: WorkflowMetadata;
}
