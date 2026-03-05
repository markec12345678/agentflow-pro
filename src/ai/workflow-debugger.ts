import { getContextManager } from './context-manager';
import { getWorkflowAdvisor } from './workflow-advisor';
import { getMCPOptimizer } from './mcp-optimizer';

export class WorkflowDebugger {
  constructor(
    private contextManager = getContextManager(),
    private workflowAdvisor = getWorkflowAdvisor(),
    private mcpOptimizer = getMCPOptimizer()
  ) {}

  async debugWorkflowExecution(
    workflowId: string,
    executionData: WorkflowExecutionData,
    availableAgents: any[]
  ): Promise<WorkflowDebugReport> {
    const startTime = Date.now();

    // 1. Analyze execution data
    const executionAnalysis = this.analyzeExecution(executionData);

    // 2. Get enhanced context
    const context = await this.contextManager.getEnhancedContext(
      `Debug workflow ${workflowId} execution`,
      'system',
      'workflow-debugger'
    );

    // 3. Identify issues
    const issues = this.identifyIssues(executionAnalysis, context);

    // 4. Generate recommendations
    const recommendations = await this.generateRecommendations(
      workflowId,
      executionData,
      issues,
      availableAgents
    );

    // 5. Create visual debugging data
    const visualData = this.createVisualDebugData(executionData, issues);

    return {
      workflowId,
      executionId: executionData.id,
      timestamp: new Date().toISOString(),
      analysis: executionAnalysis,
      issues,
      recommendations,
      visualDebugData: visualData,
      contextUsed: context,
      debugTime: Date.now() - startTime
    };
  }

  private analyzeExecution(executionData: WorkflowExecutionData): ExecutionAnalysis {
    const nodeStats: Record<string, NodeExecutionStats> = {};
    const edgeStats: Record<string, EdgeExecutionStats> = {};
    const errors: ExecutionError[] = [];
    const warnings: ExecutionWarning[] = [];

    // Analyze node executions
    executionData.nodeExecutions.forEach(nodeExec => {
      nodeStats[nodeExec.nodeId] = {
        status: nodeExec.status,
        startTime: nodeExec.startTime,
        endTime: nodeExec.endTime,
        executionTime: nodeExec.endTime - nodeExec.startTime,
        mcpCalls: nodeExec.mcpCalls || 0,
        errors: Array.isArray(nodeExec.errors) ? nodeExec.errors.length : (nodeExec.errors || 0),
        warnings: Array.isArray(nodeExec.warnings) ? nodeExec.warnings.length : (nodeExec.warnings || 0),
        memoryUsage: nodeExec.memoryUsage || 0
      };

      // Collect errors and warnings
      nodeExec.errors?.forEach(error => {
        errors.push({
          nodeId: nodeExec.nodeId,
          type: 'node_error',
          message: error.message,
          timestamp: error.timestamp,
          severity: error.severity || 'error'
        });
      });

      nodeExec.warnings?.forEach(warning => {
        warnings.push({
          nodeId: nodeExec.nodeId,
          type: 'node_warning',
          message: warning.message,
          timestamp: warning.timestamp,
          severity: 'warning'
        });
      });
    });

    // Analyze edge executions (data flow)
    executionData.edgeExecutions.forEach(edgeExec => {
      edgeStats[edgeExec.edgeId] = {
        dataSize: edgeExec.dataSize,
        transferTime: edgeExec.transferTime,
        status: edgeExec.status,
        errors: Array.isArray(edgeExec.errors) ? edgeExec.errors.length : (edgeExec.errors || 0),
      };

      edgeExec.errors?.forEach(error => {
        errors.push({
          edgeId: edgeExec.edgeId,
          type: 'edge_error',
          message: error.message,
          timestamp: error.timestamp,
          severity: error.severity || 'error'
        });
      });
    });

    // Calculate overall metrics
    const totalTime = executionData.endTime - executionData.startTime;
    const nodeTimes = Object.values(nodeStats).map(s => s.executionTime);
    const avgNodeTime = nodeTimes.reduce((a, b) => a + b, 0) / nodeTimes.length;

    return {
      totalExecutionTime: totalTime,
      averageNodeTime: avgNodeTime,
      nodeStats,
      edgeStats,
      errorCount: errors.length,
      warningCount: warnings.length,
      mcpCallCount: Object.values(nodeStats).reduce((a, b) => a + b.mcpCalls, 0),
      totalErrors: errors,
      totalWarnings: warnings
    };
  }

