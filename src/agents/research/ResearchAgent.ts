/**
 * Research Agent - Web Research & Market Intelligence
 * 
 * Capabilities:
 * - Web scraping via Firecrawl
 * - Search via Brave Search API
 * - Competitor analysis
 * - Market research
 * - SEO keyword research
 * 
 * @fires firecrawl-mcp (via MCP)
 * @fires brave-search (via MCP)
 */

import FirecrawlApp from 'firecrawl';
import { Agent } from '../orchestrator/Orchestrator';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ResearchQuery {
  query: string;
  type: 'web' | 'competitor' | 'seo' | 'market';
  limit?: number;
  depth?: 'shallow' | 'medium' | 'deep';
  context?: {
    propertyId?: string;
    industry?: 'tourism' | 'hospitality' | 'travel';
    location?: string;
  };
}

export interface ResearchResult {
  success: boolean;
  query: string;
  results: SearchResult[];
  summary?: string;
  metadata: {
    sources: number;
    timeMs: number;
    confidence: number;
  };
  error?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  snippet: string;
  relevance: number;
  source: 'brave' | 'firecrawl' | 'manual';
  timestamp: Date;
}

export interface CompetitorAnalysis {
  competitors: CompetitorInfo[];
  marketTrends: string[];
  opportunities: string[];
  threats: string[];
}

export interface CompetitorInfo {
  name: string;
  url: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  features: string[];
}

// ============================================
// CONFIGURATION
// ============================================

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

const DEFAULT_LIMIT = 10;
const DEFAULT_DEPTH = 'medium' as const;

const SEARCH_CONFIG = {
  shallow: { maxPages: 5, timeout: 5000 },
  medium: { maxPages: 20, timeout: 15000 },
  deep: { maxPages: 50, timeout: 30000 },
};

// ============================================
// RESEARCH AGENT CLASS
// ============================================

export class ResearchAgent implements Agent {
  readonly id = 'research-agent-001';
  readonly type = 'research' as const;
  readonly name = 'Research Agent';

