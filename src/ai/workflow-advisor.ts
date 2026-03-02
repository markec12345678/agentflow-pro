// import { Workflow } from '@prisma/client';
// import { Agent } from '../agents/Agent';
import { getContextManager } from './context-manager';

// Mock Agent interface for now
interface Agent {
  id: string;
  type: string;
  name: string;
  description?: string;
  capabilities: string[];
  version: string;
  recommendedConfig?: any;
  specialization?: string;
}

// Mock Workflow interface for now
interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  nodes?: string;
  edges?: string;
}

export interface WorkflowSuggestion {
  type: 'optimization' | 'error_fix' | 'best_practice' | 'performance';
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  suggestedChanges: {
    nodeId?: string;
    changes: Record<string, any>;
    explanation: string;
  }[];
  metrics?: {
    current?: any;
    expected?: any;
    improvement?: string;
  };
}

export class WorkflowAdvisor {
  private bestPractices: BestPractice[];
  private performanceMetrics: PerformanceMetric[];

  constructor() {
    this.bestPractices = this.loadBestPractices();
    this.performanceMetrics = this.loadPerformanceMetrics();
  }

  async suggestWorkflowImprovements(
    workflow: Workflow,
    availableAgents: Agent[],
    executionHistory?: any[]
  ): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    // Parse workflow
    const nodes = JSON.parse(workflow.nodes || '[]');
    const edges = JSON.parse(workflow.edges || '[]');

    // Analyze workflow structure
    const structureAnalysis = this.analyzeWorkflowStructure(nodes, edges);
    suggestions.push(...structureAnalysis);

    // Check against best practices
    const bestPracticeSuggestions = this.checkBestPractices(nodes, edges);
    suggestions.push(...bestPracticeSuggestions);

    // Analyze performance
    if (executionHistory && executionHistory.length > 0) {
      const performanceSuggestions = this.analyzePerformance(
        nodes,
        edges,
        executionHistory
      );
      suggestions.push(...performanceSuggestions);
    }

    // Suggest agent optimizations
    const agentSuggestions = this.suggestAgentOptimizations(
      nodes,
      availableAgents
    );
    suggestions.push(...agentSuggestions);

