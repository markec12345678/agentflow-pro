import { getContextManager } from './context-manager';
import { logger } from '@/infrastructure/observability/logger';
import { getMCPOptimizer } from './mcp-optimizer';

export class MCPHealthMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthHistory: MCPHealthReport[] = [];
  private maxHistory = 100;

  constructor(
    private contextManager = getContextManager(),
    private mcpOptimizer = getMCPOptimizer()
  ) {}

  startMonitoring(mcps: string[], intervalMinutes: number = 5): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    // Initial check
    this.checkMCPHealth(mcps);

    // Schedule regular checks
    this.monitoringInterval = setInterval(() => {
      this.checkMCPHealth(mcps);
    }, intervalMinutes * 60 * 1000);

    logger.info(`MCP Health Monitor started (checking ${mcps.length} MCPs every ${intervalMinutes} minutes)`);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('MCP Health Monitor stopped');
    }
  }

  async checkMCPHealth(mcps: string[]): Promise<MCPHealthReport> {
    const startTime = Date.now();
    const report: MCPHealthReport = {
      timestamp: new Date().toISOString(),
      mcps: {},
      overallStatus: 'healthy',
      issues: [],
      recommendations: []
    };

    try {
      // Get context for health check
      const context = await this.contextManager.getEnhancedContext(
        `MCP Health Check: ${mcps.join(', ')}`,
        'system',
        'mcp-monitor'
      );

      // Check each MCP
      for (const mcp of mcps) {
        const mcpHealth = await this.checkSingleMCP(mcp, context);
        report.mcps[mcp] = mcpHealth;

        // Update overall status
        if (mcpHealth.status !== 'healthy') {
          report.overallStatus = 'degraded';
          if (mcpHealth.status === 'critical') {
            report.overallStatus = 'critical';
          }
        }

        // Collect issues
        if (mcpHealth.issues.length > 0) {
          report.issues.push(...mcpHealth.issues.map(issue => ({
            ...issue,
            mcpName: mcp
          })));
        }

        // Collect recommendations
        if (mcpHealth.recommendations.length > 0) {
          report.recommendations.push(...mcpHealth.recommendations.map(rec => ({
            ...rec,
            mcpName: mcp
          })));
        }
      }

      // Add to history
      this.addToHistory(report);

      // Generate insights
      report.insights = this.generateInsights(report);

      logger.info(`MCP Health Check completed in ${Date.now() - startTime}ms`);
      return report;
    } catch (error) {
      logger.error('MCP Health Check failed:', error);
      report.overallStatus = 'error';
      report.issues.push({
        id: `monitor-error-${Date.now()}`,
        type: 'monitoring_error',
        severity: 'high',
        description: 'MCP Health Monitor encountered an error',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
      return report;
    }
  }

  private async checkSingleMCP(mcpName: string, context: any): Promise<SingleMCPHealth> {
    // In a real implementation, this would call the actual MCP server
    // For now, we'll simulate health checks with some random variation
    const status = this.simulateMCPStatus(mcpName);
    const metrics = this.simulateMCPMetrics(mcpName);

    const issues = this.detectIssues(mcpName, metrics, context);
    const recommendations = this.generateRecommendations(mcpName, metrics, issues);

    return {
      mcpName,
      status,
      metrics,
      issues,
      recommendations,
      lastChecked: new Date().toISOString()
    };
  }

  private simulateMCPStatus(mcpName: string): MCPStatus {
    // Some MCPs are more critical than others
    const criticalMCPs = ['Memory', 'GitHub', 'Vercel'];

    if (Math.random() < 0.05) { // 5% chance of issues
      return criticalMCPs.includes(mcpName) ? 'degraded' : 'critical';
    }

    return 'healthy';
  }

  private simulateMCPMetrics(mcpName: string): MCPMetrics {
    // Base metrics with some random variation
    const baseLatency = { Memory: 50, GitHub: 200, Vercel: 300, Firecrawl: 400, Brave: 250 }[mcpName] || 300;
    const baseErrorRate = { Memory: 0.01, GitHub: 0.02, Vercel: 0.01, Firecrawl: 0.05, Brave: 0.03 }[mcpName] || 0.02;

    return {
      latency: {
        avg: baseLatency + Math.random() * 100 - 50,
        p95: baseLatency * 1.5 + Math.random() * 50,
        max: baseLatency * 2 + Math.random() * 100
      },
      errorRate: baseErrorRate + (Math.random() * 0.02 - 0.01),
      requestVolume: 100 + Math.floor(Math.random() * 100),
      availability: Math.random() > 0.1 ? 1.0 : 0.95 + Math.random() * 0.05
    };
  }

  private detectIssues(mcpName: string, metrics: MCPMetrics, context: any): MCPHealthIssue[] {
    const issues: MCPHealthIssue[] = [];

    // Latency issues
    if (metrics.latency.avg > 1000) { // More than 1 second
      issues.push({
        id: `latency-${mcpName}-${Date.now()}`,
        type: 'performance',
        severity: metrics.latency.avg > 2000 ? 'high' : 'medium',
        description: `High latency (${metrics.latency.avg}ms avg, ${metrics.latency.p95}ms p95)`,
        details: {
          currentLatency: metrics.latency,
          threshold: 1000
        }
      });
    }

    // Error rate issues
    if (metrics.errorRate > 0.05) { // More than 5%
      issues.push({
        id: `errors-${mcpName}-${Date.now()}`,
        type: 'reliability',
        severity: metrics.errorRate > 0.1 ? 'high' : 'medium',
        description: `High error rate (${(metrics.errorRate * 100).toFixed(2)}%)`,
        details: {
          currentErrorRate: metrics.errorRate,
          threshold: 0.05
        }
      });
    }

    // Availability issues
    if (metrics.availability < 0.99) { // Less than 99%
      issues.push({
        id: `availability-${mcpName}-${Date.now()}`,
        type: 'availability',
        severity: metrics.availability < 0.95 ? 'high' : 'medium',
        description: `Low availability (${(metrics.availability * 100).toFixed(2)}%)`,
        details: {
          currentAvailability: metrics.availability,
          threshold: 0.99
        }
      });
    }

    // Context-aware issues
    if (context.relatedConcepts) {
      const contextIssues = this.detectContextSpecificIssues(mcpName, metrics, context);
      issues.push(...contextIssues);
    }

    return issues;
  }

  private detectContextSpecificIssues(
    mcpName: string,
    metrics: MCPMetrics,
    context: any
  ): MCPHealthIssue[] {
    const issues: MCPHealthIssue[] = [];

    // Memory MCP specific checks
    if (mcpName === 'Memory' && context.relatedConcepts.includes('reservation')) {
      if (metrics.latency.avg > 300) {
        issues.push({
          id: `memory-reservation-${Date.now()}`,
          type: 'context_specific',
          severity: 'medium',
          description: 'Memory MCP slow for reservation-related operations',
          details: {
            context: 'reservation',
            currentLatency: metrics.latency.avg
          }
        });
      }
    }

    // GitHub MCP specific checks
    if (mcpName === 'GitHub' && context.relatedConcepts.includes('deployment')) {
      if (metrics.errorRate > 0.03) {
        issues.push({
          id: `github-deployment-${Date.now()}`,
          type: 'context_specific',
          severity: 'medium',
          description: 'GitHub MCP error rate high for deployment operations',
          details: {
            context: 'deployment',
            currentErrorRate: metrics.errorRate
          }
        });
      }
    }

    return issues;
  }

  private generateRecommendations(
    mcpName: string,
    metrics: MCPMetrics,
    issues: MCPHealthIssue[]
  ): MCPHealthRecommendation[] {
    const recommendations: MCPHealthRecommendation[] = [];

    // Latency recommendations
    if (issues.some(i => i.type === 'performance')) {
      recommendations.push({
        id: `rec-latency-${mcpName}-${Date.now()}`,
        type: 'performance',
        priority: 'high',
        description: 'Optimize MCP response times',
        actions: [
          `Review ${mcpName} query complexity`,
          `Implement caching for frequent requests`,
          `Consider load balancing if applicable`
        ],
        expectedImpact: '30-50% latency reduction'
      });
    }

    // Error rate recommendations
    if (issues.some(i => i.type === 'reliability')) {
      recommendations.push({
        id: `rec-errors-${mcpName}-${Date.now()}`,
        type: 'reliability',
        priority: 'high',
        description: 'Reduce error rate',
        actions: [
          `Add retry logic with exponential backoff`,
          `Implement circuit breakers`,
          `Review authentication and rate limits`
        ],
        expectedImpact: '60-80% error rate reduction'
      });
    }

    // Availability recommendations
    if (issues.some(i => i.type === 'availability')) {
      recommendations.push({
        id: `rec-availability-${mcpName}-${Date.now()}`,
        type: 'availability',
        priority: 'medium',
        description: 'Improve MCP availability',
        actions: [
          `Add health checks and auto-recovery`,
          `Implement failover mechanisms`,
          `Review infrastructure scaling`
        ],
        expectedImpact: '99.9%+ availability'
      });
    }

    // MCP-specific recommendations
    if (mcpName === 'Memory') {
      recommendations.push({
        id: `rec-memory-${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        description: 'Optimize Memory MCP performance',
        actions: [
          `Review knowledge graph indexing`,
          `Consider sharding for large datasets`,
          `Implement query caching`
        ],
        expectedImpact: '20-40% faster queries'
      });
    }

    if (mcpName === 'GitHub') {
      recommendations.push({
        id: `rec-github-${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        description: 'Optimize GitHub MCP usage',
        actions: [
          `Review API token permissions`,
          `Implement request batching`,
          `Add rate limit monitoring`
        ],
        expectedImpact: 'Better rate limit utilization'
      });
    }

    return recommendations;
  }

  private generateInsights(report: MCPHealthReport): MCPHealthInsight[] {
    const insights: MCPHealthInsight[] = [];

    // Overall health insight
    insights.push({
      id: `insight-overall-${Date.now()}`,
      type: 'overall',
      description: `Overall MCP health: ${report.overallStatus}`,
      metrics: {
        healthyMCPs: Object.values(report.mcps).filter(m => m.status === 'healthy').length,
        degradedMCPs: Object.values(report.mcps).filter(m => m.status === 'degraded').length,
        criticalMCPs: Object.values(report.mcps).filter(m => m.status === 'critical').length
      }
    });

    // Performance insight
    const avgLatency = Object.values(report.mcps).reduce((sum, mcp) =>
      sum + mcp.metrics.latency.avg, 0
    ) / Object.values(report.mcps).length;

    insights.push({
      id: `insight-performance-${Date.now()}`,
      type: 'performance',
      description: `Average MCP latency: ${avgLatency.toFixed(0)}ms`,
      metrics: {
        avgLatency: avgLatency,
        highLatencyMCPs: Object.values(report.mcps).filter(m => m.metrics.latency.avg > 1000).length
      }
    });

    // Reliability insight
    const avgErrorRate = Object.values(report.mcps).reduce((sum, mcp) =>
      sum + mcp.metrics.errorRate, 0
    ) / Object.values(report.mcps).length;

    insights.push({
      id: `insight-reliability-${Date.now()}`,
      type: 'reliability',
      description: `Average MCP error rate: ${(avgErrorRate * 100).toFixed(2)}%`,
      metrics: {
        avgErrorRate: avgErrorRate,
        highErrorMCPs: Object.values(report.mcps).filter(m => m.metrics.errorRate > 0.05).length
      }
    });

    // Trend insight (if we have history)
    if (this.healthHistory.length >= 2) {
      const previousReport = this.healthHistory[this.healthHistory.length - 2];
      const currentReport = report;

      const healthTrend = this.calculateHealthTrend(previousReport, currentReport);
      insights.push({
        id: `insight-trend-${Date.now()}`,
        type: 'trend',
        description: `MCP health trend: ${healthTrend}`,
        metrics: {
          previousIssues: previousReport.issues.length,
          currentIssues: currentReport.issues.length,
          improvement: previousReport.issues.length > currentReport.issues.length
            ? 'improving' : 'degrading'
        }
      });
    }

    return insights;
  }

  private calculateHealthTrend(previous: MCPHealthReport, current: MCPHealthReport): string {
    const previousScore = this.calculateHealthScore(previous);
    const currentScore = this.calculateHealthScore(current);

    if (currentScore > previousScore * 1.1) return 'significantly improved';
    if (currentScore > previousScore) return 'improved';
    if (currentScore < previousScore * 0.9) return 'significantly degraded';
    if (currentScore < previousScore) return 'degraded';
    return 'stable';
  }

  private calculateHealthScore(report: MCPHealthReport): number {
    const mcpCount = Object.keys(report.mcps).length;
    if (mcpCount === 0) return 0;

    const healthyCount = Object.values(report.mcps).filter(m => m.status === 'healthy').length;
    const degradedCount = Object.values(report.mcps).filter(m => m.status === 'degraded').length;
    const criticalCount = Object.values(report.mcps).filter(m => m.status === 'critical').length;

    // Weighted score: healthy=1, degraded=0.5, critical=0
    const score = (healthyCount * 1 + degradedCount * 0.5 + criticalCount * 0) / mcpCount;

    // Penalize for issues
    const issuePenalty = Math.min(0.5, report.issues.length * 0.05);

    return Math.max(0, score - issuePenalty);
  }

  private addToHistory(report: MCPHealthReport): void {
    this.healthHistory.push(report);
    if (this.healthHistory.length > this.maxHistory) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistory);
    }
  }

  getHealthHistory(limit: number = 10): MCPHealthReport[] {
    return this.healthHistory.slice(-limit);
  }

  getCurrentStatus(): MCPHealthStatus {
    if (this.healthHistory.length === 0) {
      return { 
      status: 'unknown', 
      lastCheck: null,
      mcpCount: 0,
      issueCount: 0
    };
    }

    const lastReport = this.healthHistory[this.healthHistory.length - 1];
    return {
      status: lastReport.overallStatus,
      lastCheck: lastReport.timestamp,
      mcpCount: Object.keys(lastReport.mcps).length,
      issueCount: lastReport.issues.length
    };
  }
}

