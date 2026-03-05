// STUB: TypeScript definitions for Rust workflow executor
// These are stub types to satisfy TypeScript compiler
// On Vercel, TypeScript fallback is used instead

export interface WorkflowNode {
  id: string;
  nodeType: string;
  name: string;
  data: string;
  timeoutMs?: number;
  retryCount?: number;
}

export interface WorkflowEdge {
  source: string;
  target: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export enum NodeStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Skipped = 'skipped',
}

export enum WorkflowStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeStatus;
  output?: any;
  error?: string;
  executionTimeMs?: number;
}

export interface WorkflowExecutionResult {
  status: WorkflowStatus;
  output?: any;
  nodeResults?: NodeExecutionResult[];
  totalExecutionTimeMs?: number;
}

export interface WorkflowProgress {
  completedNodes: number;
  totalNodes: number;
  currentNodeId?: string;
  status: WorkflowStatus;
}

// Stub functions - will throw error if called
export function executeWorkflow(
  workflow: WorkflowDefinition
): Promise<WorkflowExecutionResult>;

export function validateWorkflow(
  workflow: WorkflowDefinition
): void;

export function getExecutionPlan(
  workflow: WorkflowDefinition
): string[];

export function createProgressTracker(
  executionId: string,
  totalNodes: number
): WorkflowProgress;