    // Sort by impact and confidence
    return suggestions
      .sort((a, b) => {
        const impactScore = this.getImpactScore(b.impact) - this.getImpactScore(a.impact);
        return impactScore !== 0 ? impactScore : b.confidence - a.confidence;
      })
      .slice(0, 10); // Return top 10 suggestions
  }

  private getImpactScore(impact: 'high' | 'medium' | 'low'): number {
    return impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
  }

  private analyzeWorkflowStructure(nodes: any[], edges: any[]): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    // Check for isolated nodes
    const connectedNodes = new Set(edges.flatMap(e => [e.source, e.target]));
    const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id));

    if (isolatedNodes.length > 0) {
      suggestions.push({
        type: 'error_fix',
        description: `${isolatedNodes.length} isolated nodes found that aren't connected to the workflow`,
        impact: 'high',
        confidence: 0.95,
        suggestedChanges: isolatedNodes.map(node => ({
          nodeId: node.id,
          changes: {},
          explanation: `Connect this node to the main workflow or remove it if not needed`
        }))
      });
    }

    // Check for deep chains (potential performance issues)
    const longChains = this.findLongChains(edges);
    if (longChains.length > 0) {
      suggestions.push({
        type: 'performance',
        description: `Long dependency chains detected (max length: ${longChains[0].length})`,
        impact: 'medium',
        confidence: 0.85,
        suggestedChanges: longChains[0].map((nodeId, index) => ({
          nodeId,
          changes: {},
          explanation: index === 0 ?
            'Consider parallelizing parts of this chain' :
            'This node is part of a long sequential chain'
        }))
      });
    }

    // Check for missing error handling
    const nodesWithoutErrorHandling = nodes.filter(node =>
      !node.data?.errorHandling &&
      node.type !== 'start' &&
      node.type !== 'end'
    );

    if (nodesWithoutErrorHandling.length > nodes.length * 0.7) {
      suggestions.push({
        type: 'best_practice',
        description: 'Most nodes lack error handling configuration',
        impact: 'medium',
        confidence: 0.9,
        suggestedChanges: nodesWithoutErrorHandling.slice(0, 3).map(node => ({
          nodeId: node.id,
          changes: {
            errorHandling: {
              retry: 2,
              fallback: 'continue'
            }
          },
          explanation: 'Add basic error handling with retries'
        }))
      });
    }

    return suggestions;
  }

  private findLongChains(edges: any[]): string[][] {
    // Simple chain detection - in real app use graph algorithms
    const chains: string[][] = [];
    const currentChain: string[] = [];

    // This is a simplified version - real implementation would use proper graph traversal
    edges.forEach(edge => {
      if (currentChain.length === 0 || currentChain[currentChain.length - 1] === edge.source) {
        currentChain.push(edge.target);
      } else {
        if (currentChain.length > 5) {
          chains.push([...currentChain]);
        }
        currentChain.length = 0;
      }
    });

    if (currentChain.length > 5) {
      chains.push(currentChain);
    }

    return chains.sort((a, b) => b.length - a.length);
  }

  private checkBestPractices(nodes: any[], edges: any[]): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    // Check for proper start/end nodes
    const hasStart = nodes.some(node => node.type === 'start');
    const hasEnd = nodes.some(node => node.type === 'end');

    if (!hasStart) {
      suggestions.push({
        type: 'best_practice',
        description: 'Workflow is missing a start node',
        impact: 'high',
        confidence: 0.99,
        suggestedChanges: [{
          changes: {
            action: 'add_node',
            type: 'start',
            position: { x: 100, y: 100 }
          },
          explanation: 'Add a start node to clearly define workflow entry point'
        }]
      });
    }

    if (!hasEnd) {
      suggestions.push({
        type: 'best_practice',
        description: 'Workflow is missing an end node',
        impact: 'high',
        confidence: 0.99,
        suggestedChanges: [{
          changes: {
            action: 'add_node',
            type: 'end',
            position: { x: 500, y: 500 }
          },
          explanation: 'Add an end node to clearly define workflow completion'
        }]
      });
    }

    // Check for proper naming conventions
    const unnamedNodes = nodes.filter(node => !node.data?.name || node.data.name.trim() === '');
    if (unnamedNodes.length > 0) {
      suggestions.push({
        type: 'best_practice',
        description: `${unnamedNodes.length} nodes are missing descriptive names`,
        impact: 'low',
        confidence: 0.95,
        suggestedChanges: unnamedNodes.slice(0, 3).map(node => ({
          nodeId: node.id,
          changes: {
            name: `Step-${nodes.indexOf(node) + 1}`
          },
          explanation: 'Add descriptive names to improve workflow readability'
        }))
      });
    }

    // Check for parallelization opportunities
    const sequentialNodes = this.findSequentialNodes(edges);
    if (sequentialNodes.length >= 3) {
      suggestions.push({
        type: 'optimization',
        description: `Potential to parallelize ${sequentialNodes.length} sequential nodes`,
        impact: 'medium',
        confidence: 0.8,
        suggestedChanges: sequentialNodes.slice(0, 2).map(nodeId => ({
          nodeId,
          changes: {
            parallel: true
          },
          explanation: 'Mark this node as parallelizable if it doesn\'t depend on previous nodes'
        }))
      });
    }

    return suggestions;
  }

  private findSequentialNodes(edges: any[]): string[] {
    // Find nodes that could potentially run in parallel
    const sequentialNodes: string[] = [];
    const targets = new Set(edges.map(e => e.target));

    edges.forEach(edge => {
      if (!targets.has(edge.source)) {
        sequentialNodes.push(edge.source);
      }
    });

    return sequentialNodes;
  }

  private analyzePerformance(
    nodes: any[],
    edges: any[],
    executionHistory: any[]
  ): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    // Calculate average execution time
    const totalTime = executionHistory.reduce((sum, exec) => sum + exec.executionTime, 0);
    const avgTime = totalTime / executionHistory.length;

    // Identify slow nodes
    const nodeTimes: Record<string, number> = {};
    executionHistory.forEach(exec => {
      if (exec.nodeTimes) {
        Object.entries(exec.nodeTimes).forEach(([nodeId, time]: [string, number]) => {
          nodeTimes[nodeId] = (nodeTimes[nodeId] || 0) + time;
        });
      }
    });

    const slowNodes = Object.entries(nodeTimes)
      .map(([nodeId, totalTime]) => ({
        nodeId,
        avgTime: totalTime / executionHistory.length,
        node: (nodes as any[]).find((n: any) => n.id === nodeId)
      }))
      .filter(item => item.avgTime > 2000) // More than 2 seconds
      .sort((a, b) => b.avgTime - a.avgTime);

    if (slowNodes.length > 0) {
      suggestions.push({
        type: 'performance',
        description: `${slowNodes.length} slow nodes detected (avg > 2s)`,
        impact: 'high',
        confidence: 0.9,
        metrics: {
          current: `Average: ${avgTime}ms`,
          expected: `Potential 30-50% improvement`,
          improvement: `${slowNodes[0].avgTime}ms → ~${Math.round(slowNodes[0].avgTime * 0.6)}ms`
        },
        suggestedChanges: slowNodes.slice(0, 2).map(item => ({
          nodeId: item.nodeId,
          changes: {
            optimization: {
              cache: true,
              timeout: 5000
            }
          },
          explanation: `Optimize this node (current avg: ${item.avgTime}ms)`
        }))
      });
    }

    // Check for consistent performance
    const timeVariations = executionHistory.map(exec => exec.executionTime);
    const maxTime = Math.max(...timeVariations);
    const minTime = Math.min(...timeVariations);
    const variation = ((maxTime - minTime) / avgTime) * 100;

    if (variation > 50) { // More than 50% variation
      suggestions.push({
        type: 'performance',
        description: 'High performance variation detected across executions',
        impact: 'medium',
        confidence: 0.85,
        metrics: {
          current: `${Math.round(variation)}% variation`,
          expected: '< 20% variation with optimizations'
        },
        suggestedChanges: [{
          changes: {
            stability: {
              retryFailed: true,
              timeout: 10000
            }
          },
          explanation: 'Add stability measures to reduce performance variation'
        }]
      });
    }

    return suggestions;
  }

  private suggestAgentOptimizations(nodes: any[], availableAgents: Agent[]): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    // Find nodes that could use more specialized agents
    nodes.forEach(node => {
      if (node.type === 'agent' && node.data?.agentType) {
        const currentAgent = availableAgents.find(a => a.type === node.data.agentType);
        if (currentAgent) {
          const betterAgent = this.findBetterAgent(currentAgent, node.data.input, availableAgents);
          if (betterAgent) {
            suggestions.push({
              type: 'optimization',
              description: `Better agent available for ${node.data.name || node.id}`,
              impact: 'medium',
              confidence: 0.8,
              suggestedChanges: [{
                nodeId: node.id,
                changes: {
                  agentType: betterAgent.type,
                  agentConfig: betterAgent.recommendedConfig
                },
                explanation: `${betterAgent.type} is more specialized for this task (${betterAgent.specialization})`
              }]
            });
          }
        }
      }
    });

    // Suggest adding missing agents
    const workflowTopics = this.extractWorkflowTopics(nodes);
    const missingAgents = this.findMissingAgents(workflowTopics, availableAgents);

    if (missingAgents.length > 0) {
      suggestions.push({
        type: 'optimization',
        description: `${missingAgents.length} relevant agents not used in this workflow`,
        impact: 'low',
        confidence: 0.7,
        suggestedChanges: missingAgents.slice(0, 2).map(agent => ({
          changes: {
            action: 'add_agent',
            agentType: agent.type,
            suggestedPosition: 'after related nodes'
          },
          explanation: `Consider adding ${agent.type} for ${agent.specialization}`
        }))
      });
    }

    return suggestions;
  }

  private findBetterAgent(
    currentAgent: Agent,
    input: any,
    availableAgents: Agent[]
  ): Agent | null {
    // Simple heuristic - in real app use more sophisticated matching
    const inputText = JSON.stringify(input).toLowerCase();

    // Look for more specialized agents
    const betterAgents = availableAgents.filter(agent => {
      return agent.specialization &&
             agent.specialization !== currentAgent.specialization &&
             inputText.includes(agent.specialization.toLowerCase());
    });

    return betterAgents[0] || null;
  }

  private extractWorkflowTopics(nodes: any[]): string[] {
    const topics = new Set<string>();

    nodes.forEach(node => {
      if (node.data?.name) topics.add(node.data.name.toLowerCase());
      if (node.data?.description) topics.add(node.data.description.toLowerCase());
      if (node.type) topics.add(node.type.toLowerCase());
    });

    return Array.from(topics);
  }

  private findMissingAgents(topics: string[], availableAgents: Agent[]): Agent[] {
    const topicKeywords = topics.join(' ');

    return availableAgents.filter(agent => {
      // Agent is relevant but not used
      const agentKeyword = agent.type.toLowerCase();
      return topicKeywords.includes(agentKeyword) &&
             !topics.some(topic => topic.includes(agentKeyword));
    });
  }

  private loadBestPractices(): BestPractice[] {
    return [
      {
        id: 'start-end-nodes',
        check: (nodes) => nodes.some(n => n.type === 'start') && nodes.some(n => n.type === 'end'),
        suggestion: {
          type: 'best_practice',
          description: 'Every workflow should have clear start and end nodes',
          impact: 'high',
          confidence: 0.99
        }
      },
      {
        id: 'error-handling',
        check: (nodes) => nodes.filter(n => n.data?.errorHandling).length > 0,
        suggestion: {
          type: 'best_practice',
          description: 'Add error handling to critical nodes',
          impact: 'medium',
          confidence: 0.95
        }
      }
    ];
  }

  private loadPerformanceMetrics(): PerformanceMetric[] {
    return [
      {
        id: 'execution-time',
        threshold: 5000, // 5 seconds
        suggestion: {
          type: 'performance',
          description: 'Workflow execution time exceeds threshold',
          impact: 'high',
          confidence: 0.9
        }
      }
    ];
  }
}

interface BestPractice {
  id: string;
  check: (nodes: any[]) => boolean;
  suggestion: Omit<WorkflowSuggestion, 'suggestedChanges'>;
}

interface PerformanceMetric {
  id: string;
  threshold: number;
  suggestion: Omit<WorkflowSuggestion, 'suggestedChanges'>;
}

// Singleton instance
let workflowAdvisorInstance: WorkflowAdvisor | null = null;

export function getWorkflowAdvisor(): WorkflowAdvisor {
  if (!workflowAdvisorInstance) {
    workflowAdvisorInstance = new WorkflowAdvisor();
  }
  return workflowAdvisorInstance;
}
