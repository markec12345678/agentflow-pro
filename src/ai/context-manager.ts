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

  async getEnhancedContext(query: string, _userId: string, _agentId?: string): Promise<EnhancedContext> {
    const startTime = Date.now();

    // Parallel context gathering
    const [semanticAnalysis, historicalData, graphData, userPrefs] = await Promise.all([
      this.analyzeSemantics(query),
      this.getHistoricalContext(_userId, _agentId || ''),
      this.getHistoricalContext(_userId, _agentId || ''),
      this.getKnowledgeGraphContext(query),
      this.getUserPreferences(_userId)
    ]);

    const executionTime = Date.now() - startTime;
    console.log(`Context enrichment completed in ${executionTime}ms`);

    return {
      query,
      semanticMeaning: semanticAnalysis.meaning,
      relatedConcepts: semanticAnalysis.concepts,
      historicalContext: historicalData,
      knowledgeGraphNodes: (graphData as any).nodes || [],
      temporalContext: this.getTemporalContext(),
      userPreferences: userPrefs,
      executionHistory: [
        {
          agentId: _agentId || '',
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

  /**
   * Store guest preferences from reservation data
   * This builds a knowledge graph of guest preferences for personalization
   */
  async storeGuestPreference(
    guestId: string,
    preferences: {
      propertyId?: string;
      roomId?: string;
      channel?: string;
      totalPrice?: number;
      notes?: string;
      guests?: number;
      checkIn?: Date;
      checkOut?: Date;
    }
  ): Promise<void> {
    try {
      // Create guest entity if not exists
      this.createEntities([{
        name: `guest:${guestId}`,
        entityType: 'Guest',
        observations: [`Guest ID: ${guestId}`]
      }]);

      const observations: string[] = [];

      // Store room preference
      if (preferences.roomId) {
        observations.push(`Preferred room: ${preferences.roomId}`);
        this.createRelations([{
          from: `guest:${guestId}`,
          to: `room:${preferences.roomId}`,
          relationType: 'PREFERS_ROOM'
        }]);
      }

      // Store property preference
      if (preferences.propertyId) {
        observations.push(`Visited property: ${preferences.propertyId}`);
        this.createRelations([{
          from: `guest:${guestId}`,
          to: `property:${preferences.propertyId}`,
          relationType: 'VISITED_PROPERTY'
        }]);
      }

      // Store channel preference
      if (preferences.channel) {
        observations.push(`Booking channel: ${preferences.channel}`);
      }

      // Store price range
      if (preferences.totalPrice) {
        const priceRange = preferences.totalPrice < 100 ? 'budget' 
          : preferences.totalPrice < 300 ? 'mid-range' 
          : 'luxury';
        observations.push(`Price range: ${priceRange} (${preferences.totalPrice} EUR)`);
      }

      // Store guest count preference
      if (preferences.guests) {
        observations.push(`Typical guest count: ${preferences.guests}`);
      }

      // Store special notes
      if (preferences.notes) {
        observations.push(`Special requirements: ${preferences.notes}`);
      }

      // Store seasonality preference
      if (preferences.checkIn) {
        const month = new Date(preferences.checkIn).getMonth();
        const season = this.getSeasonFromMonth(month);
        observations.push(`Preferred season: ${season} (month: ${month + 1})`);
      }

      // Add observations to guest entity
      if (observations.length > 0) {
        this.addObservations([{
          entityName: `guest:${guestId}`,
          contents: observations
        }]);
      }

      console.log(`[MemoryMCP] Stored preferences for guest: ${guestId}`);
    } catch (error) {
      console.error(`[MemoryMCP] Failed to store guest preferences:`, error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Update knowledge graph with reservation data
   * Creates entities and relations for reservations, guests, properties, and rooms
   */
  async updateKnowledgeGraph(data: {
    type: 'reservation' | 'guest' | 'property' | 'inquiry';
    guestId?: string;
    propertyId?: string;
    reservationId?: string;
    reservation?: any;
    timestamp?: Date;
  }): Promise<void> {
    try {
      const timestamp = data.timestamp || new Date();
      const timestampStr = timestamp.toISOString();

      // Create reservation entity
      if (data.type === 'reservation' && data.reservationId) {
        this.createEntities([{
          name: `reservation:${data.reservationId}`,
          entityType: 'Reservation',
          observations: [
            `Reservation ID: ${data.reservationId}`,
            `Created at: ${timestampStr}`,
            ...(data.reservation?.channel ? [`Channel: ${data.reservation.channel}`] : []),
            ...(data.reservation?.status ? [`Status: ${data.reservation.status}`] : []),
            ...(data.reservation?.totalPrice ? [`Total price: ${data.reservation.totalPrice} EUR`] : []),
            ...(data.reservation?.guests ? [`Guests: ${data.reservation.guests}`] : []),
          ]
        }]);

        // Link reservation to guest
        if (data.guestId) {
          this.createRelations([{
            from: `reservation:${data.reservationId}`,
            to: `guest:${data.guestId}`,
            relationType: 'BELONGS_TO_GUEST'
          }]);

          // Update guest's reservation history
          this.addObservations([{
            entityName: `guest:${data.guestId}`,
            contents: [`Latest reservation: ${data.reservationId} (${timestampStr})`]
          }]);
        }

        // Link reservation to property
        if (data.propertyId) {
          this.createRelations([{
            from: `reservation:${data.reservationId}`,
            to: `property:${data.propertyId}`,
            relationType: 'AT_PROPERTY'
          }]);

          // Update property's reservation count
          this.addObservations([{
            entityName: `property:${data.propertyId}`,
            contents: [`Latest reservation: ${data.reservationId} (${timestampStr})`]
          }]);
        }

        // Link reservation to room if applicable
        if (data.reservation?.roomId) {
          this.createRelations([{
            from: `reservation:${data.reservationId}`,
            to: `room:${data.reservation.roomId}`,
            relationType: 'ASSIGNED_TO_ROOM'
          }]);
        }

        // Create temporal relations for seasonality
        if (data.reservation?.checkIn) {
          const checkInDate = new Date(data.reservation.checkIn);
          const month = checkInDate.getMonth();
          const season = this.getSeasonFromMonth(month);
          
          this.createRelations([{
            from: `reservation:${data.reservationId}`,
            to: `season:${season}`,
            relationType: 'IN_SEASON'
          }]);

          this.createRelations([{
            from: `reservation:${data.reservationId}`,
            to: `month:${month + 1}`,
            relationType: 'IN_MONTH'
          }]);
        }

        console.log(`[MemoryMCP] Updated knowledge graph with reservation: ${data.reservationId}`);
      }

      // Handle guest entity updates
      if (data.type === 'guest' && data.guestId) {
        this.createEntities([{
          name: `guest:${data.guestId}`,
          entityType: 'Guest',
          observations: [`Guest entity updated at: ${timestampStr}`]
        }]);

        console.log(`[MemoryMCP] Updated guest entity: ${data.guestId}`);
      }

      // Handle property entity updates
      if (data.type === 'property' && data.propertyId) {
        this.createEntities([{
          name: `property:${data.propertyId}`,
          entityType: 'Property',
          observations: [`Property entity updated at: ${timestampStr}`]
        }]);

        console.log(`[MemoryMCP] Updated property entity: ${data.propertyId}`);
      }
    } catch (error) {
      console.error(`[MemoryMCP] Failed to update knowledge graph:`, error);
      // Don't throw - this is non-critical
    }
  }

  private getSeasonFromMonth(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 8) return 'summer';
    if (month >= 9 && month <= 10) return 'autumn';
    return 'winter';
  }

  // Private methods for internal use
  private createEntities(entities: Array<{ name: string; entityType: string; observations: string[] }>): void {
    // In a real implementation, this would call the Memory MCP server
    // For now, just log
    console.log('[MemoryMCP] Creating entities:', entities);
  }

  private addObservations(obs: Array<{ entityName: string; contents: string[] }>): void {
    // In a real implementation, this would call the Memory MCP server
    console.log('[MemoryMCP] Adding observations:', obs);
  }

  private createRelations(relations: Array<{ from: string; to: string; relationType: string }>): void {
    // In a real implementation, this would call the Memory MCP server
    console.log('[MemoryMCP] Creating relations:', relations);
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
