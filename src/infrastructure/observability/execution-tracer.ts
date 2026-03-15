/**
 * AgentFlow Pro - Execution Tracing & Decision Path Analysis
 * Full observability for agent workflows
 */

export interface ExecutionTrace {
  traceId: string;
  workflowId?: string;
  agentId: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  steps: TraceStep[];
  decisions: AgentDecision[];
  variables: Map<string, any>;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  error?: string;
  metadata: {
    userId?: string;
    environment: 'development' | 'staging' | 'production';
    tags?: string[];
  };
}

export interface TraceStep {
  stepId: string;
  timestamp: number;
  type: 'action' | 'decision' | 'api_call' | 'state_change' | 'error';
  name: string;
  input?: any;
  output?: any;
  duration: number;
  metadata?: any;
}

export interface AgentDecision {
  decisionId: string;
  timestamp: number;
  agentId: string;
  decisionType: 'action_selection' | 'parameter_choice' | 'branch_selection' | 'tool_selection';
  options: Array<{
    option: string;
    score?: number;
    rationale?: string;
  }>;
  selectedOption: string;
  rationale: string;
  confidence: number; // 0-1
  context: any;
}

export interface TraceQuery {
  traceId?: string;
  workflowId?: string;
  agentId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  limit?: number;
}

export class ExecutionTracer {
  private traces: Map<string, ExecutionTrace> = new Map();
  private traceListeners: Array<(trace: ExecutionTrace) => void> = [];

