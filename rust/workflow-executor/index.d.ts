// STUB: TypeScript definitions for Rust workflow executor
// These are stub types to satisfy TypeScript compiler

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
}

export interface WorkflowExecutionResult {
  status: string;
  output?: any;
}

export function executeWorkflow(
  workflow: WorkflowDefinition
): Promise<WorkflowExecutionResult>;

export function validateWorkflow(
  workflow: WorkflowDefinition
): void;

export function getExecutionPlan(
  workflow: WorkflowDefinition
): string[];
