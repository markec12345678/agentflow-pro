/**
 * AgentFlow Pro - Hallucination Detection
 * Detect and prevent AI hallucinations in agent outputs
 */

export interface HallucinationCheck {
  checkId: string;
  agentId: string;
  input: string;
  output: string;
  timestamp: string;
  hallucinationScore: number; // 0-1 (higher = more hallucinations)
  flags: HallucinationFlag[];
  factChecks: FactCheckResult[];
  confidenceScore: number; // 0-1
  recommendation: 'accept' | 'review' | 'reject';
}

export interface HallucinationFlag {
  type: FlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: string;
  confidence: number;
}

export type FlagType =
  | 'contradiction'
  | 'unsupported_claim'
  | 'factual_error'
  | 'temporal_inconsistency'
  | 'numerical_inconsistency'
  | 'source_mismatch'
  | 'overconfidence'
  | 'vague_language';

export interface FactCheckResult {
  claim: string;
  verified: boolean;
  sources: Array<{
    url?: string;
    text: string;
    relevance: number;
  }>;
  confidence: number;
}

export interface HallucinationConfig {
  enableFactChecking: boolean;
  enableContradictionDetection: boolean;
  enableSourceVerification: boolean;
  confidenceThreshold: number; // 0-1
  maxHallucinationScore: number; // 0-1
  knowledgeBaseIds?: string[]; // For RAG verification
}

export class HallucinationDetector {
  private config: HallucinationConfig;
  private checks: Map<string, HallucinationCheck> = new Map();

  constructor(config?: Partial<HallucinationConfig>) {
    this.config = {
      enableFactChecking: config?.enableFactChecking ?? true,
      enableContradictionDetection: config?.enableContradictionDetection ?? true,
      enableSourceVerification: config?.enableSourceVerification ?? true,
      confidenceThreshold: config?.confidenceThreshold ?? 0.7,
      maxHallucinationScore: config?.maxHallucinationScore ?? 0.3,
      knowledgeBaseIds: config?.knowledgeBaseIds,
    };
  }