// Interfaces
interface MCPHealthReport {
  timestamp: string;
  mcps: Record<string, SingleMCPHealth>;
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'error';
  issues: MCPHealthIssue[];
  recommendations: MCPHealthRecommendation[];
  insights?: MCPHealthInsight[];
}

interface SingleMCPHealth {
  mcpName: string;
  status: MCPStatus;
  metrics: MCPMetrics;
  issues: MCPHealthIssue[];
  recommendations: MCPHealthRecommendation[];
  lastChecked: string;
}

interface MCPHealthIssue {
  id: string;
  type: 'performance' | 'reliability' | 'availability' | 'context_specific' | 'monitoring_error';
  severity: 'high' | 'medium' | 'low';
  description: string;
  details: any;
}

interface MCPHealthRecommendation {
  id: string;
  type: 'performance' | 'reliability' | 'availability' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  description: string;
  actions: string[];
  expectedImpact: string;
}

interface MCPHealthInsight {
  id: string;
  type: 'overall' | 'performance' | 'reliability' | 'trend';
  description: string;
  metrics: any;
}

type MCPStatus = 'healthy' | 'degraded' | 'critical';

interface MCPMetrics {
  latency: {
    avg: number; // ms
    p95: number; // ms
    max: number; // ms
  };
  errorRate: number; // 0-1
  requestVolume: number;
  availability: number; // 0-1
}

interface MCPHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'error' | 'unknown';
  lastCheck: string | null;
  mcpCount: number;
  issueCount: number;
}

export const getMCPHealthMonitor = (): MCPHealthMonitor => {
  return new MCPHealthMonitor();
};
