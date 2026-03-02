import { Agent } from '../orchestrator/Orchestrator';
import { getContextManager } from '../ai/context-manager';
import { getWorkflowAdvisor } from '../ai/workflow-advisor';

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private agentMetadata: Map<string, AgentMetadata> = new Map();
  private usageStats: Map<string, AgentUsageStats> = new Map();

  constructor(
    private contextManager = getContextManager(),
    private workflowAdvisor = getWorkflowAdvisor()
  ) {}

  registerAgent(agent: Agent, metadata?: Partial<AgentMetadata>): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already registered`);
    }

    this.agents.set(agent.id, agent);

    // Set default metadata
    this.agentMetadata.set(agent.id, {
      id: agent.id,
      name: agent.id,
      type: agent.type,
      version: '1.0.0',
      description: metadata?.description || `Agent for ${agent.type} operations`,
      capabilities: metadata?.capabilities || this.inferCapabilities(agent),
      dependencies: metadata?.dependencies || [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
      ...metadata
    });

    // Initialize usage stats
    this.usageStats.set(agent.id, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgExecutionTime: 0,
      lastUsed: null
    });

    console.log(`Agent ${agent.id} registered successfully`);
  }

  private inferCapabilities(agent: Agent): string[] {
    // Infer capabilities based on agent type
    const typeCapabilities: Record<string, string[]> = {
      'Content': ['content_generation', 'text_processing', 'seo_optimization'],
      'Research': ['web_search', 'data_analysis', 'information_retrieval'],
      'Code': ['code_generation', 'code_review', 'repository_management'],
      'Deploy': ['deployment', 'ci_cd', 'environment_management'],
      'Communication': ['email', 'messaging', 'notification'],
      'Optimization': ['performance_analysis', 'cost_optimization', 'resource_management'],
      'Personalization': ['user_profiling', 'recommendation', 'preference_management']
    };

    return typeCapabilities[agent.type] || ['general_purpose'];
  }

  getAgent(agentId: string): Agent | null {
    return this.agents.get(agentId) || null;
  }

  getAgentMetadata(agentId: string): AgentMetadata | null {
    return this.agentMetadata.get(agentId) || null;
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAllAgentMetadata(): AgentMetadata[] {
    return Array.from(this.agentMetadata.values());
  }

  async getIntelligentAgentRecommendation(
    workflowContext: string,
    requiredCapabilities: string[]
  ): Promise<AgentRecommendation> {
    // 1. Get enhanced context
    const context = await this.contextManager.getEnhancedContext(
      `Recommend agent for: ${workflowContext}`,
      'system',
      'agent-registry'
    );

    // 2. Find matching agents
    const matchingAgents = this.findMatchingAgents(requiredCapabilities, context);

    // 3. Rank agents by suitability
    const rankedAgents = this.rankAgents(matchingAgents, requiredCapabilities, context);

    // 4. Generate recommendation
    const recommendation = this.generateRecommendation(
      rankedAgents,
      requiredCapabilities,
      context
    );

    return recommendation;
  }

  private findMatchingAgents(
    requiredCapabilities: string[],
    context: any
  ): Array<{ agent: Agent; metadata: AgentMetadata; score: number }> {
    const matchingAgents: Array<{ agent: Agent; metadata: AgentMetadata; score: number }> = [];

    this.agents.forEach((agent, agentId) => {
      const metadata = this.agentMetadata.get(agentId);
      if (!metadata) return;

      // Calculate capability match score
      const capabilityScore = this.calculateCapabilityScore(
        metadata.capabilities,
        requiredCapabilities
      );

      // Calculate context relevance score
      const contextScore = this.calculateContextScore(metadata, context);

      // Calculate usage score (prefer more reliable agents)
      const usageStats = this.usageStats.get(agentId);
      const usageScore = usageStats
        ? (usageStats.successfulExecutions / Math.max(1, usageStats.totalExecutions)) || 0
        : 0.5;

      const totalScore = capabilityScore * 0.5 + contextScore * 0.3 + usageScore * 0.2;

      if (totalScore > 0.1) { // Minimum threshold
        matchingAgents.push({
          agent,
          metadata,
          score: totalScore
        });
      }
    });

    return matchingAgents.sort((a, b) => b.score - a.score);
  }

  private calculateCapabilityScore(
    agentCapabilities: string[],
    requiredCapabilities: string[]
  ): number {
    if (requiredCapabilities.length === 0) return 1.0;

    const matches = agentCapabilities.filter(cap =>
      requiredCapabilities.includes(cap)
    );

    return matches.length / requiredCapabilities.length;
  }

  private calculateContextScore(metadata: AgentMetadata, context: any): number {
    // Check if agent type matches context concepts
    if (context.relatedConcepts && context.relatedConcepts.length > 0) {
      const typeMatch = context.relatedConcepts.some((concept: string) =>
        metadata.type.toLowerCase().includes(concept) ||
        concept.includes(metadata.type.toLowerCase())
      );

      if (typeMatch) return 0.8;
    }

    // Check if agent description matches context
    if (metadata.description && context.semanticMeaning) {
      const descriptionMatch = metadata.description
        .toLowerCase()
        .includes(context.semanticMeaning.toLowerCase());

      if (descriptionMatch) return 0.6;
    }

    return 0.3; // Base context score
  }

  private rankAgents(
    agents: Array<{ agent: Agent; metadata: AgentMetadata; score: number }>,
    requiredCapabilities: string[],
    context: any
  ): AgentRanking[] {
    return agents.map(item => {
      const usageStats = this.usageStats.get(item.agent.id);

      return {
        agentId: item.agent.id,
        agentType: item.agent.type,
        score: item.score,
        capabilityMatch: this.calculateCapabilityScore(
          item.metadata.capabilities,
          requiredCapabilities
        ),
        reliability: usageStats
          ? (usageStats.successfulExecutions / Math.max(1, usageStats.totalExecutions)) || 0
          : 0.5,
        lastUsed: usageStats?.lastUsed || null,
        totalExecutions: usageStats?.totalExecutions || 0,
        metadata: item.metadata
      };
    }).sort((a, b) => b.score - a.score);
  }

  private generateRecommendation(
    rankedAgents: AgentRanking[],
    requiredCapabilities: string[],
    context: any
  ): AgentRecommendation {
    if (rankedAgents.length === 0) {
      return {
        query: context.query,
        recommendedAgent: null,
        alternatives: [],
        confidence: 0,
        reasoning: 'No suitable agents found for the required capabilities'
      };
    }

    const topAgent = rankedAgents[0];
    const alternatives = rankedAgents.slice(1, 3);

    // Calculate confidence based on score and reliability
    const confidence = Math.min(0.95, topAgent.score * topAgent.reliability);

    return {
      query: context.query,
      recommendedAgent: {
        agentId: topAgent.agentId,
        agentType: topAgent.agentType,
        score: topAgent.score,
        capabilityMatch: topAgent.capabilityMatch,
        reliability: topAgent.reliability,
        metadata: topAgent.metadata
      },
      alternatives: alternatives.map(alt => ({
        agentId: alt.agentId,
        agentType: alt.agentType,
        score: alt.score,
        capabilityMatch: alt.capabilityMatch,
        reliability: alt.reliability
      })),
      confidence,
      reasoning: this.generateReasoning(topAgent, requiredCapabilities, context),
      contextUsed: {
        semanticMeaning: context.semanticMeaning,
        relatedConcepts: context.relatedConcepts,
        historicalContext: context.historicalContext
      }
    };
  }

  private generateReasoning(
    topAgent: AgentRanking,
    requiredCapabilities: string[],
    context: any
  ): string {
    const reasons: string[] = [];

    // Capability match reasoning
    if (topAgent.capabilityMatch >= 0.8) {
      reasons.push(`excellent capability match (${Math.round(topAgent.capabilityMatch * 100)}%)`);
    } else if (topAgent.capabilityMatch >= 0.5) {
      reasons.push(`good capability match (${Math.round(topAgent.capabilityMatch * 100)}%)`);
    }

    // Reliability reasoning
    if (topAgent.reliability >= 0.95) {
      reasons.push('high reliability (95%+ success rate)');
    } else if (topAgent.reliability >= 0.8) {
      reasons.push('good reliability (80%+ success rate)');
    }

    // Context reasoning
    if (context.relatedConcepts && context.relatedConcepts.length > 0) {
      reasons.push(`matches workflow context (${context.relatedConcepts.join(', ')})`);
    }

    // Usage reasoning
    if (topAgent.totalExecutions > 100) {
      reasons.push('extensively used (100+ executions)');
    } else if (topAgent.totalExecutions > 10) {
      reasons.push('proven track record (10+ executions)');
    }

    return `Recommended ${topAgent.agentType} agent because of ${reasons.join(', ')}.`;
  }

  recordExecution(
    agentId: string,
    success: boolean,
    executionTime: number
  ): void {
    const stats = this.usageStats.get(agentId);
    if (!stats) return;

    stats.totalExecutions++;
    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }

    // Update average execution time (moving average)
    stats.avgExecutionTime =
      (stats.avgExecutionTime * (stats.totalExecutions - 1) + executionTime) / stats.totalExecutions;

    stats.lastUsed = new Date().toISOString();

    // Update metadata last used
    const metadata = this.agentMetadata.get(agentId);
    if (metadata) {
      metadata.lastUsed = new Date().toISOString();
    }
  }

  getAgentStats(agentId: string): AgentUsageStats | null {
    return this.usageStats.get(agentId) || null;
  }

  getAllAgentStats(): Array<AgentUsageStats & { agentId: string }> {
    return Array.from(this.usageStats.entries()).map(([agentId, stats]) => ({
      agentId,
      ...stats
    }));
  }

  async getWorkflowAgentRecommendations(
    workflowId: string,
    workflowData: any
  ): Promise<WorkflowAgentRecommendation> {
    // 1. Get workflow context
    const context = await this.contextManager.getEnhancedContext(
      `Analyze workflow ${workflowId}`,
      'system',
      'agent-registry'
    );

    // 2. Extract required capabilities from workflow
    const requiredCapabilities = this.extractWorkflowCapabilities(workflowData, context);

    // 3. Get intelligent recommendations
    const recommendation = await this.getIntelligentAgentRecommendation(
      `Workflow ${workflowId} execution`,
      requiredCapabilities
    );

    // 4. Get workflow-specific optimizations
    const availableAgents = this.getAllAgents();
    const workflowSuggestions = await this.workflowAdvisor.suggestWorkflowImprovements(
      workflowData as any,
      availableAgents,
      workflowData.executions || []
    );

    return {
      workflowId,
      context,
      requiredCapabilities,
      agentRecommendation: recommendation,
      workflowSuggestions,
      timestamp: new Date().toISOString()
    };
  }

  private extractWorkflowCapabilities(workflowData: any, context: any): string[] {
    const capabilities: string[] = [];

    // Check workflow type
    if (workflowData.type) {
      const typeCapabilities: Record<string, string[]> = {
        'content': ['content_generation', 'seo_optimization'],
        'reservation': ['booking_management', 'guest_communication'],
        'deployment': ['ci_cd', 'environment_management'],
        'research': ['web_search', 'data_analysis']
      };

      const workflowCapabilities = typeCapabilities[workflowData.type.toLowerCase()];
      if (workflowCapabilities) {
        capabilities.push(...workflowCapabilities);
      }
    }

    // Check context for additional capabilities
    if (context.relatedConcepts) {
      context.relatedConcepts.forEach((concept: string) => {
        const conceptCapabilities: Record<string, string[]> = {
          'seo': ['seo_optimization', 'content_analysis'],
          'booking': ['booking_management', 'calendar_management'],
          'github': ['repository_management', 'code_review'],
          'vercel': ['deployment', 'environment_management']
        };

        const conceptCaps = conceptCapabilities[concept.toLowerCase()];
        if (conceptCaps) {
          capabilities.push(...conceptCaps.filter(cap => !capabilities.includes(cap)));
        }
      });
    }

    // Add base capabilities
    if (capabilities.length === 0) {
      capabilities.push('workflow_execution', 'task_management');
    }

    return [...new Set(capabilities)]; // Remove duplicates
  }

  async analyzeAgentEcosystem(): Promise<AgentEcosystemAnalysis> {
    const agents = this.getAllAgents();
    const metadataList = this.getAllAgentMetadata();
    const statsList = this.getAllAgentStats();

    // Calculate ecosystem metrics
    const totalAgents = agents.length;
    const activeAgents = metadataList.filter(m => m.status === 'active').length;
    const totalExecutions = statsList.reduce((sum, stat) => sum + stat.totalExecutions, 0);
    const successRate = statsList.reduce((sum, stat) => sum + stat.successfulExecutions, 0) / Math.max(1, totalExecutions);

    // Categorize agents
    const byType: Record<string, number> = {};
    const byCapability: Record<string, number> = {};

    metadataList.forEach(metadata => {
      byType[metadata.type] = (byType[metadata.type] || 0) + 1;
      metadata.capabilities.forEach(cap => {
        byCapability[cap] = (byCapability[cap] || 0) + 1;
      });
    });

    // Find most used agents
    const mostUsed = statsList
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, 3)
      .map(stat => ({
        agentId: stat.agentId,
        executions: stat.totalExecutions
      }));

    // Find most reliable agents
    const mostReliable = statsList
      .filter(stat => stat.totalExecutions > 0)
      .map(stat => ({
        agentId: stat.agentId,
        reliability: stat.successfulExecutions / stat.totalExecutions
      }))
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, 3);

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        totalAgents,
        activeAgents,
        inactiveAgents: totalAgents - activeAgents,
        totalExecutions,
        successRate,
        avgExecutionsPerAgent: totalExecutions / Math.max(1, totalAgents)
      },
      distribution: {
        byType,
        byCapability
      },
      topAgents: {
        mostUsed,
        mostReliable,
        mostCapable: this.findMostCapableAgents(metadataList).slice(0, 3)
      },
      recommendations: this.generateEcosystemRecommendations(metadataList, statsList)
    };
  }

  private findMostCapableAgents(metadataList: AgentMetadata[]): Array<{ agentId: string; capabilityCount: number }> {
    return metadataList
      .map(metadata => ({
        agentId: metadata.id,
        capabilityCount: metadata.capabilities.length
      }))
      .sort((a, b) => b.capabilityCount - a.capabilityCount);
  }

  private generateEcosystemRecommendations(
    metadataList: AgentMetadata[],
    statsList: Array<AgentUsageStats & { agentId: string }>
  ): AgentEcosystemRecommendation[] {
    const recommendations: AgentEcosystemRecommendation[] = [];

    // Check for underutilized agents
    const underutilized = statsList
      .filter(stat => stat.totalExecutions === 0 || stat.successfulExecutions / stat.totalExecutions < 0.5)
      .map(stat => stat.agentId);

    if (underutilized.length > 0) {
      recommendations.push({
        type: 'utilization',
        description: `${underutilized.length} agents are underutilized or have low success rates`,
        affectedAgents: underutilized,
        suggestedActions: [
          'Review agent configurations',
          'Consider deprecating unused agents',
          'Improve error handling for low-success agents'
        ]
      });
    }

    // Check for capability gaps
    const allCapabilities = new Set<string>();
    metadataList.forEach(metadata => {
      metadata.capabilities.forEach(cap => allCapabilities.add(cap));
    });

    const commonCapabilities = Array.from(allCapabilities)
      .map(cap => ({
        capability: cap,
        count: metadataList.filter(m => m.capabilities.includes(cap)).length
      }))
      .filter(item => item.count === 1); // Only one agent has this capability

    if (commonCapabilities.length > 0) {
      recommendations.push({
        type: 'redundancy',
        description: `${commonCapabilities.length} capabilities have only single-agent coverage`,
        affectedCapabilities: commonCapabilities.map(item => item.capability),
        suggestedActions: [
          'Consider adding backup agents for critical capabilities',
          'Review single-point-of-failure risks',
          'Document contingency plans'
        ]
      });
    }

    // Check for version diversity
    const versions = new Set(metadataList.map(m => m.version));
    if (versions.size > 3) {
      recommendations.push({
        type: 'maintenance',
        description: 'Multiple agent versions in use',
        affectedAgents: Array.from(versions).map(version => ({
          version,
          count: metadataList.filter(m => m.version === version).length
        })),
        suggestedActions: [
          'Standardize on latest stable versions',
          'Schedule upgrades for older versions',
          'Review version compatibility'
        ]
      });
    }

    return recommendations;
  }
}

// Interfaces
interface AgentMetadata {
  id: string;
  name: string;
  type: string;
  version: string;
  description: string;
  capabilities: string[];
  dependencies: string[];
  createdAt: string;
  lastUpdated: string;
  lastUsed?: string;
  status: 'active' | 'deprecated' | 'experimental';
}

interface AgentUsageStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  lastUsed: string | null;
}

interface AgentRecommendation {
  query: string;
  recommendedAgent: {
    agentId: string;
    agentType: string;
    score: number;
    capabilityMatch: number;
    reliability: number;
    metadata: AgentMetadata;
  } | null;
  alternatives: Array<{
    agentId: string;
    agentType: string;
    score: number;
    capabilityMatch: number;
    reliability: number;
  }>;
  confidence: number; // 0-1
  reasoning: string;
  contextUsed: any;
}

interface AgentRanking {
  agentId: string;
  agentType: string;
  score: number;
  capabilityMatch: number;
  reliability: number;
  lastUsed: string | null;
  totalExecutions: number;
  metadata: AgentMetadata;
}

interface WorkflowAgentRecommendation {
  workflowId: string;
  context: any;
  requiredCapabilities: string[];
  agentRecommendation: AgentRecommendation;
  workflowSuggestions: any[];
  timestamp: string;
}

interface AgentEcosystemAnalysis {
  timestamp: string;
  metrics: {
    totalAgents: number;
    activeAgents: number;
    inactiveAgents: number;
    totalExecutions: number;
    successRate: number;
    avgExecutionsPerAgent: number;
  };
  distribution: {
    byType: Record<string, number>;
    byCapability: Record<string, number>;
  };
  topAgents: {
    mostUsed: Array<{ agentId: string; executions: number }>;
    mostReliable: Array<{ agentId: string; reliability: number }>;
    mostCapable: Array<{ agentId: string; capabilityCount: number }>;
  };
  recommendations: AgentEcosystemRecommendation[];
}

interface AgentEcosystemRecommendation {
  type: 'utilization' | 'redundancy' | 'maintenance' | 'performance';
  description: string;
  affectedAgents?: string[];
  affectedCapabilities?: string[];
  suggestedActions: string[];
}

export const getAgentRegistry = (): AgentRegistry => {
  return new AgentRegistry();
};