  private identifyIssues(
    analysis: ExecutionAnalysis,
    context: any
  ): ExecutionIssue[] {
    const issues: ExecutionIssue[] = [];

    // 1. Performance Issues
    Object.entries(analysis.nodeStats).forEach(([nodeId, stats]) => {
      if (stats.executionTime > 5000) { // More than 5 seconds
        issues.push({
          id: `perf-${nodeId}`,
          type: 'performance',
          nodeId,
          severity: 'high',
          description: `Node ${nodeId} executed slowly (${stats.executionTime}ms)`,
          details: {
            executionTime: stats.executionTime,
            mcpCalls: stats.mcpCalls,
            memoryUsage: stats.memoryUsage
          },
          suggestedFix: [
            'Review node logic for optimization opportunities',
            'Consider adding caching',
            'Check for unnecessary MCP calls'
          ]
        });
      }
    });

    // 2. Error Issues
    analysis.totalErrors.forEach(error => {
      issues.push({
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'error',
        nodeId: error.nodeId || 'unknown',
        severity: (error.severity === 'high' || error.severity === 'medium' || error.severity === 'low') ? error.severity : 'high',
        description: error.message,
        details: {
          timestamp: error.timestamp,
          errorType: this.classifyError(error.message)
        },
        suggestedFix: this.getErrorSuggestions(error.message)
      });
    });

    // 3. Data Flow Issues
    Object.entries(analysis.edgeStats).forEach(([edgeId, stats]) => {
      if (stats.dataSize > 1000000) { // More than 1MB
        issues.push({
          id: `data-${edgeId}`,
          type: 'data_flow',
          edgeId,
          severity: 'medium',
          description: `Large data transfer on edge ${edgeId} (${Math.round(stats.dataSize/1024/1024)}MB)`,
          details: {
            dataSize: stats.dataSize,
            transferTime: stats.transferTime
          },
          suggestedFix: [
            'Consider data pagination',
            'Review if all data is necessary',
            'Implement data compression'
          ]
        });
      }
    });

    // 4. Context-Aware Issues
    if (context.relatedConcepts) {
      const potentialIssues = this.findContextSpecificIssues(context.relatedConcepts, analysis);
      issues.push(...potentialIssues);
    }

    return issues.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private classifyError(message: string): string {
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('auth') || message.includes('permission')) return 'authentication';
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('invalid') || message.includes('format')) return 'validation';
    return 'unknown';
  }

  private getErrorSuggestions(errorMessage: string): string[] {
    const errorType = this.classifyError(errorMessage);

    const suggestions: Record<string, string[]> = {
      timeout: [
        'Increase timeout values',
        'Optimize the operation being performed',
        'Implement request chunking'
      ],
      rate_limit: [
        'Implement exponential backoff',
        'Add caching for repeated requests',
        'Review API rate limits'
      ],
      authentication: [
        'Verify API credentials',
        'Check token expiration',
        'Review permission scopes'
      ],
      network: [
        'Add retry logic with jitter',
        'Implement circuit breakers',
        'Check network connectivity'
      ],
      validation: [
        'Validate input data before processing',
        'Add data sanitization',
        'Improve error messages'
      ],
      unknown: [
        'Add comprehensive logging',
        'Implement error classification',
        'Review recent changes'
      ]
    };

    return suggestions[errorType] || suggestions.unknown;
  }

  private findContextSpecificIssues(concepts: string[], analysis: ExecutionAnalysis): ExecutionIssue[] {
    const issues: ExecutionIssue[] = [];

    // Check for concept-specific patterns
    if (concepts.some(c => ['reservation', 'booking'].includes(c))) {
      const slowNodes = Object.entries(analysis.nodeStats)
        .filter(([_, stats]) => stats.executionTime > 3000);

      if (slowNodes.length > 0) {
        issues.push({
          id: `context-reservation-perf`,
          type: 'context_specific',
          severity: 'medium',
          description: 'Reservation workflow has performance bottlenecks',
          details: {
            slowNodes: slowNodes.map(([id]) => id),
            concept: 'reservation'
          },
          suggestedFix: [
            'Optimize database queries for reservation data',
            'Consider adding caching for frequent reservation lookups',
            'Review MCP calls related to reservations'
          ]
        });
      }
    }

    if (concepts.some(c => ['content', 'seo'].includes(c))) {
      const highMemoryNodes = Object.entries(analysis.nodeStats)
        .filter(([_, stats]) => stats.memoryUsage > 50); // >50MB

      if (highMemoryNodes.length > 0) {
        issues.push({
          id: `context-content-memory`,
          type: 'context_specific',
          severity: 'medium',
          description: 'Content processing nodes using excessive memory',
          details: {
            highMemoryNodes: highMemoryNodes.map(([id]) => id),
            concept: 'content'
          },
          suggestedFix: [
            'Implement streaming for large content processing',
            'Add memory limits and cleanup',
            'Review content transformation logic'
          ]
        });
      }
    }

    return issues;
  }

  private async generateRecommendations(
    workflowId: string,
    executionData: WorkflowExecutionData,
    issues: ExecutionIssue[],
    availableAgents: any[]
  ): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    // 1. General Optimization Recommendations
    if (issues.some(i => i.type === 'performance')) {
      recommendations.push({
        id: 'opt-performance',
        type: 'optimization',
        title: 'Performance Optimization',
        description: 'Implement performance improvements for slow nodes',
        priority: 'high',
        actions: [
          {
            type: 'code_change',
            description: 'Add caching to frequently called nodes',
            estimatedImpact: '30-50% performance improvement'
          },
          {
            type: 'configuration',
            description: 'Review and optimize MCP call configurations',
            estimatedImpact: '20-40% faster MCP responses'
          }
        ]
      });
    }

    // 2. Error Handling Recommendations
    if (issues.some(i => i.type === 'error')) {
      recommendations.push({
        id: 'rec-error-handling',
        type: 'reliability',
        title: 'Enhanced Error Handling',
        description: 'Add robust error handling and recovery mechanisms',
        priority: 'high',
        actions: [
          {
            type: 'code_change',
            description: 'Implement retry logic with exponential backoff',
            estimatedImpact: '60-80% reduction in transient errors'
          },
          {
            type: 'architecture',
            description: 'Add circuit breakers for external dependencies',
            estimatedImpact: 'Improved system resilience'
          }
        ]
      });
    }

    // 3. Agent-Specific Recommendations
    const agentRecommendations = await this.workflowAdvisor.suggestWorkflowImprovements(
      executionData.workflow as any,
      availableAgents,
      [executionData]
    );

    if (agentRecommendations.length > 0) {
      recommendations.push({
        id: 'rec-agent-optimization',
        type: 'agent_optimization',
        title: 'Agent Optimization',
        description: 'Improve agent selection and configuration',
        priority: 'medium',
        actions: agentRecommendations.slice(0, 3).map(rec => ({
          type: 'configuration',
          description: rec.description,
          estimatedImpact: (rec as any).potentialImprovement || 'medium',
        }))
      });
    }

    // 4. MCP Optimization Recommendations
    const mcpRecommendations = await this.mcpOptimizer.optimizeMCPWorkflow(
      workflowId,
      executionData.mcpServers || [],
      [executionData]
    );

    if (mcpRecommendations.suggestions.length > 0) {
      recommendations.push({
        id: 'rec-mcp-optimization',
        type: 'mcp_optimization',
        title: 'MCP Usage Optimization',
        description: 'Optimize MCP server utilization and performance',
        priority: 'medium',
        actions: mcpRecommendations.suggestions.slice(0, 3).map(sugg => ({
          type: 'configuration',
          description: sugg.description,
          estimatedImpact: sugg.potentialImprovement
        })),
        metrics: {
          currentErrorRate: mcpRecommendations.improvements.currentErrorRate,
          potentialErrorRate: mcpRecommendations.improvements.potentialErrorRate,
          improvementScore: mcpRecommendations.improvements.overallScore
        }
      });
    }

    // 5. Monitoring Recommendations
    recommendations.push({
      id: 'rec-monitoring',
      type: 'observability',
      title: 'Enhanced Monitoring',
      description: 'Add comprehensive monitoring and alerting',
      priority: 'medium',
      actions: [
        {
          type: 'infrastructure',
          description: 'Implement distributed tracing for workflow executions',
          estimatedImpact: 'Better visibility into performance bottlenecks'
        },
        {
          type: 'code_change',
          description: 'Add custom metrics for critical nodes',
          estimatedImpact: 'Proactive issue detection'
        }
      ]
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private createVisualDebugData(
    executionData: WorkflowExecutionData,
    issues: ExecutionIssue[]
  ): VisualDebugData {
    // Create node-level visual data
    const nodes = executionData.workflow.nodes.map(node => {
      const nodeExec = executionData.nodeExecutions.find(n => n.nodeId === node.id);
      const nodeIssues = issues.filter(i => i.nodeId === node.id);

      return {
        id: node.id,
        type: node.type,
        position: node.position,
        status: nodeExec?.status || 'pending',
        executionTime: (nodeExec?.endTime && nodeExec?.startTime) ? (nodeExec.endTime - nodeExec.startTime) : 0,
        hasIssues: nodeIssues.length > 0,
        issueSeverity: nodeIssues.length > 0
          ? Math.max(...nodeIssues.map(i => this.severityToScore(i.severity)))
          : 0,
        mcpCalls: nodeExec?.mcpCalls || 0,
        memoryUsage: nodeExec?.memoryUsage || 0
      };
    });

    // Create edge-level visual data
    const edges = executionData.workflow.edges.map(edge => {
      const edgeExec = executionData.edgeExecutions.find(e => e.edgeId === edge.id);
      const edgeIssues = issues.filter(i => i.edgeId === edge.id);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        status: edgeExec?.status || 'pending',
        dataSize: edgeExec?.dataSize || 0,
        transferTime: edgeExec?.transferTime || 0,
        hasIssues: edgeIssues.length > 0
      };
    });

    // Create timeline data
    const timelineEvents = executionData.nodeExecutions
      .flatMap(nodeExec => [
        {
          time: nodeExec.startTime,
          type: 'node_start',
          nodeId: nodeExec.nodeId,
          description: `Node ${nodeExec.nodeId} started`
        },
        {
          time: nodeExec.endTime,
          type: 'node_end',
          nodeId: nodeExec.nodeId,
          description: `Node ${nodeExec.nodeId} completed (${(nodeExec.endTime && nodeExec.startTime) ? (nodeExec.endTime - nodeExec.startTime) : 0}ms)`
        }
      ])
      .sort((a, b) => a.time - b.time);

    return {
      nodes,
      edges,
      timeline: timelineEvents,
      metrics: {
        totalTime: executionData.endTime - executionData.startTime,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        issueCount: issues.length,
        errorCount: issues.filter(i => i.type === 'error').length,
        warningCount: issues.filter(i => i.type !== 'error').length
      }
    };
  }

  private severityToScore(severity: string): number {
    return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
  }
}

