/**
 * AgentFlow Pro - Rust Workflow Executor Wrapper
 *
 * High-performance workflow execution for AI agent orchestration.
 * Uses Rust NAPI bindings for parallel execution and dependency resolution.
 *
 * @module workflow-executor-rust
 */

import {
  executeWorkflow as napiExecuteWorkflow,
  validateWorkflow as napiValidateWorkflow,
  getExecutionPlan as napiGetExecutionPlan,
  createProgressTracker as napiCreateProgressTracker,
  type WorkflowDefinition as NapiWorkflowDefinition,
  type WorkflowNode as NapiWorkflowNode,
  type WorkflowEdge as NapiWorkflowEdge,
  type WorkflowExecutionResult as NapiWorkflowExecutionResult,
  type NodeExecutionResult as NapiNodeExecutionResult,
  type WorkflowProgress as NapiWorkflowProgress,
  NodeStatus,
  WorkflowStatus,
  type NodeStatus as NapiNodeStatus,
  type WorkflowStatus as NapiWorkflowStatus,
} from '../../../rust/workflow-executor/index.js';

// Re-export NodeStatus and WorkflowStatus from NAPI module
export { NodeStatus, WorkflowStatus };

// ============================================================================
// Type Definitions
// ============================================================================

export interface WorkflowNode {
  /** Unique identifier for the node */
  id: string;
  /** Type of node (e.g., 'research', 'content', 'deploy') */
  nodeType: string;
  /** Human-readable name */
  name: string;
  /** Node configuration data as JSON string */
  data: string;
  /** Timeout in milliseconds (optional) */
  timeoutMs?: number;
  /** Number of retry attempts (optional) */
  retryCount?: number;
}

export interface WorkflowEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Optional condition for edge execution */
  condition?: string;
}

export interface WorkflowDefinition {
  /** Unique workflow identifier */
  id: string;
  /** Human-readable workflow name */
  name: string;
  /** Array of workflow nodes */
  nodes: WorkflowNode[];
  /** Array of dependency edges */
  edges: WorkflowEdge[];
  /** Optional metadata as JSON string */
  metadata?: string;
}

export interface NodeExecutionResult {
  /** Node ID */
  nodeId: string;
  /** Execution status */
  status: NodeStatus;
  /** Output data (if successful) */
  output?: string;
  /** Error message (if failed) */
  error?: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Number of retries attempted */
  retries: number;
  /** Start timestamp (ISO 8601) */
  startedAt?: string;
  /** Completion timestamp (ISO 8601) */
  completedAt?: string;
}

export interface WorkflowExecutionResult {
  /** Workflow ID */
  workflowId: string;
  /** Unique execution ID */
  executionId: string;
  /** Overall workflow status */
  status: WorkflowStatus;
  /** Results for each node */
  nodeResults: NodeExecutionResult[];
  /** Total execution duration in milliseconds */
  totalDurationMs: number;
  /** Start timestamp (ISO 8601) */
  startedAt: string;
  /** Completion timestamp (ISO 8601) */
  completedAt?: string;
  /** Error message (if failed) */
  error?: string;
}

export interface WorkflowProgress {
  /** Execution ID */
  executionId: string;
  /** Number of completed nodes */
  completedNodes: number;
  /** Total number of nodes */
  totalNodes: number;
  /** Currently executing node ID */
  currentNode?: string;
  /** Current workflow status */
  status: WorkflowStatus;
  /** Completion percentage (0-100) */
  percentComplete: number;
}

// ============================================================================
// NAPI Module Detection
// ============================================================================

let napiModuleLoaded: boolean | null = null;

/**
 * Check if NAPI module is available
 */
function isNapiAvailable(): boolean {
  if (napiModuleLoaded !== null) {
    return napiModuleLoaded;
  }

  try {
    if (typeof napiExecuteWorkflow === 'function') {
      napiModuleLoaded = true;
      logger.info('[WorkflowExecutor] NAPI module loaded successfully');
      return true;
    }
  } catch (error) {
    logger.warn(
      '[WorkflowExecutor] NAPI module not available:',
      error instanceof Error ? error.message : error
    );
  }

  napiModuleLoaded = false;
  return false;
}

// ============================================================================
// Workflow Executor Class
// ============================================================================

export class WorkflowExecutor {
  private napiAvailable: boolean;

  constructor() {
    this.napiAvailable = isNapiAvailable();
  }

  /**
   * Execute a workflow
   * @param workflow - Workflow definition
   * @returns Promise with execution result
   */
  async execute(workflow: WorkflowDefinition): Promise<WorkflowExecutionResult> {
    if (!this.napiAvailable) {
      throw new Error('Rust NAPI module not available');
    }

    const napiWorkflow: NapiWorkflowDefinition = {
      id: workflow.id,
      name: workflow.name,
      nodes: workflow.nodes.map((n) => ({
        id: n.id,
        nodeType: n.nodeType,
        name: n.name,
        data: n.data,
        timeoutMs: n.timeoutMs,
        retryCount: n.retryCount,
      })),
      edges: workflow.edges.map((e) => ({
        source: e.source,
        target: e.target,
        condition: e.condition,
      })),
      metadata: workflow.metadata,
    };

    const result = await napiExecuteWorkflow(napiWorkflow);

    return this.convertResult(result);
  }