  /**
   * Start new execution trace
   */
  startTrace(
    agentId: string,
    workflowId?: string,
    parentId?: string,
    metadata?: Partial<ExecutionTrace['metadata']>
  ): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const trace: ExecutionTrace = {
      traceId,
      workflowId,
      agentId,
      parentId,
      startTime: Date.now(),
      status: 'running',
      steps: [],
      decisions: [],
      variables: new Map(),
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0,
      },
      cost: 0,
      metadata: {
        environment: (process.env.NODE_ENV as any) || 'development',
        ...metadata,
      },
    };

    this.traces.set(traceId, trace);
    this.notifyListeners(trace);

    return traceId;
  }

  /**
   * Log a step in execution
   */
  logStep(
    traceId: string,
    step: Omit<TraceStep, 'stepId' | 'timestamp' | 'duration'>
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const startTime = Date.now();
    const traceStep: TraceStep = {
      ...step,
      stepId: `step_${trace.steps.length + 1}`,
      timestamp: startTime,
      duration: 0, // Will be updated on step completion
    };

    trace.steps.push(traceStep);
    this.notifyListeners(trace);
  }

  /**
   * Complete a step
   */
  completeStep(traceId: string, stepId: string, output?: any, error?: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const step = trace.steps.find(s => s.stepId === stepId);
    if (!step) return;

    step.output = output;
    step.duration = Date.now() - step.timestamp;
    
    if (error) {
      step.type = 'error';
      trace.error = error;
    }

    this.notifyListeners(trace);
  }

  /**
   * Log agent decision
   */
  logDecision(
    traceId: string,
    decision: Omit<AgentDecision, 'decisionId' | 'timestamp'>
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const agentDecision: AgentDecision = {
      ...decision,
      decisionId: `decision_${trace.decisions.length + 1}`,
      timestamp: Date.now(),
    };

    trace.decisions.push(agentDecision);
    this.notifyListeners(trace);
  }

  /**
   * Set variable in trace context
   */
  setVariable(traceId: string, key: string, value: any): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.variables.set(key, value);
    this.notifyListeners(trace);
  }

  /**
   * Get variable from trace context
   */
  getVariable(traceId: string, key: string): any {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    return trace.variables.get(key);
  }

  /**
   * Update token usage
   */
  updateTokenUsage(traceId: string, usage: { input: number; output: number }): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.tokenUsage.input += usage.input;
    trace.tokenUsage.output += usage.output;
    trace.tokenUsage.total = trace.tokenUsage.input + trace.tokenUsage.output;

    // Update cost (simplified)
    trace.cost = (trace.tokenUsage.input * 0.00000015) + (trace.tokenUsage.output * 0.0000006);

    this.notifyListeners(trace);
  }

  /**
   * Complete trace
   */
  completeTrace(traceId: string, error?: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    trace.status = error ? 'failed' : 'completed';
    if (error) {
      trace.error = error;
    }

    this.notifyListeners(trace);
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): ExecutionTrace | null {
    return this.traces.get(traceId) || null;
  }

  /**
   * Query traces
   */
  queryTraces(query: TraceQuery): ExecutionTrace[] {
    let results = Array.from(this.traces.values());

    // Filter by workflow
    if (query.workflowId) {
      results = results.filter(t => t.workflowId === query.workflowId);
    }

    // Filter by agent
    if (query.agentId) {
      results = results.filter(t => t.agentId === query.agentId);
    }

    // Filter by status
    if (query.status) {
      results = results.filter(t => t.status === query.status);
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(t => t.startTime >= new Date(query.startTime).getTime());
    }
    if (query.endTime) {
      results = results.filter(t => t.endTime && t.endTime <= new Date(query.endTime).getTime());
    }

    // Sort by start time (newest first)
    results.sort((a, b) => b.startTime - a.startTime);

    // Limit results
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get decision path for trace
   */
  getDecisionPath(traceId: string): AgentDecision[] {
    const trace = this.traces.get(traceId);
    if (!trace) return [];

    return trace.decisions;
  }

  /**
   * Visualize trace as tree
   */
  visualizeTrace(traceId: string): TraceTree {
    const trace = this.traces.get(traceId);
    if (!trace) return { root: null, children: [] };

    // Build tree from steps and decisions
    const root: TraceTreeNode = {
      type: 'root',
      name: trace.agentId,
      startTime: trace.startTime,
      endTime: trace.endTime,
      status: trace.status,
      children: [],
    };

    // Add steps as children
    trace.steps.forEach(step => {
      root.children!.push({
        type: step.type,
        name: step.name,
        startTime: step.timestamp,
        duration: step.duration,
        status: step.type === 'error' ? 'failed' : 'completed',
        input: step.input,
        output: step.output,
        children: [],
      });
    });

    return { root, children: root.children };
  }

  /**
   * Subscribe to trace updates
   */
  onTrace(callback: (trace: ExecutionTrace) => void): () => void {
    this.traceListeners.push(callback);
    return () => {
      const index = this.traceListeners.indexOf(callback);
      if (index > -1) {
        this.traceListeners.splice(index, 1);
      }
    };
  }

  /**
   * Export trace for replay
   */
  exportTrace(traceId: string): ExportedTrace | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    return {
      traceId: trace.traceId,
      workflowId: trace.workflowId,
      agentId: trace.agentId,
      steps: trace.steps,
      decisions: trace.decisions,
      variables: Object.fromEntries(trace.variables),
      metadata: trace.metadata,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import trace for replay
   */
  importTrace(exportedTrace: ExportedTrace): string {
    const traceId = `replay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const trace: ExecutionTrace = {
      ...exportedTrace,
      traceId,
      startTime: Date.now(),
      variables: new Map(Object.entries(exportedTrace.variables)),
      status: 'running',
    };

    this.traces.set(traceId, trace);
    return traceId;
  }

  /**
   * Notify listeners of trace update
   */
  private notifyListeners(trace: ExecutionTrace): void {
    this.traceListeners.forEach(callback => {
      try {
        callback({ ...trace });
      } catch (error) {
        logger.error('Trace listener error:', error);
      }
    });
  }

  /**
   * Get trace statistics
   */
  getTraceStats(agentId?: string): {
    totalTraces: number;
    avgDuration: number;
    successRate: number;
    avgCost: number;
    totalCost: number;
  } {
    let traces = Array.from(this.traces.values());
    
    if (agentId) {
      traces = traces.filter(t => t.agentId === agentId);
    }

    const completed = traces.filter(t => t.endTime !== undefined);
    const successful = traces.filter(t => t.status === 'completed');
    
    const totalDuration = completed.reduce((sum, t) => sum + (t.endTime! - t.startTime), 0);
    const totalCost = traces.reduce((sum, t) => sum + t.cost, 0);

    return {
      totalTraces: traces.length,
      avgDuration: completed.length > 0 ? totalDuration / completed.length : 0,
      successRate: traces.length > 0 ? successful.length / traces.length : 0,
      avgCost: traces.length > 0 ? totalCost / traces.length : 0,
      totalCost,
    };
  }

  /**
   * Clean up old traces
   */
  cleanupOldTraces(maxAgeHours: number = 24): number {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [id, trace] of this.traces.entries()) {
      if (trace.endTime && trace.endTime < cutoff) {
        this.traces.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Helper types
export interface TraceTree {
  root: TraceTreeNode | null;
  children: TraceTreeNode[];
}

export interface TraceTreeNode {
  type: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: string;
  input?: any;
  output?: any;
  children?: TraceTreeNode[];
}

export interface ExportedTrace {
  traceId: string;
  workflowId?: string;
  agentId: string;
  steps: TraceStep[];
  decisions: AgentDecision[];
  variables: Record<string, any>;
  metadata: ExecutionTrace['metadata'];
  exportedAt: string;
}

export const executionTracer = new ExecutionTracer();
