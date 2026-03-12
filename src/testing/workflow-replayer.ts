/**
 * AgentFlow Pro - Workflow Execution Replay
 * Replay past workflow executions for debugging and testing
 */

import { executionTracer, ExportedTrace, TraceStep, AgentDecision } from '@/infrastructure/observability/execution-tracer';

export interface ReplaySession {
  replayId: string;
  originalTraceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  config: ReplayConfig;
  steps: ReplayStep[];
  currentStepIndex: number;
  variables: Map<string, any>;
  breakpoints: Breakpoint[];
  result?: any;
  error?: string;
}

export interface ReplayConfig {
  traceId: string;
  mode: 'full' | 'step-by-step' | 'from-step' | 'to-step';
  fromStep?: number;
  toStep?: number;
  speed: 'normal' | 'fast' | 'slow';
  pauseOnBreakpoints: boolean;
  pauseOnErrors: boolean;
  mockExternalAPIs: boolean;
}

export interface ReplayStep {
  stepIndex: number;
  originalStep: TraceStep;
  status: 'pending' | 'executing' | 'completed' | 'skipped' | 'failed';
  executedAt?: string;
  input?: any;
  output?: any;
  duration?: number;
  error?: string;
}

export interface Breakpoint {
  breakpointId: string;
  type: 'step' | 'error' | 'variable' | 'condition';
  condition?: string;
  stepIndex?: number;
  variableName?: string;
  enabled: boolean;
  hitCount: number;
}

export interface ReplayControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  resume: () => void;
}

export class WorkflowReplayer {
  private replays: Map<string, ReplaySession> = new Map();
  private activeReplays: Set<string> = new Set();

