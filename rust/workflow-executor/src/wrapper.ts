/**
 * AgentFlow Pro - Workflow Executor TypeScript Wrapper
 * 
 * High-level TypeScript API for the Rust-based workflow executor.
 * Provides type-safe access to workflow execution with additional
 * validation, progress tracking, and error handling.
 */

import * as native from '../index.js';

// Re-export all native types
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowDefinition,
  NodeExecutionResult,
  WorkflowExecutionResult,
  WorkflowProgress,
} from '../index.js';

// Re-export native types (not enums - using type-only exports)
export type { NodeStatus, WorkflowStatus } from '../index.js';

// Re-export native functions
export const {
  executeWorkflow,
  validateWorkflow,
  getExecutionPlan,
  createProgressTracker,
} = native;

/**
 * Workflow execution configuration options
 */
export interface WorkflowExecutorConfig {
  /** Default timeout for nodes in milliseconds (default: 30000) */
  defaultTimeout?: number;
  /** Default retry count for failed nodes (default: 3) */
  defaultRetries?: number;
  /** Enable parallel execution of independent nodes (default: true) */
  enableParallelExecution?: boolean;
  /** Enable detailed logging (default: false) */
  enableLogging?: boolean;
  /** Maximum concurrent node executions (default: 10) */
  maxConcurrency?: number;
}

/**
 * Event listener types for workflow execution
 */
export type WorkflowEventType = 
  | 'node-start'
  | 'node-complete'
  | 'node-failed'
  | 'workflow-start'
  | 'workflow-complete'
  | 'workflow-failed'
  | 'progress';

export type WorkflowEventHandler = (event: WorkflowEvent) => void | Promise<void>;

export interface WorkflowEvent {
  type: WorkflowEventType;
  executionId: string;
  workflowId: string;
  nodeId?: string;
  status?: native.NodeStatus | native.WorkflowStatus;
  progress?: native.WorkflowProgress;
  result?: native.NodeExecutionResult | native.WorkflowExecutionResult;
  error?: string;
  timestamp: string;
}

/**
 * High-level Workflow Executor class with additional utilities
 * 
 * @example
 * ```typescript
 * const executor = new WorkflowExecutor({
 *   defaultTimeout: 60000,
 *   enableLogging: true,
 * });
 * 
 * // Define workflow
 * const workflow: WorkflowDefinition = {
 *   id: 'content-workflow',
 *   name: 'Content Generation Workflow',
 *   nodes: [
 *     {
 *       id: 'research',
 *       nodeType: 'research',
 *       name: 'Research',
 *       data: JSON.stringify({ query: 'AI trends' }),
 *     },
 *     {
 *       id: 'write',
 *       nodeType: 'content',
 *       name: 'Write Article',
 *       data: JSON.stringify({ format: 'blog-post' }),
 *     },
 *   ],
 *   edges: [
 *     { source: 'research', target: 'write' },
 *   ],
 * };
 * 
 * // Execute workflow
 * const result = await executor.execute(workflow);
 * console.log(`Status: ${result.status}`);
 * ```
 */
export class WorkflowExecutor {
  private config: Required<WorkflowExecutorConfig>;
  private eventListeners: Map<WorkflowEventType, Set<WorkflowEventHandler>>;
  private executionHistory: Map<string, native.WorkflowExecutionResult>;

  constructor(config: WorkflowExecutorConfig = {}) {
    this.config = {
      defaultTimeout: config.defaultTimeout ?? 30000,
      defaultRetries: config.defaultRetries ?? 3,
      enableParallelExecution: config.enableParallelExecution ?? true,
      enableLogging: config.enableLogging ?? false,
      maxConcurrency: config.maxConcurrency ?? 10,
    };
    this.eventListeners = new Map();
    this.executionHistory = new Map();
  }