// Data Interfaces
interface WorkflowExecutionData {
  id: string;
  workflow: {
    id: string;
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
  };
  startTime: number;
  endTime: number;
  status: string;
  nodeExecutions: Array<{
    nodeId: string;
    startTime: number;
    endTime: number;
    status: string;
    mcpCalls?: number;
    errors?: Array<{
      message: string;
      timestamp: number;
      severity?: string;
    }>;
    warnings?: Array<{
      message: string;
      timestamp: number;
    }>;
    memoryUsage?: number;
  }>;
  edgeExecutions: Array<{
    edgeId: string;
    dataSize: number;
    transferTime: number;
    status: string;
    errors?: Array<{
      message: string;
      timestamp: number;
      severity?: string;
    }>;
  }>;
  mcpServers?: string[];
  errors?: any[];
}

interface ExecutionAnalysis {
  totalExecutionTime: number;
  averageNodeTime: number;
  nodeStats: Record<string, NodeExecutionStats>;
  edgeStats: Record<string, EdgeExecutionStats>;
  errorCount: number;
  warningCount: number;
  mcpCallCount: number;
  totalErrors: ExecutionError[];
  totalWarnings: ExecutionWarning[];
}

interface NodeExecutionStats {
  status: string;
  startTime: number;
  endTime: number;
  executionTime: number;
  mcpCalls: number;
  errors: number;
  warnings: number;
  memoryUsage: number;
}

