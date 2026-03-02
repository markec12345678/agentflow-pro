import { getContextManager } from './context-manager';
import { getWorkflowAdvisor } from './workflow-advisor';
import { Agent } from '../agents/Agent';

export class MCPOptimizer {
  constructor(
    private contextManager = getContextManager(),
    private workflowAdvisor = getWorkflowAdvisor()
  ) {}

  async optimizeMCPWorkflow(
    workflowId: string,
    mcpServers: string[],
    executionHistory: any[]
  ): Promise<MCPOptimizationResult> {
    // 1. Analyze current MCP usage
    const mcpAnalysis = await this.analyzeMCPPatterns(executionHistory);

    // 2. Get enhanced context
    const context = await this.contextManager.getEnhancedContext(
      `Optimize workflow ${workflowId}`,
      'system',
      'mcp-optimizer'
    );

    // 3. Generate optimization suggestions
    const suggestions = await this.generateOptimizations(
      workflowId,
      mcpServers,
      mcpAnalysis,
      context
    );

    // 4. Calculate potential improvements
    const improvements = this.calculateImprovements(mcpAnalysis, suggestions);

    return {
      workflowId,
      currentState: mcpAnalysis,
      suggestions,
      improvements,
      contextUsed: context
    };
  }

  private async analyzeMCPPatterns(executionHistory: any[]): Promise<MCPPatternAnalysis> {
    const mcpUsage: Record<string, MCPUsageStats> = {};
    const errorPatterns: Record<string, number> = {};
    const performanceMetrics: Record<string, number[]> = {};

    executionHistory.forEach(execution => {
      // Track MCP usage
      Object.entries(execution.mcpCalls || {}).forEach(([mcpName, calls]) => {
        if (!mcpUsage[mcpName]) {
          mcpUsage[mcpName] = { calls: 0, success: 0, errors: 0, avgTime: 0 };
        }
        mcpUsage[mcpName].calls += calls.count;
        mcpUsage[mcpName].success += calls.success;
        mcpUsage[mcpName].errors += calls.errors;
        mcpUsage[mcpName].avgTime = (mcpUsage[mcpName].avgTime + calls.avgTime) / 2;
      });

      // Track error patterns
      execution.errors?.forEach((error: any) => {
        const pattern = this.extractErrorPattern(error);
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
      });

      // Track performance
      if (execution.mcpCalls) {
        Object.entries(execution.mcpCalls).forEach(([mcpName, calls]) => {
          if (!performanceMetrics[mcpName]) {
            performanceMetrics[mcpName] = [];
          }
          performanceMetrics[mcpName].push(calls.avgTime);
        });
      }
    });

    // Calculate performance variability
    const variability: Record<string, number> = {};
    Object.entries(performanceMetrics).forEach(([mcpName, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
      variability[mcpName] = Math.sqrt(variance); // Standard deviation
    });

    return {
      mcpUsage,
      errorPatterns,
      performanceVariability: variability,
      totalExecutions: executionHistory.length
    };
  }

  private extractErrorPattern(error: any): string {
    if (error.message?.includes('rate_limit')) return 'rate_limit';
    if (error.message?.includes('auth')) return 'authentication';
    if (error.message?.includes('timeout')) return 'timeout';
    if (error.message?.includes('network')) return 'network';
    return 'unknown';
  }

  private async generateOptimizations(
    workflowId: string,
    mcpServers: string[],
    analysis: MCPPatternAnalysis,
    context: any
  ): Promise<MCPOptimizationSuggestion[]> {
    const suggestions: MCPOptimizationSuggestion[] = [];

    // 1. MCP Usage Optimization
    Object.entries(analysis.mcpUsage).forEach(([mcpName, stats]) => {
      const errorRate = stats.errors / stats.calls;

      if (errorRate > 0.1) { // More than 10% errors
        suggestions.push({
          type: 'error_reduction',
          mcpName,
          description: `High error rate (${(errorRate * 100).toFixed(1)}%) for ${mcpName}`,
          impact: 'high',
          suggestedActions: [
            `Add retry logic with exponential backoff`,
            `Implement fallback mechanisms`,
            `Review ${mcpName} configuration`
          ],
          potentialImprovement: 'Reduce error rate by 60-80%'
        });
      }

      if (stats.avgTime > 2000) { // More than 2 seconds
        suggestions.push({
          type: 'performance',
          mcpName,
          description: `Slow response times (${stats.avgTime}ms avg) for ${mcpName}`,
          impact: 'medium',
          suggestedActions: [
            `Implement caching for frequent calls`,
            `Review ${mcpName} query complexity`,
            `Consider parallelizing independent calls`
          ],
          potentialImprovement: '30-50% faster responses'
        });
      }
    });

    // 2. Error Pattern Optimization
    Object.entries(analysis.errorPatterns).forEach(([pattern, count]) => {
      if (count > analysis.totalExecutions * 0.2) { // More than 20% of executions
        suggestions.push({
          type: 'error_pattern',
          description: `Frequent ${pattern} errors (${count} occurrences)`,
          impact: 'high',
          suggestedActions: this.getErrorPatternSolutions(pattern),
          potentialImprovement: '80-90% reduction in this error type'
        });
      }
    });

    // 3. MCP Selection Optimization
    const underutilizedMCPs = mcpServers.filter(mcp => !analysis.mcpUsage[mcp]);
    if (underutilizedMCPs.length > 0) {
      suggestions.push({
        type: 'utilization',
        description: `${underutilizedMCPs.length} MCPs not being utilized`,
        impact: 'medium',
        suggestedActions: [
          `Review workflow for opportunities to use ${underutilizedMCPs.join(', ')}`,
          `Consider replacing some calls with more specialized MCPs`
        ],
        potentialImprovement: 'Better resource utilization and potentially faster execution'
      });
    }

    // 4. Context-Aware Optimization
    if (context.relatedConcepts && context.relatedConcepts.length > 0) {
      const relevantMCPs = this.findRelevantMCPs(context.relatedConcepts, mcpServers);
      if (relevantMCPs.length > 0) {
        suggestions.push({
          type: 'context_aware',
          description: `Context suggests additional MCP opportunities`,
          impact: 'low',
          suggestedActions: [
            `Consider adding ${relevantMCPs.join(', ')} for richer context`,
            `These MCPs could provide additional insights based on workflow topics`
          ],
          potentialImprovement: 'More comprehensive results and better decision making'
        });
      }
    }

    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  private getErrorPatternSolutions(pattern: string): string[] {
    const solutions: Record<string, string[]> = {
      rate_limit: [
        'Implement exponential backoff in retry logic',
        'Review API rate limits and consider upgrading plan',
        'Add caching for frequent identical requests'
      ],
      authentication: [
        'Verify API keys and tokens are valid',
        'Check token expiration and implement auto-refresh',
        'Review permission scopes'
      ],
      timeout: [
        'Increase timeout values appropriately',
        'Optimize query complexity',
        'Implement request chunking for large operations'
      ],
      network: [
        'Add retry logic with jitter',
        'Implement circuit breakers',
        'Review network configuration and DNS settings'
      ],
      unknown: [
        'Add comprehensive logging',
        'Implement error classification',
        'Review recent changes to MCP configuration'
      ]
    };

    return solutions[pattern] || solutions.unknown;
  }

  private findRelevantMCPs(concepts: string[], allMCPs: string[]): string[] {
    // Simple mapping - in real app use more sophisticated analysis
    const conceptMCPMap: Record<string, string[]> = {
      reservation: ['Memory', 'GitHub'],
      content: ['Content', 'SEO'],
      financial: ['Context7', 'Memory'],
      guest: ['Communication', 'Memory'],
      deployment: ['Vercel', 'Netlify']
    };

    const relevantMCPs: string[] = [];
    concepts.forEach(concept => {
      const matchedMCPs = conceptMCPMap[concept] || [];
      matchedMCPs.forEach(mcp => {
        if (allMCPs.includes(mcp) && !relevantMCPs.includes(mcp)) {
          relevantMCPs.push(mcp);
        }
      });
    });

    return relevantMCPs;
  }

  private calculateImprovements(
    analysis: MCPPatternAnalysis,
    suggestions: MCPOptimizationSuggestion[]
  ): MCPImprovementMetrics {
    const totalCalls = Object.values(analysis.mcpUsage).reduce(
      (sum, stats) => sum + stats.calls, 0
    );
    const totalErrors = Object.values(analysis.mcpUsage).reduce(
      (sum, stats) => sum + stats.errors, 0
    );

    // Calculate potential improvements
    const errorReductionSuggestions = suggestions.filter(s => s.type === 'error_reduction');
    const performanceSuggestions = suggestions.filter(s => s.type === 'performance');

    const potentialErrorReduction = errorReductionSuggestions.length > 0
      ? totalErrors * 0.7 : 0; // 70% reduction
    const potentialTimeImprovement = performanceSuggestions.length > 0
      ? 0.4 : 0; // 40% time improvement

    return {
      currentErrorRate: totalCalls > 0 ? totalErrors / totalCalls : 0,
      potentialErrorRate: totalCalls > 0 ? (totalErrors - potentialErrorReduction) / totalCalls : 0,
      errorRateImprovement: totalCalls > 0 ? potentialErrorReduction / totalErrors : 0,
      performanceImprovement: potentialTimeImprovement,
      overallScore: this.calculateOverallScore(suggestions)
    };
  }

  private calculateOverallScore(suggestions: MCPOptimizationSuggestion[]): number {
    const impactScores: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const totalScore = suggestions.reduce((sum, suggestion) =>
      sum + impactScores[suggestion.impact], 0
    );
    return Math.min(100, totalScore * 10); // Scale to 0-100
  }
}

interface MCPPatternAnalysis {
  mcpUsage: Record<string, MCPUsageStats>;
  errorPatterns: Record<string, number>;
  performanceVariability: Record<string, number>;
  totalExecutions: number;
}

interface MCPUsageStats {
  calls: number;
  success: number;
  errors: number;
  avgTime: number;
}

interface MCPOptimizationSuggestion {
  type: 'error_reduction' | 'performance' | 'error_pattern' | 'utilization' | 'context_aware';
  mcpName?: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  potentialImprovement: string;
}

interface MCPOptimizationResult {
  workflowId: string;
  currentState: MCPPatternAnalysis;
  suggestions: MCPOptimizationSuggestion[];
  improvements: MCPImprovementMetrics;
  contextUsed: any;
}

interface MCPImprovementMetrics {
  currentErrorRate: number;
  potentialErrorRate: number;
  errorRateImprovement: number;
  performanceImprovement: number;
  overallScore: number; // 0-100
}

export const getMCPOptimizer = (): MCPOptimizer => {
  return new MCPOptimizer();
};