  /**
   * Execute a workflow with all nodes and edges
   *
   * @param workflow - Workflow definition
   * @returns Execution result with status and node results
   */
  async execute(
    workflow: native.WorkflowDefinition
  ): Promise<native.WorkflowExecutionResult> {
    // Validate workflow first
    this.validate(workflow);

    // Apply default configuration to nodes
    const enrichedWorkflow = this.enrichWorkflow(workflow);

    // Emit workflow start event
    await this.emitEvent({
      type: 'workflow-start',
      executionId: `exec-${Date.now()}`,
      workflowId: workflow.id,
      timestamp: new Date().toISOString(),
    });

    try {
      // Execute workflow using native function
      const result = await executeWorkflow(enrichedWorkflow);

      // Generate execution ID if not present
      const executionId = (result as any).executionId || `exec-${Date.now()}`;
      const resultWithId = { ...result, executionId };

      // Store in history
      this.executionHistory.set(executionId, resultWithId);

      // Emit completion event
      if (result.status === native.WorkflowStatus.Completed) {
        await this.emitEvent({
          type: 'workflow-complete',
          executionId,
          workflowId: workflow.id,
          status: result.status,
          result: resultWithId,
          timestamp: new Date().toISOString(),
        });
      } else {
        await this.emitEvent({
          type: 'workflow-failed',
          executionId,
          workflowId: workflow.id,
          status: result.status,
          result: resultWithId,
          error: (result as any).error,
          timestamp: new Date().toISOString(),
        });
      }

      return resultWithId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.emitEvent({
        type: 'workflow-failed',
        executionId: `exec-${Date.now()}`,
        workflowId: workflow.id,
        status: native.WorkflowStatus.Failed,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Validate workflow structure without executing
   * 
   * @param workflow - Workflow definition to validate
   * @returns True if valid, throws error if invalid
   */
  validate(workflow: native.WorkflowDefinition): boolean {
    try {
      validateWorkflow(workflow);
      
      // Additional validation
      if (!workflow.id || workflow.id.trim() === '') {
        throw new Error('Workflow ID is required');
      }

      if (!workflow.name || workflow.name.trim() === '') {
        throw new Error('Workflow name is required');
      }

      if (workflow.nodes.length === 0) {
        throw new Error('Workflow must have at least one node');
      }

      // Validate each node
      for (const node of workflow.nodes) {
        this.validateNode(node);
      }

      // Validate edges
      this.validateEdges(workflow);

      if (this.config.enableLogging) {
        console.log(`[WorkflowExecutor] Workflow "${workflow.name}" validated successfully`);
      }

      return true;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[WorkflowExecutor] Validation failed:`, error);
      }
      throw error;
    }
  }

  /**
   * Get execution plan (topological order) without running
   * 
   * @param workflow - Workflow definition
   * @returns Array of node IDs in execution order
   */
  getPlan(workflow: native.WorkflowDefinition): string[] {
    return getExecutionPlan(workflow);
  }

  /**
   * Create a progress tracker for real-time monitoring
   * 
   * @param executionId - Unique execution identifier
   * @param totalNodes - Total number of nodes in workflow
   * @returns Progress tracker instance
   */
  createTracker(
    executionId: string,
    totalNodes: number
  ): native.WorkflowProgress {
    return createProgressTracker(executionId, totalNodes);
  }

  /**
   * Subscribe to workflow events
   * 
   * @param eventType - Type of event to listen for
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on(eventType: WorkflowEventType, handler: WorkflowEventHandler): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(handler);
    };
  }

  /**
   * Get execution history
   *
   * @param executionId - Optional execution ID to retrieve specific result
   * @returns Execution result or all history
   */
  getHistory(
    executionId?: string
  ): native.WorkflowExecutionResult | Map<string, native.WorkflowExecutionResult> {
    if (executionId) {
      return this.executionHistory.get(executionId)!;
    }
    return new Map(this.executionHistory);
  }

  /**
   * Clear execution history
   * 
   * @param executionId - Optional specific execution to clear
   */
  clearHistory(executionId?: string): void {
    if (executionId) {
      this.executionHistory.delete(executionId);
    } else {
      this.executionHistory.clear();
    }
  }

  /**
   * Build a workflow definition using fluent API
   * 
   * @example
   * ```typescript
   * const workflow = executor.builder()
   *   .id('my-workflow')
   *   .name('My Workflow')
   *   .node('research', 'research', { query: 'test' })
   *   .node('write', 'content', { format: 'blog' })
   *   .edge('research', 'write')
   *   .build();
   * ```
   */
  builder(): WorkflowBuilder {
    return new WorkflowBuilder(this);
  }

  /**
   * Validate individual node
   */
  private validateNode(node: native.WorkflowNode): void {
    if (!node.id || node.id.trim() === '') {
      throw new Error(`Node ID is required`);
    }

    if (!node.nodeType || node.nodeType.trim() === '') {
      throw new Error(`Node type is required for node "${node.id}"`);
    }

    if (!node.name || node.name.trim() === '') {
      throw new Error(`Node name is required for node "${node.id}"`);
    }

    // Validate data is valid JSON if provided
    if (node.data) {
      try {
        JSON.parse(node.data);
      } catch (error) {
        throw new Error(`Node "${node.id}" has invalid JSON data`);
      }
    }

    // Validate timeout and retry values
    if (node.timeoutMs !== undefined && node.timeoutMs < 0) {
      throw new Error(`Node "${node.id}" has invalid timeout`);
    }

    if (node.retryCount !== undefined && node.retryCount < 0) {
      throw new Error(`Node "${node.id}" has invalid retry count`);
    }
  }

  /**
   * Validate edges
   */
  private validateEdges(workflow: native.WorkflowDefinition): void {
    const nodeIds = new Set(workflow.nodes.map((n) => n.id));

    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge source "${edge.source}" not found in nodes`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge target "${edge.target}" not found in nodes`);
      }
    }
  }

  /**
   * Enrich workflow with default configuration
   */
  private enrichWorkflow(
    workflow: native.WorkflowDefinition
  ): native.WorkflowDefinition {
    return {
      ...workflow,
      nodes: workflow.nodes.map((node) => ({
        ...node,
        timeoutMs: node.timeoutMs ?? this.config.defaultTimeout,
        retryCount: node.retryCount ?? this.config.defaultRetries,
      })),
    };
  }

  /**
   * Emit event to all listeners
   */
  private async emitEvent(event: WorkflowEvent): Promise<void> {
    const listeners = this.eventListeners.get(event.type) ?? new Set();
    
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        if (this.config.enableLogging) {
          console.error(`[WorkflowExecutor] Event handler error:`, error);
        }
      }
    }

    if (this.config.enableLogging) {
      console.log(`[WorkflowExecutor] Event: ${event.type}`, {
        executionId: event.executionId,
        workflowId: event.workflowId,
        nodeId: event.nodeId,
      });
    }
  }
}

/**
 * Fluent builder for workflow definitions
 */
export class WorkflowBuilder {
  private workflow: Partial<native.WorkflowDefinition> = {};
  private executor: WorkflowExecutor;

  constructor(executor: WorkflowExecutor) {
    this.executor = executor;
  }

  /**
   * Set workflow ID
   */
  id(id: string): this {
    this.workflow.id = id;
    return this;
  }

  /**
   * Set workflow name
   */
  name(name: string): this {
    this.workflow.name = name;
    return this;
  }

  /**
   * Add a node to the workflow
   * 
   * @param id - Unique node identifier
   * @param nodeType - Type of node (e.g., 'research', 'content', 'deploy')
   * @param data - Node configuration data
   * @param options - Optional node configuration
   */
  node(
    id: string,
    nodeType: string,
    data: Record<string, unknown> | string,
    options: {
      name?: string;
      timeoutMs?: number;
      retryCount?: number;
    } = {}
  ): this {
    const node: native.WorkflowNode = {
      id,
      nodeType,
      name: options.name ?? id,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      timeoutMs: options.timeoutMs,
      retryCount: options.retryCount,
    };

    if (!this.workflow.nodes) {
      this.workflow.nodes = [];
    }
    this.workflow.nodes.push(node);

    return this;
  }

  /**
   * Add an edge (dependency) between nodes
   *
   * @param source - Source node ID
   * @param target - Target node ID
   * @param condition - Optional condition for edge execution
   */
  edge(source: string, target: string, condition?: string): this {
    const edge: native.WorkflowEdge = {
      source,
      target,
      ...(condition && { condition }),
    } as native.WorkflowEdge;

    if (!this.workflow.edges) {
      this.workflow.edges = [];
    }
    this.workflow.edges.push(edge);

    return this;
  }

  /**
   * Set workflow metadata
   */
  metadata(metadata: Record<string, unknown>): this {
    (this.workflow as WorkflowDefinition).metadata = JSON.stringify(metadata);
    return this;
  }

  /**
   * Build and validate the workflow definition
   */
  build(): native.WorkflowDefinition {
    if (!this.workflow.id) {
      throw new Error('Workflow ID is required');
    }
    if (!this.workflow.name) {
      throw new Error('Workflow name is required');
    }
    if (!this.workflow.nodes || this.workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    const completeWorkflow: native.WorkflowDefinition = {
      id: this.workflow.id,
      name: this.workflow.name,
      nodes: this.workflow.nodes,
      edges: this.workflow.edges ?? [],
      metadata: this.workflow.metadata,
    };

    // Validate the built workflow
    this.executor.validate(completeWorkflow);

    return completeWorkflow;
  }

  /**
   * Build and execute the workflow
   */
  async execute(): Promise<native.WorkflowExecutionResult> {
    const workflow = this.build();
    return this.executor.execute(workflow);
  }
}

/**
 * Default workflow executor instance
 */
export const defaultWorkflowExecutor = new WorkflowExecutor();

export default WorkflowExecutor;