  /**
   * Create new replay session from trace
   */
  async createReplay(
    traceId: string,
    config?: Partial<ReplayConfig>
  ): Promise<ReplaySession> {
    const exportedTrace = executionTracer.exportTrace(traceId);
    if (!exportedTrace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const replayId = `replay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const replay: ReplaySession = {
      replayId,
      originalTraceId: traceId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      config: {
        traceId,
        mode: config?.mode || 'full',
        speed: config?.speed || 'normal',
        pauseOnBreakpoints: config?.pauseOnBreakpoints ?? true,
        pauseOnErrors: config?.pauseOnErrors ?? true,
        mockExternalAPIs: config?.mockExternalAPIs ?? true,
        fromStep: config?.fromStep,
        toStep: config?.toStep,
      },
      steps: exportedTrace.steps.map((step, index) => ({
        stepIndex: index,
        originalStep: step,
        status: 'pending' as const,
      })),
      currentStepIndex: 0,
      variables: new Map(Object.entries(exportedTrace.variables)),
      breakpoints: [],
    };

    this.replays.set(replayId, replay);
    return replay;
  }

  /**
   * Start replay execution
   */
  async startReplay(replayId: string): Promise<void> {
    const replay = this.replays.get(replayId);
    if (!replay) {
      throw new Error(`Replay ${replayId} not found`);
    }

    replay.status = 'running';
    replay.startedAt = new Date().toISOString();
    this.activeReplays.add(replayId);

    try {
      await this.executeReplay(replay);
    } catch (error) {
      replay.status = 'failed';
      replay.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.activeReplays.delete(replayId);
      replay.completedAt = new Date().toISOString();
    }
  }

  /**
   * Pause replay
   */
  pauseReplay(replayId: string): void {
    const replay = this.replays.get(replayId);
    if (!replay) return;

    replay.status = 'paused';
  }

  /**
   * Resume paused replay
   */
  async resumeReplay(replayId: string): Promise<void> {
    const replay = this.replays.get(replayId);
    if (!replay || replay.status !== 'paused') return;

    replay.status = 'running';
    await this.executeReplay(replay);
  }

  /**
   * Stop replay
   */
  stopReplay(replayId: string): void {
    const replay = this.replays.get(replayId);
    if (!replay) return;

    replay.status = 'completed';
    replay.completedAt = new Date().toISOString();
    this.activeReplays.delete(replayId);
  }

  /**
   * Step over (execute current step, pause at next)
   */
  async stepOver(replayId: string): Promise<void> {
    const replay = this.replays.get(replayId);
    if (!replay || replay.status !== 'paused') return;

    replay.status = 'running';
    await this.executeNextStep(replay);
    replay.status = 'paused';
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(replayId: string, breakpoint: Omit<Breakpoint, 'breakpointId' | 'hitCount'>): Breakpoint {
    const replay = this.replays.get(replayId);
    if (!replay) {
      throw new Error(`Replay ${replayId} not found`);
    }

    const bp: Breakpoint = {
      ...breakpoint,
      breakpointId: `bp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      hitCount: 0,
    };

    replay.breakpoints.push(bp);
    return bp;
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(replayId: string, breakpointId: string): boolean {
    const replay = this.replays.get(replayId);
    if (!replay) return false;

    const index = replay.breakpoints.findIndex(bp => bp.breakpointId === breakpointId);
    if (index === -1) return false;

    replay.breakpoints.splice(index, 1);
    return true;
  }

  /**
   * Get replay status
   */
  getReplayStatus(replayId: string): ReplaySession | null {
    return this.replays.get(replayId) || null;
  }

  /**
   * Get variable value at current step
   */
  getVariable(replayId: string, variableName: string): any {
    const replay = this.replays.get(replayId);
    if (!replay) return null;

    return replay.variables.get(variableName);
  }

  /**
   * List all replays
   */
  listReplays(status?: string): ReplaySession[] {
    let replays = Array.from(this.replays.values());

    if (status) {
      replays = replays.filter(r => r.status === status);
    }

    return replays.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Execute replay
   */
  private async executeReplay(replay: ReplaySession): Promise<void> {
    const { config, steps } = replay;

    for (let i = replay.currentStepIndex; i < steps.length; i++) {
      // Check mode constraints
      if (config.mode === 'from-step' && config.fromStep && i < config.fromStep) {
        continue;
      }
      if (config.mode === 'to-step' && config.toStep && i > config.toStep) {
        break;
      }

      // Execute step
      await this.executeStep(replay, i);

      // Check for breakpoints
      if (config.pauseOnBreakpoints) {
        const hitBreakpoint = this.checkBreakpoints(replay, i);
        if (hitBreakpoint) {
          replay.status = 'paused';
          replay.currentStepIndex = i;
          return; // Pause execution
        }
      }

      // Speed control
      const delay = this.getSpeedDelay(config.speed);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    replay.status = 'completed';
    replay.currentStepIndex = steps.length;
  }

  /**
   * Execute next step
   */
  private async executeNextStep(replay: ReplaySession): Promise<void> {
    const { currentStepIndex } = replay;
    if (currentStepIndex >= replay.steps.length) return;

    await this.executeStep(replay, currentStepIndex);
    replay.currentStepIndex++;
  }

  /**
   * Execute single step
   */
  private async executeStep(replay: ReplaySession, stepIndex: number): Promise<void> {
    const step = replay.steps[stepIndex];
    if (!step) return;

    step.status = 'executing';
    step.executedAt = new Date().toISOString();

    try {
      // Simulate step execution
      // In production, this would actually execute the step logic
      step.output = step.originalStep.output;
      step.duration = step.originalStep.duration;
      step.status = 'completed';

      // Update variables if step changed them
      this.updateVariablesFromStep(replay, step);
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';

      if (replay.config.pauseOnErrors) {
        replay.status = 'paused';
        throw error;
      }
    }
  }

  /**
   * Check if any breakpoint is hit
   */
  private checkBreakpoints(replay: ReplaySession, stepIndex: number): boolean {
    for (const breakpoint of replay.breakpoints) {
      if (!breakpoint.enabled) continue;

      if (breakpoint.type === 'step' && breakpoint.stepIndex === stepIndex) {
        breakpoint.hitCount++;
        return true;
      }

      if (breakpoint.type === 'variable' && breakpoint.variableName) {
        const value = replay.variables.get(breakpoint.variableName);
        if (value !== undefined) {
          breakpoint.hitCount++;
          return true;
        }
      }

      if (breakpoint.type === 'condition' && breakpoint.condition) {
        // Evaluate condition (simplified)
        // In production, use proper expression evaluation
        breakpoint.hitCount++;
        return true;
      }
    }

    return false;
  }

  /**
   * Update variables from step output
   */
  private updateVariablesFromStep(replay: ReplaySession, step: ReplayStep): void {
    // Extract variables from step output
    // This is simplified - in production, parse actual variable assignments
    if (step.output && typeof step.output === 'object') {
      Object.keys(step.output).forEach(key => {
        replay.variables.set(key, step.output[key]);
      });
    }
  }

  /**
   * Get delay based on speed setting
   */
  private getSpeedDelay(speed: 'normal' | 'fast' | 'slow'): number {
    switch (speed) {
      case 'slow': return 2000;
      case 'normal': return 500;
      case 'fast': return 0;
      default: return 0;
    }
  }

  /**
   * Get replay controls for UI
   */
  getControls(replayId: string): ReplayControls {
    return {
      play: () => this.startReplay(replayId),
      pause: () => this.pauseReplay(replayId),
      stop: () => this.stopReplay(replayId),
      stepOver: () => this.stepOver(replayId),
      stepInto: () => this.stepOver(replayId), // Simplified
      stepOut: () => this.stepOver(replayId), // Simplified
      resume: () => this.resumeReplay(replayId),
    };
  }

  /**
   * Export replay for sharing
   */
  exportReplay(replayId: string): ExportedReplay | null {
    const replay = this.replays.get(replayId);
    if (!replay) return null;

    return {
      replayId: replay.replayId,
      originalTraceId: replay.originalTraceId,
      createdAt: replay.createdAt,
      config: replay.config,
      steps: replay.steps.map(s => ({
        stepIndex: s.stepIndex,
        type: s.originalStep.type,
        name: s.originalStep.name,
        input: s.input || s.originalStep.input,
        output: s.output || s.originalStep.output,
        duration: s.duration || s.originalStep.duration,
        status: s.status,
      })),
      exportedAt: new Date().toISOString(),
    };
  }
}

export interface ExportedReplay {
  replayId: string;
  originalTraceId: string;
  createdAt: string;
  config: ReplayConfig;
  steps: Array<{
    stepIndex: number;
    type: string;
    name: string;
    input?: any;
    output?: any;
    duration?: number;
    status: string;
  }>;
  exportedAt: string;
}

export const workflowReplayer = new WorkflowReplayer();