  /**
   * Check output for hallucinations
   */
  async checkHallucination(
    agentId: string,
    input: string,
    output: string,
    context?: any
  ): Promise<HallucinationCheck> {
    const checkId = `hallucination_check_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const flags: HallucinationFlag[] = [];

    // 1. Check for contradictions
    if (this.config.enableContradictionDetection) {
      const contradictions = this.detectContradictions(output);
      flags.push(...contradictions);
    }

    // 2. Check for unsupported claims
    const unsupportedClaims = this.detectUnsupportedClaims(input, output, context);
    flags.push(...unsupportedClaims);

    // 3. Check for factual errors
    if (this.config.enableFactChecking) {
      const factualErrors = await this.checkFacts(output);
      flags.push(...factualErrors);
    }

    // 4. Check for source mismatches
    if (this.config.enableSourceVerification && context?.sources) {
      const sourceMismatches = this.verifySources(output, context.sources);
      flags.push(...sourceMismatches);
    }

    // 5. Check for overconfidence
    const overconfidence = this.detectOverconfidence(output);
    if (overconfidence) flags.push(overconfidence);

    // 6. Check for vague language
    const vagueLanguage = this.detectVagueLanguage(output);
    if (vagueLanguage) flags.push(vagueLanguage);

    // Calculate scores
    const hallucinationScore = this.calculateHallucinationScore(flags);
    const confidenceScore = 1 - hallucinationScore;

    // Determine recommendation
    const recommendation = this.getRecommendation(hallucinationScore, confidenceScore);

    // Perform fact checks
    const factChecks = await this.performFactChecks(output);

    const check: HallucinationCheck = {
      checkId,
      agentId,
      input,
      output,
      timestamp: new Date().toISOString(),
      hallucinationScore: Math.round(hallucinationScore * 100) / 100,
      flags,
      factChecks,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      recommendation,
    };

    this.checks.set(checkId, check);
    return check;
  }

  /**
   * Detect contradictions in output
   */
  private detectContradictions(output: string): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    // Check for contradictory phrases
    const contradictionPatterns = [
      /\b(however|but|although|nevertheless)\b.*\b(previous|earlier|before)\b/i,
      /\b(on the one hand).*\b(on the other hand)\b/i,
      /\b(despite).*\b(contrary)\b/i,
    ];

    for (const pattern of contradictionPatterns) {
      if (pattern.test(output)) {
        flags.push({
          type: 'contradiction',
          severity: 'medium',
          description: 'Potential contradiction detected in output',
          evidence: output.match(pattern)?.[0] || '',
          confidence: 0.7,
        });
      }
    }

    // Check for numerical contradictions
    const numbers = output.match(/\d+(?:\.\d+)?/g) || [];
    const uniqueNumbers = new Set(numbers);
    if (numbers.length > uniqueNumbers.size * 2) {
      // Same numbers repeated many times might indicate inconsistency
      flags.push({
        type: 'numerical_inconsistency',
        severity: 'low',
        description: 'Repeated numerical values detected',
        evidence: `Found ${numbers.length} numbers, ${uniqueNumbers.size} unique`,
        confidence: 0.5,
      });
    }

    return flags;
  }

  /**
   * Detect unsupported claims
   */
  private detectUnsupportedClaims(
    input: string,
    output: string,
    context?: any
  ): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    // Extract claims from output
    const claimPatterns = [
      /\b(according to|research shows|studies indicate|experts agree)\b/gi,
      /\b(it is well known|everyone knows|clearly|obviously)\b/gi,
      /\b(facts show|evidence suggests|data proves)\b/gi,
    ];

    for (const pattern of claimPatterns) {
      const matches = output.match(pattern) || [];
      if (matches.length > 0 && !context?.sources) {
        flags.push({
          type: 'unsupported_claim',
          severity: 'high',
          description: 'Claim made without supporting evidence',
          evidence: matches[0],
          confidence: 0.8,
        });
      }
    }

    // Check if output introduces new information not in input or context
    if (context?.providedFacts) {
      const newClaims = this.extractNewClaims(output, context.providedFacts);
      if (newClaims.length > 0) {
        flags.push({
          type: 'unsupported_claim',
          severity: 'medium',
          description: `${newClaims.length} claim(s) not supported by provided facts`,
          evidence: newClaims.slice(0, 3).join('; '),
          confidence: 0.7,
        });
      }
    }

    return flags;
  }

  /**
   * Check facts against knowledge base
   */
  private async checkFacts(output: string): Promise<HallucinationFlag[]> {
    const flags: HallucinationFlag[] = [];

    // Extract factual claims
    const factualClaims = this.extractFactualClaims(output);

    for (const claim of factualClaims.slice(0, 5)) { // Limit to 5 for performance
      // In production, verify against knowledge base or search API
      // For now, use heuristic checks
      
      // Check for specific dates
      const dateMatch = claim.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i);
      if (dateMatch) {
        const year = parseInt(dateMatch[0].match(/\d{4}/)?.[0] || '0');
        const currentYear = new Date().getFullYear();
        
        if (year > currentYear) {
          flags.push({
            type: 'temporal_inconsistency',
            severity: 'high',
            description: 'Future date mentioned as fact',
            evidence: dateMatch[0],
            confidence: 0.9,
          });
        }
      }

      // Check for specific statistics
      const statMatch = claim.match(/\b(\d+(?:\.\d+)?)\s*(percent|percentage|%|million|billion)\b/i);
      if (statMatch && !claim.includes('approximately') && !claim.includes('about')) {
        flags.push({
          type: 'overconfidence',
          severity: 'low',
          description: 'Precise statistic without qualification',
          evidence: statMatch[0],
          confidence: 0.6,
        });
      }
    }

    return flags;
  }

  /**
   * Verify sources
   */
  private verifySources(output: string, sources: string[]): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    // Check if output cites sources
    const citationPatterns = [
      /\[(\d+)\]/g,
      /source:\s*\S+/gi,
      /according to\s+\S+/gi,
    ];

    let hasCitations = false;
    for (const pattern of citationPatterns) {
      if (pattern.test(output)) {
        hasCitations = true;
        break;
      }
    }

    if (hasCitations && sources.length === 0) {
      flags.push({
        type: 'source_mismatch',
        severity: 'high',
        description: 'Output cites sources but none were provided',
        evidence: 'Citation detected without source material',
        confidence: 0.9,
      });
    }

    return flags;
  }

  /**
   * Detect overconfidence
   */
  private detectOverconfidence(output: string): HallucinationFlag | null {
    const overconfidencePatterns = [
      /\b(absolutely|certainly|definitely|without a doubt|undoubtedly)\b/gi,
      /\b(always|never|every|all|none)\b/gi,
      /\b(proven|fact|truth|reality)\b/gi,
    ];

    let matchCount = 0;
    for (const pattern of overconfidencePatterns) {
      const matches = output.match(pattern) || [];
      matchCount += matches.length;
    }

    if (matchCount >= 3) {
      return {
        type: 'overconfidence',
        severity: 'medium',
        description: 'Overconfident language detected',
        evidence: `${matchCount} absolute terms used`,
        confidence: 0.7,
      };
    }

    return null;
  }

  /**
   * Detect vague language
   */
  private detectVagueLanguage(output: string): HallucinationFlag | null {
    const vaguePatterns = [
      /\b(some people|many say|experts believe|it is said)\b/gi,
      /\b(may|might|could|possibly|perhaps)\b.*\b(may|might|could|possibly|perhaps)\b/gi,
      /\b(generally|typically|usually|often)\b/gi,
    ];

    let matchCount = 0;
    for (const pattern of vaguePatterns) {
      const matches = output.match(pattern) || [];
      matchCount += matches.length;
    }

    if (matchCount >= 4) {
      return {
        type: 'vague_language',
        severity: 'low',
        description: 'Excessive vague language detected',
        evidence: `${matchCount} vague terms used`,
        confidence: 0.6,
      };
    }

    return null;
  }

  /**
   * Extract factual claims from text
   */
  private extractFactualClaims(text: string): string[] {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // Filter for factual-sounding sentences
    const factualPatterns = [
      /\b(is|are|was|were|has|have|had)\b/gi,
      /\b(according to|based on)\b/gi,
      /\b(research|study|data|evidence)\b/gi,
    ];

    return sentences.filter(sentence => {
      return factualPatterns.some(pattern => pattern.test(sentence));
    });
  }

  /**
   * Extract claims not supported by provided facts
   */
  private extractNewClaims(output: string, providedFacts: string[]): string[] {
    const outputSentences = output.match(/[^.!?]+[.!?]+/g) || [];
    const newClaims: string[] = [];

    for (const sentence of outputSentences) {
      const isSupported = providedFacts.some(fact => {
        // Simple keyword overlap check
        const sentenceWords = new Set(sentence.toLowerCase().split(/\s+/));
        const factWords = new Set(fact.toLowerCase().split(/\s+/));
        const overlap = [...sentenceWords].filter(w => factWords.has(w)).length;
        return overlap / Math.max(sentenceWords.size, factWords.size) > 0.5;
      });

      if (!isSupported) {
        newClaims.push(sentence.trim());
      }
    }

    return newClaims;
  }

  /**
   * Perform detailed fact checks
   */
  private async performFactChecks(output: string): Promise<FactCheckResult[]> {
    const claims = this.extractFactualClaims(output).slice(0, 5);
    const factChecks: FactCheckResult[] = [];

    for (const claim of claims) {
      // In production, verify against knowledge base or search API
      factChecks.push({
        claim: claim.trim(),
        verified: false, // Would be determined by fact-checking
        sources: [],
        confidence: 0.5,
      });
    }

    return factChecks;
  }

  /**
   * Calculate overall hallucination score
   */
  private calculateHallucinationScore(flags: HallucinationFlag[]): number {
    if (flags.length === 0) return 0;

    const severityWeights = {
      low: 0.2,
      medium: 0.5,
      high: 1.0,
    };

    let totalScore = 0;
    for (const flag of flags) {
      totalScore += severityWeights[flag.severity] * flag.confidence;
    }

    // Normalize to 0-1
    return Math.min(1, totalScore / flags.length);
  }

  /**
   * Get recommendation based on scores
   */
  private getRecommendation(
    hallucinationScore: number,
    confidenceScore: number
  ): 'accept' | 'review' | 'reject' {
    if (hallucinationScore >= this.config.maxHallucinationScore) {
      return 'reject';
    }
    if (confidenceScore < this.config.confidenceThreshold) {
      return 'review';
    }
    return 'accept';
  }

  /**
   * Get hallucination check by ID
   */
  getCheck(checkId: string): HallucinationCheck | null {
    return this.checks.get(checkId) || null;
  }

  /**
   * Get hallucination statistics
   */
  getStats(agentId?: string): {
    totalChecks: number;
    avgHallucinationScore: number;
    rejectionRate: number;
    commonFlags: Record<string, number>;
  } {
    let checks = Array.from(this.checks.values());
    
    if (agentId) {
      checks = checks.filter(c => c.agentId === agentId);
    }

    const avgHallucinationScore = checks.reduce((sum, c) => sum + c.hallucinationScore, 0) / Math.max(1, checks.length);
    const rejections = checks.filter(c => c.recommendation === 'reject').length;
    
    const commonFlags: Record<string, number> = {};
    checks.forEach(c => {
      c.flags.forEach(f => {
        commonFlags[f.type] = (commonFlags[f.type] || 0) + 1;
      });
    });

    return {
      totalChecks: checks.length,
      avgHallucinationScore: Math.round(avgHallucinationScore * 100) / 100,
      rejectionRate: Math.round((rejections / Math.max(1, checks.length)) * 100) / 100,
      commonFlags,
    };
  }
}

export const hallucinationDetector = new HallucinationDetector();