  private firecrawl?: FirecrawlApp;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (FIRECRAWL_API_KEY) {
      this.firecrawl = new FirecrawlApp({
        apiKey: FIRECRAWL_API_KEY,
      });
      this.initialized = true;
    } else {
      console.warn('[ResearchAgent] Firecrawl API key not configured');
    }
  }

  /**
   * Execute research query
   * Main entry point for the agent
   */
  async execute(input: unknown): Promise<unknown> {
    const startTime = Date.now();

    try {
      // Parse input
      const query = this.parseInput(input);
      
      // Execute research based on type
      let result: ResearchResult;
      
      switch (query.type) {
        case 'competitor':
          result = await this.performCompetitorAnalysis(query);
          break;
        case 'seo':
          result = await this.performSEOResearch(query);
          break;
        case 'market':
          result = await this.performMarketResearch(query);
          break;
        default:
          result = await this.performWebResearch(query);
      }

      // Add execution time
      result.metadata.timeMs = Date.now() - startTime;

      return result;
    } catch (error) {
      console.error('[ResearchAgent] Execution error:', error);
      
      return {
        success: false,
        query: this.parseInput(input).query,
        results: [],
        metadata: {
          sources: 0,
          timeMs: Date.now() - startTime,
          confidence: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ResearchResult;
    }
  }

  /**
   * Parse and validate input
   */
  private parseInput(input: unknown): ResearchQuery {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Invalid input: expected object');
    }

    const obj = input as Record<string, unknown>;
    
    if (typeof obj.query !== 'string') {
      throw new Error('Missing required field: query');
    }

    return {
      query: obj.query as string,
      type: (obj.type as ResearchQuery['type']) || 'web',
      limit: (obj.limit as number) || DEFAULT_LIMIT,
      depth: (obj.depth as ResearchQuery['depth']) || DEFAULT_DEPTH,
      context: obj.context as ResearchQuery['context'],
    };
  }

  /**
   * Perform web research using Brave Search and Firecrawl
   */
  private async performWebResearch(query: ResearchQuery): Promise<ResearchResult> {
    const results: SearchResult[] = [];
    const config = SEARCH_CONFIG[query.depth || DEFAULT_DEPTH];

    try {
      // Step 1: Search with Brave Search API
      if (BRAVE_API_KEY) {
        const braveResults = await this.searchWithBrave(query.query, query.limit || DEFAULT_LIMIT);
        results.push(...braveResults);
      }

      // Step 2: Scrape top results with Firecrawl
      if (this.firecrawl && results.length > 0) {
        const urlsToScrape = results.slice(0, Math.min(config.maxPages, query.limit || DEFAULT_LIMIT));
        
        const scrapePromises = urlsToScrape.map(async (result) => {
          try {
            const scrapeResult = await this.firecrawl!.scrapeUrl(result.url, {
              formats: ['markdown'],
              timeout: config.timeout,
            });

            if (scrapeResult.success && scrapeResult.markdown) {
              return {
                ...result,
                content: scrapeResult.markdown,
              };
            }
            return result;
          } catch (error) {
            console.warn(`[ResearchAgent] Failed to scrape ${result.url}:`, error);
            return result;
          }
        });

        const scrapedResults = await Promise.all(scrapePromises);
        results.splice(0, scrapedResults.length, ...scrapedResults);
      }

      // Step 3: Generate summary
      const summary = this.generateSummary(results, query);

      return {
        success: true,
        query: query.query,
        results,
        summary,
        metadata: {
          sources: results.length,
          timeMs: 0, // Will be set by execute()
          confidence: this.calculateConfidence(results),
        },
      };
    } catch (error) {
      console.error('[ResearchAgent] Web research error:', error);
      throw error;
    }
  }

  /**
   * Perform competitor analysis
   */
  private async performCompetitorAnalysis(query: ResearchQuery): Promise<ResearchResult> {
    const industry = query.context?.industry || 'tourism';
    const location = query.context?.location || 'Slovenia';
    
    // Search for competitors
    const competitorQuery = `best ${industry} companies ${location} ${query.query}`;
    const webResults = await this.performWebResearch({
      ...query,
      query: competitorQuery,
      type: 'web',
    });

    // Analyze competitors
    const competitors = webResults.results.map((result): CompetitorInfo => ({
      name: result.title,
      url: result.url,
      strengths: this.extractStrengths(result.content),
      weaknesses: this.extractWeaknesses(result.content),
      features: this.extractFeatures(result.content),
    }));

    const analysis: CompetitorAnalysis = {
      competitors: competitors.slice(0, 5),
      marketTrends: this.identifyMarketTrends(webResults.results),
      opportunities: this.identifyOpportunities(competitors),
      threats: this.identifyThreats(competitors),
    };

    return {
      ...webResults,
      summary: JSON.stringify(analysis, null, 2),
      metadata: {
        ...webResults.metadata,
        confidence: 0.85,
      },
    };
  }

  /**
   * Perform SEO keyword research
   */
  private async performSEOResearch(query: ResearchQuery): Promise<ResearchResult> {
    const seoQuery = `${query.query} SEO keywords search volume`;
    const webResults = await this.performWebResearch({
      ...query,
      query: seoQuery,
      type: 'web',
    });

    // Extract keyword data
    const keywords = this.extractKeywords(webResults.results);

    return {
      ...webResults,
      summary: `Found ${keywords.length} relevant keywords for "${query.query}"`,
      metadata: {
        ...webResults.metadata,
        confidence: 0.75,
      },
    };
  }

  /**
   * Perform market research
   */
  private async performMarketResearch(query: ResearchQuery): Promise<ResearchResult> {
    const marketQuery = `${query.query} market size trends growth ${query.context?.location || ''}`;
    return this.performWebResearch({
      ...query,
      query: marketQuery,
      type: 'market',
    });
  }

  // ============================================
  // BRAVE SEARCH INTEGRATION
  // ============================================

  private async searchWithBrave(searchQuery: string, count: number): Promise<SearchResult[]> {
    try {
      const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY!,
        },
        params: {
          q: searchQuery,
          count: Math.min(count, 20),
          safesearch: 'off',
        },
      });

      if (!response.ok) {
        throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.web?.results || []).map((result: any): SearchResult => ({
        title: result.title,
        url: result.url,
        content: '',
        snippet: result.description,
        relevance: result.rank || 0,
        source: 'brave',
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error('[ResearchAgent] Brave search error:', error);
      return [];
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private generateSummary(results: SearchResult[], query: ResearchQuery): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    const topSources = results.slice(0, 3).map(r => `- ${r.title} (${r.url})`).join('\n');
    
    return `
## Research Summary for: "${query.query}"

**Sources Found:** ${results.length}
**Top Results:**
${topSources}

**Key Insights:**
${this.extractKeyInsights(results)}
    `.trim();
  }

  private calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    const hasContent = results.filter(r => r.content.length > 100).length;
    const baseConfidence = Math.min(results.length / 10, 1);
    const contentBonus = (hasContent / results.length) * 0.2;
    
    return Math.min(baseConfidence + contentBonus, 1);
  }

  private extractKeyInsights(results: SearchResult[]): string {
    // Simple extraction - in production, use LLM for better summarization
    const snippets = results.slice(0, 5).map(r => r.snippet).join('. ');
    return snippets.length > 500 ? snippets.substring(0, 500) + '...' : snippets;
  }

  private extractStrengths(content: string): string[] {
    // Simple keyword-based extraction
    const strengthKeywords = ['best', 'leading', 'top', 'excellent', 'premier', 'award'];
    return content.split('.')
      .filter(sentence => strengthKeywords.some(keyword => sentence.toLowerCase().includes(keyword)))
      .slice(0, 3);
  }

  private extractWeaknesses(content: string): string[] {
    const weaknessKeywords = ['limited', 'expensive', 'poor', 'issue', 'problem', 'lacking'];
    return content.split('.')
      .filter(sentence => weaknessKeywords.some(keyword => sentence.toLowerCase().includes(keyword)))
      .slice(0, 3);
  }

  private extractFeatures(content: string): string[] {
    const featureKeywords = ['feature', 'service', 'offering', 'includes', 'provides'];
    return content.split('.')
      .filter(sentence => featureKeywords.some(keyword => sentence.toLowerCase().includes(keyword)))
      .slice(0, 5);
  }

  private extractKeywords(results: SearchResult[]): Array<{ keyword: string; volume?: number }> {
    const text = results.map(r => r.snippet + ' ' + r.title).join(' ');
    const words = text.toLowerCase().split(/\s+/);
    
    // Simple frequency analysis
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 3 && !['this', 'that', 'with', 'have', 'from'].includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, volume: count * 100 })); // Rough estimate
  }

  private identifyMarketTrends(results: SearchResult[]): string[] {
    const trendKeywords = ['growth', 'trend', 'increase', 'rise', 'emerging', 'future'];
    const trends: string[] = [];
    
    results.forEach(result => {
      const sentences = result.content.split('.');
      sentences.forEach(sentence => {
        if (trendKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          trends.push(sentence.trim());
        }
      });
    });

    return [...new Set(trends)].slice(0, 5);
  }

  private identifyOpportunities(competitors: CompetitorInfo[]): string[] {
    const opportunities: string[] = [];
    
    // Find common weaknesses
    const allWeaknesses = competitors.flatMap(c => c.weaknesses);
    const weaknessCounts: Record<string, number> = {};
    allWeaknesses.forEach(w => {
      weaknessCounts[w] = (weaknessCounts[w] || 0) + 1;
    });

    Object.entries(weaknessCounts)
      .filter(([_, count]) => count >= 2)
      .forEach(([weakness, _]) => {
        opportunities.push(`Address market gap: ${weakness}`);
      });

    return opportunities.slice(0, 3);
  }

  private identifyThreats(competitors: CompetitorInfo[]): string[] {
    const threats: string[] = [];
    
    // Find common strengths
    const allStrengths = competitors.flatMap(c => c.strengths);
    const strengthCounts: Record<string, number> = {};
    allStrengths.forEach(s => {
      strengthCounts[s] = (strengthCounts[s] || 0) + 1;
    });

    Object.entries(strengthCounts)
      .filter(([_, count]) => count >= 2)
      .forEach(([strength, _]) => {
        threats.push(`Competitor advantage: ${strength}`);
      });

    return threats.slice(0, 3);
  }
}

/**
 * Factory function for creating ResearchAgent
 */
export function createResearchAgent(): ResearchAgent {
  return new ResearchAgent();
}