interface EdgeExecutionStats {
  dataSize: number;
  transferTime: number;
  status: string;
  errors: number;
}

interface ExecutionError {
  nodeId?: string;
  edgeId?: string;
  type: string;
  message: string;
  timestamp: number;
  severity: string;
}

interface ExecutionWarning {
  nodeId?: string;
  edgeId?: string;
  type: string;
  message: string;
  timestamp: number;
  severity: string;
}

interface ExecutionIssue {
  id: string;
  type: 'performance' | 'error' | 'data_flow' | 'context_specific';
  nodeId?: string;
  edgeId?: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  details: any;
  suggestedFix: string[];
}

interface WorkflowRecommendation {
  id: string;
  type: 'optimization' | 'reliability' | 'agent_optimization' | 'mcp_optimization' | 'observability';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actions: Array<{
    type: 'code_change' | 'configuration' | 'architecture' | 'infrastructure';
    description: string;
    estimatedImpact: string;
  }>;
  metrics?: any;
}

interface VisualDebugData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    status: string;
    executionTime: number;
    hasIssues: boolean;
    issueSeverity: number;
    mcpCalls: number;
    memoryUsage: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    status: string;
    dataSize: number;
    transferTime: number;
    hasIssues: boolean;
  }>;
  timeline: Array<{
    time: number;
    type: string;
    nodeId?: string;
    description: string;
  }>;
  metrics: {
    totalTime: number;
    nodeCount: number;
    edgeCount: number;
    issueCount: number;
    errorCount: number;
    warningCount: number;
  };
}

interface WorkflowDebugReport {
  workflowId: string;
  executionId: string;
  timestamp: string;
  analysis: ExecutionAnalysis;
  issues: ExecutionIssue[];
  recommendations: WorkflowRecommendation[];
  visualDebugData: VisualDebugData;
  contextUsed: any;
  debugTime: number;
}

export const getWorkflowDebugger = (): WorkflowDebugger => {
  return new WorkflowDebugger();
};