  /**
   * Validate workflow structure without executing
   * @param workflow - Workflow definition
   * @returns True if valid, throws error if invalid
   */
  validate(workflow: WorkflowDefinition): boolean {
    if (!this.napiAvailable) {
      throw new Error('Rust NAPI module not available');
    }

    try {
      const napiWorkflow: NapiWorkflowDefinition = {
        id: workflow.id,
        name: workflow.name,
        nodes: workflow.nodes.map((n) => ({
          id: n.id,
          nodeType: n.nodeType,
          name: n.name,
          data: n.data,
          timeoutMs: n.timeoutMs,
          retryCount: n.retryCount,
        })),
        edges: workflow.edges.map((e) => ({
          source: e.source,
          target: e.target,
          condition: e.condition,
        })),
        metadata: workflow.metadata,
      };

      napiValidateWorkflow(napiWorkflow);
      return true;
    } catch (error) {
      logger.warn('[WorkflowExecutor] Validation failed:', error);
      return false;
    }
  }

  /**
   * Get execution plan (topological order) without running
   * @param workflow - Workflow definition
   * @returns Array of node IDs in execution order
   */
  getPlan(workflow: WorkflowDefinition): string[] {
    if (!this.napiAvailable) {
      throw new Error('Rust NAPI module not available');
    }

    const napiWorkflow: NapiWorkflowDefinition = {
      id: workflow.id,
      name: workflow.name,
      nodes: workflow.nodes.map((n) => ({
        id: n.id,
        nodeType: n.nodeType,
        name: n.name,
        data: n.data,
        timeoutMs: n.timeoutMs,
        retryCount: n.retryCount,
      })),
      edges: workflow.edges.map((e) => ({
        source: e.source,
        target: e.target,
        condition: e.condition,
      })),
      metadata: workflow.metadata,
    };

    return napiGetExecutionPlan(napiWorkflow);
  }

  /**
   * Create a progress tracker
   * @param executionId - Unique execution identifier
   * @param totalNodes - Total number of nodes
   * @returns Progress tracker object
   */
  createProgressTracker(executionId: string, totalNodes: number): WorkflowProgress {
    if (!this.napiAvailable) {
      throw new Error('Rust NAPI module not available');
    }

    const tracker = napiCreateProgressTracker(executionId, totalNodes);
    return {
      executionId: tracker.executionId,
      completedNodes: tracker.completedNodes,
      totalNodes: tracker.totalNodes,
      currentNode: tracker.currentNode,
      status: this.convertWorkflowStatus(tracker.status),
      percentComplete: tracker.percentComplete,
    };
  }

  /**
   * Check if Rust NAPI module is available
   */
  isAvailable(): boolean {
    return this.napiAvailable;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private convertResult(result: NapiWorkflowExecutionResult): WorkflowExecutionResult {
    return {
      workflowId: result.workflowId,
      executionId: result.executionId,
      status: this.convertWorkflowStatus(result.status),
      nodeResults: result.nodeResults.map((r) => this.convertNodeResult(r)),
      totalDurationMs: result.totalDurationMs,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      error: result.error,
    };
  }

  private convertNodeResult(result: NapiNodeExecutionResult): NodeExecutionResult {
    return {
      nodeId: result.nodeId,
      status: this.convertNodeStatus(result.status),
      output: result.output,
      error: result.error,
      durationMs: result.durationMs,
      retries: result.retries,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    };
  }

  private convertNodeStatus(status: NapiNodeStatus): NodeStatus {
    switch (status) {
      case 0:
        return NodeStatus.Pending;
      case 1:
        return NodeStatus.Running;
      case 2:
        return NodeStatus.Completed;
      case 3:
        return NodeStatus.Failed;
      case 4:
        return NodeStatus.Skipped;
      default:
        return NodeStatus.Pending;
    }
  }

  private convertWorkflowStatus(status: NapiWorkflowStatus): WorkflowStatus {
    switch (status) {
      case 0:
        return WorkflowStatus.Queued;
      case 1:
        return WorkflowStatus.Running;
      case 2:
        return WorkflowStatus.Completed;
      case 3:
        return WorkflowStatus.Failed;
      case 4:
        return WorkflowStatus.Cancelled;
      default:
        return WorkflowStatus.Queued;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

const executor = new WorkflowExecutor();

/**
 * Execute a workflow (convenience function)
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition
): Promise<WorkflowExecutionResult> {
  return executor.execute(workflow);
}

/**
 * Validate a workflow (convenience function)
 */
export function validateWorkflow(workflow: WorkflowDefinition): boolean {
  return executor.validate(workflow);
}

/**
 * Get execution plan (convenience function)
 */
export function getExecutionPlan(workflow: WorkflowDefinition): string[] {
  return executor.getPlan(workflow);
}

/**
 * Create progress tracker (convenience function)
 */
export function createProgressTracker(
  executionId: string,
  totalNodes: number
): WorkflowProgress {
  return executor.createProgressTracker(executionId, totalNodes);
}

export default executor;
