// import { Agent } from '../agents/Agent';

export interface Agent {
  id: string;
  type: string;
  name: string;
  description?: string;
  capabilities: string[];
  version: string;
}

export interface EnhancedContext {
  query: string;
  semanticMeaning: string;
  relatedConcepts: string[];
  historicalContext: any[];
  knowledgeGraphNodes: any[];
  temporalContext: {
    currentTime: string;
    relevantEvents: string[];
  };
  userPreferences: any;
  executionHistory: any[];
}

export class ContextManager {
  constructor(
    private memoryMCP: MemoryMCP,
    private knowledgeGraph: KnowledgeGraph
  ) {}

  async getEnhancedContext(
    query: string,
    userId: string,
    agentId: string
  ): Promise<EnhancedContext> {
    const startTime = Date.now();

    // Parallel context gathering
    const [semanticAnalysis, historicalData, graphData, userPrefs] = await Promise.all([
      this.analyzeSemantics(query),
      this.getHistoricalContext(userId, agentId),
      this.getKnowledgeGraphContext(query),
      this.getUserPreferences(userId)
    ]);

    const executionTime = Date.now() - startTime;
    console.log(`Context enrichment completed in ${executionTime}ms`);

    return {
      query,
      semanticMeaning: semanticAnalysis.meaning,
      relatedConcepts: semanticAnalysis.concepts,
      historicalContext: historicalData,
      knowledgeGraphNodes: graphData.nodes,
      temporalContext: this.getTemporalContext(),
      userPreferences: userPrefs,
      executionHistory: [
        {
          agentId,
          query,
          timestamp: new Date().toISOString(),
          enrichmentTime: executionTime
        }
      ]
    };
  }

  private async analyzeSemantics(query: string): Promise<{ meaning: string; concepts: string[] }> {
    // In a real implementation, this would call an NLP service
    // For now, we'll use a simple analysis
    const concepts = this.extractConcepts(query);
    const meaning = this.inferMeaning(query, concepts);

    return { meaning, concepts };
  }

  private extractConcepts(query: string): string[] {
    // Simple keyword extraction
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word))
      .slice(0, 5);

    return [...new Set(keywords)]; // Remove duplicates
  }

  private inferMeaning(query: string, concepts: string[]): string {
    if (concepts.some(c => ['reservation', 'booking', 'guest'].includes(c))) {
      return 'reservation_management';
    }

    if (concepts.some(c => ['content', 'article', 'post', 'seo'].includes(c))) {
      return 'content_creation';
    }

    if (concepts.some(c => ['price', 'cost', 'revenue', 'profit'].includes(c))) {
      return 'financial_analysis';
    }

    return 'general_query';
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'for', 'with', 'from', 'to', 'of'];
    return stopWords.includes(word);
  }

  private async getHistoricalContext(userId: string, agentId: string): Promise<any[]> {
    try {
      // Get recent executions from Memory MCP
      const executions = await this.memoryMCP.searchNodes({
        userId,
        agentId,
        limit: 5,
        types: ['execution']
      });

      return executions.map(exec => ({
        id: exec.id,
        timestamp: exec.timestamp,
        input: exec.data.input,
        output: exec.data.output,
        success: exec.data.success
      }));
    } catch (error) {
      console.error('Failed to get historical context:', error);
      return [];
    }
  }

  private async getKnowledgeGraphContext(query: string): Promise<{ nodes: any[] }> {
    try {
      // Search knowledge graph for related concepts
      const relatedNodes = await this.knowledgeGraph.searchRelated(query, 3);

      return {
        nodes: relatedNodes.map(node => ({
          id: node.id,
          type: node.type,
          label: node.label,
          relevance: node.relevance
        }))
      };
    } catch (error) {
      console.error('Failed to get knowledge graph context:', error);
      return { nodes: [] };
    }
  }

  private async getUserPreferences(userId: string): Promise<any> {
    try {
      // Get user preferences from Memory MCP
      const prefs = await this.memoryMCP.getUserPreferences(userId);
      return prefs || {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  private getTemporalContext(): { currentTime: string; relevantEvents: string[] } {
    const now = new Date();
    const currentTime = now.toISOString();

    // Mock relevant events - in real app, this would come from a calendar API
    const relevantEvents = [
      'Summer season starts in 2 weeks',
      'Local festival next weekend',
      'Holiday season approaching'
    ];

    return { currentTime, relevantEvents };
  }

  // Advanced context methods
  async getContextWithAgents(query: string, userId: string, agents: Agent[]): Promise<EnhancedContext[]> {
    // Get context from multiple agents
    const contexts = await Promise.all(
      agents.map(agent => this.getEnhancedContext(query, userId, agent.id))
    );

    // Merge and deduplicate contexts
    return this.mergeContexts(contexts);
  }

  private mergeContexts(contexts: EnhancedContext[]): EnhancedContext[] {
    // Simple merge strategy - in real app, use more sophisticated merging
    return contexts;
  }

  // Context validation
  validateContext(context: EnhancedContext): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!context.query || context.query.length < 3) {
      issues.push('Query is too short');
    }

    if (context.relatedConcepts.length === 0) {
      issues.push('No related concepts found');
    }

    if (context.historicalContext.length > 10) {
      issues.push('Too much historical context');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Context optimization
  optimizeContext(context: EnhancedContext, maxSize: number = 1024): EnhancedContext {
    // Reduce context size if needed
    if (JSON.stringify(context).length > maxSize) {
      return {
        ...context,
        historicalContext: context.historicalContext.slice(0, 2), // Keep only 2 most recent
        knowledgeGraphNodes: context.knowledgeGraphNodes.slice(0, 3) // Keep only 3 most relevant
      };
    }

    return context;
  }
}

// Mock implementations for demonstration
export class MemoryMCP {
  async searchNodes(params: any): Promise<any[]> {
    // Mock response
    return [
      {
        id: 'exec1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        data: { input: 'previous query', output: 'previous result', success: true }
      }
    ];
  }

  async getUserPreferences(userId: string): Promise<any> {
    return { theme: 'dark', language: 'en' };
  }
}

export class KnowledgeGraph {
  async searchRelated(query: string, limit: number): Promise<any[]> {
    // Mock response
    return [
      { id: 'node1', type: 'concept', label: 'Related Concept 1', relevance: 0.95 },
      { id: 'node2', type: 'entity', label: 'Related Entity', relevance: 0.87 }
    ];
  }
}

// Singleton instance
let contextManagerInstance: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager(
      new MemoryMCP(),
      new KnowledgeGraph()
    );
  }
  return contextManagerInstance;
}
