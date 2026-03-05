/**
 * Distributed Tracing Manager for Production-Grade Observability
 * Provides execution timeline visualization, latency tracking, and SLA monitoring
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'completed' | 'error';
  tags: Record<string, unknown>;
  logs: Array<{
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, unknown>;
  }>;
  service: string;
  component: string;
}

export interface Trace {
  traceId: string;
  workflowId?: string;
  executionId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'completed' | 'error';
  spans: TraceSpan[];
  metadata: Record<string, unknown>;
  sla?: {
    targetDuration: number;
    actualDuration: number;
    breached: boolean;
    breachReason?: string;
  };
}

export interface SLADefinition {
  name: string;
  workflowId: string;
  targetDuration: number; // in milliseconds
  warningThreshold: number; // percentage of target
  errorThreshold: number; // percentage of target
  businessHours?: {
    start: string; // "09:00"
    end: string; // "17:00"
    timezone: string;
  };
  holidays?: string[]; // ISO dates
}

export interface TracingConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  maxSpansPerTrace: number;
  retentionPeriod: number; // in hours
  compressionEnabled: boolean;
}

export class DistributedTracingManager {
  private redis: Redis;
  private config: TracingConfig;
  private activeTraces: Map<string, Trace> = new Map();
  private slaDefinitions: Map<string, SLADefinition> = new Map();

  constructor(config: Partial<TracingConfig> = {}) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.config = {
      enabled: true,
      sampleRate: 1.0, // Sample all traces in production
      maxSpansPerTrace: 1000,
      retentionPeriod: 168, // 7 days
      compressionEnabled: true,
      ...config,
    };

    this.initializeSLADefinitions();
  }

  /**
   * Start a new trace
   */
  startTrace(workflowId: string, input: Record<string, unknown>, metadata?: Record<string, unknown>): string {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return '';
    }

    const traceId = uuidv4();
    const trace: Trace = {
      traceId,
      workflowId,
      startTime: new Date(),
      status: 'pending',
      spans: [],
      metadata: {
        ...metadata,
        input,
        environment: process.env.NODE_ENV || 'development',
      },
    };

    this.activeTraces.set(traceId, trace);
    
    // Add root span
    this.addSpan(traceId, 'workflow_start', 'workflow', 'automation_engine', {
      workflowId,
      inputSize: JSON.stringify(input).length,
    });

    console.log(`🔍 Started trace ${traceId} for workflow ${workflowId}`);
    return traceId;
  }

  /**
   * Add a span to existing trace
   */
  addSpan(
    traceId: string,
    operationName: string,
    component: string,
    service: string,
    tags: Record<string, unknown> = {},
    parentSpanId?: string
  ): string {
    if (!this.config.enabled || !traceId) {
      return '';
    }

    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.warn(`⚠️ Trace ${traceId} not found`);
      return '';
    }

    const spanId = uuidv4();
    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: new Date(),
      status: 'pending',
      tags,
      logs: [],
      service,
      component,
    };

    trace.spans.push(span);

    // Check span limit
    if (trace.spans.length > this.config.maxSpansPerTrace) {
      console.warn(`⚠️ Trace ${traceId} exceeded max spans limit`);
      return spanId;
    }

    // Save trace state
    this.saveTraceState(trace);
    
    console.log(`📊 Added span ${spanId} (${operationName}) to trace ${traceId}`);
    return spanId;
  }

  /**
   * Complete a span
   */
  completeSpan(traceId: string, spanId: string, status: 'completed' | 'error' = 'completed', tags: Record<string, unknown> = {}): void {
    if (!this.config.enabled || !traceId || !spanId) {
      return;
    }

    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return;
    }

    const span = trace.spans.find(s => s.spanId === spanId);
    if (!span) {
      return;
    }

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;
    span.tags = { ...span.tags, ...tags };

    // Save trace state
    this.saveTraceState(trace);
    
    console.log(`✅ Completed span ${spanId} in ${span.duration}ms`);
  }

  /**
   * Add log to span
   */
  addSpanLog(traceId: string, spanId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, unknown>): void {
    if (!this.config.enabled || !traceId || !spanId) {
      return;
    }

    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return;
    }

    const span = trace.spans.find(s => s.spanId === spanId);
    if (!span) {
      return;
    }

    span.logs.push({
      timestamp: new Date(),
      level,
      message,
      fields,
    });

    // Save trace state
    this.saveTraceState(trace);
  }

  /**
   * End trace and calculate metrics
   */
  endTrace(traceId: string, status: 'completed' | 'error' = 'completed', finalTags: Record<string, unknown> = {}): void {
    if (!this.config.enabled || !traceId) {
      return;
    }

    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return;
    }

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    trace.status = status;
    trace.metadata = { ...trace.metadata, ...finalTags };

    // Add root span completion
    this.completeSpan(traceId, trace.spans[0]?.spanId || '', status);

    // Calculate SLA
    if (trace.workflowId) {
      trace.sla = this.calculateSLA(trace.workflowId, trace.duration || 0);
    }

    // Archive trace
    this.archiveTrace(trace);
    
    // Remove from active traces
    this.activeTraces.delete(traceId);
    
    console.log(`🏁 Ended trace ${traceId} in ${trace.duration}ms with status ${status}`);
  }

  /**
   * Get trace with timeline visualization
   */
  async getTrace(traceId: string): Promise<Trace | null> {
    // Try active traces first
    const activeTrace = this.activeTraces.get(traceId);
    if (activeTrace) {
      return activeTrace;
    }

    // Try archived traces
    const archivedTrace = await this.getArchivedTrace(traceId);
    return archivedTrace;
  }

  /**
   * Get execution timeline for visualization
   */
  async getExecutionTimeline(executionId: string): Promise<{
    executionId: string;
    timeline: Array<{
      spanId: string;
      operationName: string;
      component: string;
      service: string;
      startTime: Date;
      endTime?: Date;
      duration?: number;
      status: string;
      parentSpanId?: string;
      level: number; // For hierarchical visualization
      children: string[]; // Child span IDs
    }>;
    ganttChart: Array<{
      spanId: string;
      operationName: string;
      startTime: number; // Relative to trace start
      duration: number;
      level: number;
      color: string;
    }>;
    performanceMetrics: {
      totalDuration: number;
      slowestSpan: { name: string; duration: number };
      fastestSpan: { name: string; duration: number };
      averageSpanDuration: number;
      errorRate: number;
    };
    slaStatus?: {
      breached: boolean;
      targetDuration: number;
      actualDuration: number;
      breachPercentage: number;
    };
  }> {
    const trace = await this.getTrace(executionId);
    if (!trace) {
      throw new Error(`Trace for execution ${executionId} not found`);
    }

    // Build hierarchical timeline
    const timeline = this.buildHierarchicalTimeline(trace.spans);
    
    // Build Gantt chart data
    const ganttChart = this.buildGanttChart(trace.spans, trace.startTime);
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(trace.spans);
    
    return {
      executionId,
      timeline,
      ganttChart,
      performanceMetrics,
      slaStatus: trace.sla ? {
        breached: trace.sla.breached,
        targetDuration: trace.sla.targetDuration,
        actualDuration: trace.sla.actualDuration,
        breachPercentage: ((trace.sla.actualDuration - trace.sla.targetDuration) / trace.sla.targetDuration) * 100,
      } : undefined,
    };
  }

  /**
   * Get latency statistics per step
   */
  async getLatencyStats(workflowId: string, period: { start: Date; end: Date }): Promise<{
    stepName: string;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    minDuration: number;
    maxDuration: number;
    errorRate: number;
    sampleCount: number;
  }[]> {
    const traces = await this.getTracesByWorkflow(workflowId, period);
    const stepStats = new Map<string, number[]>();

    // Collect durations by step
    for (const trace of traces) {
      for (const span of trace.spans) {
        if (span.duration && span.status === 'completed') {
          const key = span.operationName;
          if (!stepStats.has(key)) {
            stepStats.set(key, []);
          }
          stepStats.get(key)!.push(span.duration);
        }
      }
    }

    // Calculate statistics
    const stats = Array.from(stepStats.entries()).map(([stepName, durations]) => {
      durations.sort((a, b) => a - b);
      
      return {
        stepName,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        errorRate: this.calculateErrorRate(workflowId, stepName, period),
        sampleCount: durations.length,
      };
    });

    return stats.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get SLA tracking
   */
  async getSLATracking(workflowId: string, period: { start: Date; end: Date }): Promise<{
    slaDefinition: SLADefinition;
    totalExecutions: number;
    successfulExecutions: number;
    breachedExecutions: number;
    complianceRate: number;
    averageDuration: number;
    breachAnalysis: {
      mostCommonReason: string;
      averageBreachTime: number;
      worstBreach: number;
    };
  }> {
    const slaDefinition = this.slaDefinitions.get(workflowId);
    if (!slaDefinition) {
      throw new Error(`No SLA definition found for workflow ${workflowId}`);
    }

    const traces = await this.getTracesByWorkflow(workflowId, period);
    const completedTraces = traces.filter(t => t.status === 'completed' && t.duration);

    const successfulExecutions = completedTraces.filter(t => !t.sla?.breached).length;
    const breachedExecutions = completedTraces.filter(t => t.sla?.breached).length;
    const totalExecutions = completedTraces.length;

    const complianceRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const averageDuration = totalExecutions > 0 
      ? completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0) / totalExecutions 
      : 0;

    const breachAnalysis = this.analyzeBreaches(completedTraces.filter(t => t.sla?.breached));

    return {
      slaDefinition,
      totalExecutions,
      successfulExecutions,
      breachedExecutions,
      complianceRate,
      averageDuration,
      breachAnalysis,
    };
  }

  /**
   * Get tracing statistics
   */
  async getStats(): Promise<{
    activeTraces: number;
    archivedTraces: number;
    totalSpans: number;
    averageSpansPerTrace: number;
    sampleRate: number;
    storageUsage: {
      active: number;
      archived: number;
      total: number;
    };
  }> {
    const [archivedKeys] = await Promise.all([
      this.redis.keys('trace:*'),
    ]);

    const activeTraces = this.activeTraces.size;
    const archivedTraces = archivedKeys.length;
    const totalSpans = Array.from(this.activeTraces.values()).reduce((sum, t) => sum + t.spans.length, 0);
    const averageSpansPerTrace = activeTraces > 0 ? totalSpans / activeTraces : 0;

    const storageUsage = {
      active: activeTraces * 2048, // ~2KB per active trace
      archived: archivedTraces * 1024, // ~1KB per archived trace
      total: (activeTraces * 2048) + (archivedTraces * 1024),
    };

    return {
      activeTraces,
      archivedTraces,
      totalSpans,
      averageSpansPerTrace,
      sampleRate: this.config.sampleRate,
      storageUsage,
    };
  }

  /**
   * Private helper methods
   */
  private initializeSLADefinitions(): void {
    // Default SLA definitions
    const defaultSLAs: SLADefinition[] = [
      {
        name: 'Booking Confirmation',
        workflowId: 'booking-confirmation',
        targetDuration: 5000, // 5 seconds
        warningThreshold: 80,
        errorThreshold: 100,
        businessHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC',
        },
      },
      {
        name: 'Payment Processing',
        workflowId: 'payment-processing',
        targetDuration: 3000, // 3 seconds
        warningThreshold: 90,
        errorThreshold: 100,
      },
    ];

    for (const sla of defaultSLAs) {
      this.slaDefinitions.set(sla.workflowId, sla);
    }
  }

  private saveTraceState(trace: Trace): void {
    // Save to Redis for persistence
    const key = `trace:${trace.traceId}`;
    const data = JSON.stringify(trace);
    this.redis.setex(key, this.config.retentionPeriod * 3600, data);
  }

  private async getArchivedTrace(traceId: string): Promise<Trace | null> {
    const key = `trace:${traceId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private async archiveTrace(trace: Trace): Promise<void> {
    const key = `trace:${trace.traceId}`;
    const data = JSON.stringify(trace);
    await this.redis.setex(key, this.config.retentionPeriod * 3600, data);
  }

  private async getTracesByWorkflow(workflowId: string, period: { start: Date; end: Date }): Promise<Trace[]> {
    const pattern = 'trace:*';
    const keys = await this.redis.keys(pattern);
    const traces: Trace[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const trace = JSON.parse(data);
        if (trace.workflowId === workflowId && 
            trace.startTime >= period.start && 
            trace.startTime <= period.end) {
          traces.push(trace);
        }
      }
    }

    return traces;
  }

  private buildHierarchicalTimeline(spans: TraceSpan[]): Array<any> {
    const spanMap = new Map(spans.map(s => [s.spanId, s]));
    const timeline: any[] = [];

    for (const span of spans) {
      const level = this.calculateSpanLevel(span, spans);
      const children = spans.filter(s => s.parentSpanId === span.spanId).map(s => s.spanId);

      timeline.push({
        spanId: span.spanId,
        operationName: span.operationName,
        component: span.component,
        service: span.service,
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        status: span.status,
        parentSpanId: span.parentSpanId,
        level,
        children,
      });
    }

    return timeline.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private buildGanttChart(spans: TraceSpan[], traceStart: Date): Array<any> {
    return spans.map(span => ({
      spanId: span.spanId,
      operationName: span.operationName,
      startTime: span.startTime.getTime() - traceStart.getTime(),
      duration: span.duration || 0,
      level: this.calculateSpanLevel(span, spans),
      color: this.getStatusColor(span.status),
    }));
  }

  private calculatePerformanceMetrics(spans: TraceSpan[]): any {
    const completedSpans = spans.filter(s => s.status === 'completed' && s.duration);
    const durations = completedSpans.map(s => s.duration!);

    if (durations.length === 0) {
      return {
        totalDuration: 0,
        slowestSpan: { name: 'N/A', duration: 0 },
        fastestSpan: { name: 'N/A', duration: 0 },
        averageSpanDuration: 0,
        errorRate: 0,
      };
    }

    const slowestSpan = completedSpans.reduce((max, s) => s.duration! > max.duration! ? s : max);
    const fastestSpan = completedSpans.reduce((min, s) => s.duration! < min.duration! ? s : min);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const errorRate = (spans.filter(s => s.status === 'error').length / spans.length) * 100;

    return {
      totalDuration: Math.max(...durations),
      slowestSpan: { name: slowestSpan.operationName, duration: slowestSpan.duration! },
      fastestSpan: { name: fastestSpan.operationName, duration: fastestSpan.duration! },
      averageSpanDuration: averageDuration,
      errorRate,
    };
  }

  private calculateSpanLevel(span: TraceSpan, allSpans: TraceSpan[]): number {
    let level = 0;
    let currentSpan = span;

    while (currentSpan.parentSpanId) {
      level++;
      const parent = allSpans.find(s => s.spanId === currentSpan.parentSpanId);
      if (!parent) break;
      currentSpan = parent;
    }

    return level;
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  private calculateErrorRate(workflowId: string, stepName: string, period: { start: Date; end: Date }): number {
    // Implementation for error rate calculation
    return 0; // Placeholder
  }

  private calculateSLA(workflowId: string, duration: number): any {
    const sla = this.slaDefinitions.get(workflowId);
    if (!sla) {
      return undefined;
    }

    const breached = duration > sla.targetDuration;
    const breachReason = breached ? `Duration exceeded target by ${duration - sla.targetDuration}ms` : undefined;

    return {
      targetDuration: sla.targetDuration,
      actualDuration: duration,
      breached,
      breachReason,
    };
  }

  private analyzeBreaches(breachedTraces: Trace[]): any {
    if (breachedTraces.length === 0) {
      return {
        mostCommonReason: 'N/A',
        averageBreachTime: 0,
        worstBreach: 0,
      };
    }

    const breachTimes = breachedTraces.map(t => (t.duration || 0) - (t.sla?.targetDuration || 0));
    const averageBreachTime = breachTimes.reduce((sum, t) => sum + t, 0) / breachTimes.length;
    const worstBreach = Math.max(...breachTimes);

    return {
      mostCommonReason: 'Duration exceeded SLA target',
      averageBreachTime,
      worstBreach,
    };
  }
}
