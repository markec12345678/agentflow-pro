/**
 * AgentFlow Pro - Loop Detection & Prevention
 * Detects and prevents infinite loops in agent execution
 */

export interface ExecutionTrace {
  id: string;
  agentId: string;
  workflowId?: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'loop_detected';
  iterationCount: number;
  stateHashes: string[];
  inputs: any[];
  outputs: any[];
  error?: string;
}

export interface LoopDetectionConfig {
  maxIterations: number;
  maxExecutionTimeMs: number;
  stateComparisonWindow: number;
  loopThreshold: number; // Number of similar states to trigger detection
  enableStateHashing: boolean;
}

export interface LoopDetectionResult {
  isLoop: boolean;
  confidence: number;
  loopType: LoopType;
  iterationCount: number;
  recommendation: 'continue' | 'warn' | 'terminate';
}

export type LoopType =
  | 'infinite_retry'
  | 'circular_dependency'
  | 'state_oscillation'
  | 'recursive_call'
  | 'workflow_cycle';

export class LoopDetector {
  private traces: Map<string, ExecutionTrace> = new Map();
  private config: LoopDetectionConfig;

  constructor(config?: Partial<LoopDetectionConfig>) {
    this.config = {
      maxIterations: config?.maxIterations || 10,
      maxExecutionTimeMs: config?.maxExecutionTimeMs || 5 * 60 * 1000, // 5 minutes
      stateComparisonWindow: config?.stateComparisonWindow || 5,
      loopThreshold: config?.loopThreshold || 3,
      enableStateHashing: config?.enableStateHashing ?? true,
    };
  }

  /**
   * Start tracking execution
   */
  startTracking(
    agentId: string,
    workflowId?: string,
    parentId?: string
  ): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const trace: ExecutionTrace = {
      id: traceId,
      agentId,
      workflowId,
      parentId,
      startTime: Date.now(),
      status: 'running',
      iterationCount: 0,
      stateHashes: [],
      inputs: [],
      outputs: [],
    };

    this.traces.set(traceId, trace);
    return traceId;
  }

  /**
   * Record iteration and check for loops
   */
  recordIteration(
    traceId: string,
    input: any,
    output?: any
  ): LoopDetectionResult {
    const trace = this.traces.get(traceId);
    if (!trace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    trace.iterationCount++;
    trace.inputs.push(input);
    if (output) trace.outputs.push(output);

    // Generate state hash if enabled
    if (this.config.enableStateHashing) {
      const stateHash = this.generateStateHash(input, output);
      trace.stateHashes.push(stateHash);

      // Keep only recent hashes
      if (trace.stateHashes.length > this.config.stateComparisonWindow) {
        trace.stateHashes.shift();
      }
    }

    // Check for loops
    const loopResult = this.detectLoop(trace);

    if (loopResult.isLoop) {
      trace.status = 'loop_detected';
    }

    return loopResult;
  }

  /**
   * Complete execution tracking
   */
  completeTracking(traceId: string, error?: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    trace.status = error ? 'failed' : 'completed';
    trace.error = error;
  }

  /**
   * Detect loop patterns
   */
  private detectLoop(trace: ExecutionTrace): LoopDetectionResult {
    // Check 1: Max iterations exceeded
    if (trace.iterationCount >= this.config.maxIterations) {
      return {
        isLoop: true,
        confidence: 1.0,
        loopType: 'infinite_retry',
        iterationCount: trace.iterationCount,
        recommendation: 'terminate',
      };
    }

    // Check 2: Execution timeout
    const executionTime = Date.now() - trace.startTime;
    if (executionTime > this.config.maxExecutionTimeMs) {
      return {
        isLoop: true,
        confidence: 0.95,
        loopType: 'infinite_retry',
        iterationCount: trace.iterationCount,
        recommendation: 'terminate',
      };
    }

    // Check 3: State hash comparison (detect oscillation)
    if (this.config.enableStateHashing && trace.stateHashes.length >= this.config.loopThreshold) {
      const recentHashes = trace.stateHashes.slice(-this.config.loopThreshold);
      const uniqueHashes = new Set(recentHashes);

      if (uniqueHashes.size === 1) {
        // All recent states are identical
        return {
          isLoop: true,
          confidence: 0.9,
          loopType: 'state_oscillation',
          iterationCount: trace.iterationCount,
          recommendation: 'terminate',
        };
      }

      if (uniqueHashes.size <= 2) {
        // Oscillating between 2 states
        return {
          isLoop: true,
          confidence: 0.8,
          loopType: 'state_oscillation',
          iterationCount: trace.iterationCount,
          recommendation: 'warn',
        };
      }
    }

    // Check 4: Input/output pattern analysis
    if (trace.inputs.length >= 3) {
      const inputPattern = this.analyzeInputPattern(trace.inputs);
      if (inputPattern.isRepeating) {
        return {
          isLoop: true,
          confidence: 0.85,
          loopType: 'infinite_retry',
          iterationCount: trace.iterationCount,
          recommendation: 'warn',
        };
      }
    }

    // Check 5: Circular dependency detection (for workflows)
    if (trace.workflowId) {
      const circularCheck = this.detectCircularDependency(trace);
      if (circularCheck.isLoop) {
        return circularCheck;
      }
    }

    return {
      isLoop: false,
      confidence: 0,
      loopType: 'infinite_retry',
      iterationCount: trace.iterationCount,
      recommendation: 'continue',
    };
  }

  /**
   * Analyze input pattern for repetition
   */
  private analyzeInputPattern(inputs: any[]): { isRepeating: boolean; confidence: number } {
    if (inputs.length < 3) return { isRepeating: false, confidence: 0 };

    const lastInput = JSON.stringify(inputs[inputs.length - 1]);
    const previousInputs = inputs.slice(0, -1).map(i => JSON.stringify(i));

    const matchCount = previousInputs.filter(input => input === lastInput).length;
    const confidence = matchCount / (inputs.length - 1);

    return {
      isRepeating: confidence > 0.7,
      confidence,
    };
  }

  /**
   * Detect circular dependency in workflow
   */
  private detectCircularDependency(trace: ExecutionTrace): LoopDetectionResult {
    // Check if same agent is called recursively
    const agentCalls = trace.inputs
      .filter(input => input?.agentId === trace.agentId)
      .length;

    if (agentCalls >= 3) {
      return {
        isLoop: true,
        confidence: 0.9,
        loopType: 'recursive_call',
        iterationCount: trace.iterationCount,
        recommendation: 'terminate',
      };
    }

    return { isLoop: false, confidence: 0, loopType: 'infinite_retry', iterationCount: 0 };
  }

  /**
   * Generate hash of current state
   */
  private generateStateHash(input: any, output?: any): string {
    const state = {
      input: this.normalizeState(input),
      output: output ? this.normalizeState(output) : null,
    };
    return this.simpleHash(JSON.stringify(state));
  }

  /**
   * Normalize state for comparison
   */
  private normalizeState(state: any): any {
    if (typeof state !== 'object' || state === null) {
      return state;
    }

    // Remove timestamps and IDs for comparison
    const normalized = { ...state };
    delete normalized.timestamp;
    delete normalized.id;
    delete normalized.traceId;

    return normalized;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(traceId: string): {
    duration: number;
    iterations: number;
    avgIterationTime: number;
    status: string;
  } | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    const endTime = trace.endTime || Date.now();
    const duration = endTime - trace.startTime;

    return {
      duration,
      iterations: trace.iterationCount,
      avgIterationTime: duration / Math.max(1, trace.iterationCount),
      status: trace.status,
    };
  }

  /**
   * Clean up old traces
   */
  cleanupOldTraces(maxAgeMs: number = 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, trace] of this.traces.entries()) {
      const endTime = trace.endTime || now;
      if (endTime < now - maxAgeMs) {
        this.traces.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Create loop prevention middleware
 */
export function createLoopPreventionMiddleware(detector: LoopDetector) {
  return async function loopPreventionMiddleware(
    agentId: string,
    execute: (iteration: number) => Promise<any>,
    workflowId?: string
  ): Promise<any> {
    const traceId = detector.startTracking(agentId, workflowId);

    try {
      let iteration = 0;
      let shouldContinue = true;

      while (shouldContinue) {
        iteration++;

        // Execute and get result
        const result = await execute(iteration);

        // Record iteration and check for loops
        const loopCheck = detector.recordIteration(traceId, { iteration }, result);

        if (loopCheck.recommendation === 'terminate') {
          throw new LoopError(
            `Loop detected after ${iteration} iterations`,
            loopCheck
          );
        }

        if (loopCheck.recommendation === 'warn') {
          console.warn(`[LoopDetector] Warning: Potential loop detected at iteration ${iteration}`);
        }

        // Check if execution should continue
        shouldContinue = result?.shouldContinue ?? false;

        // Safety limit
        if (iteration >= detector['config'].maxIterations) {
          throw new LoopError(
            `Max iterations (${detector['config'].maxIterations}) exceeded`,
            loopCheck
          );
        }
      }

      detector.completeTracking(traceId);
      return { success: true, iterations: iteration };
    } catch (error) {
      detector.completeTracking(traceId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}

export class LoopError extends Error {
  constructor(
    message: string,
    public loopDetection: LoopDetectionResult
  ) {
    super(message);
    this.name = 'LoopError';
  }
}

export const loopDetector = new LoopDetector();
