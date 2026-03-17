/**
 * Reusable LangGraph Edges
 * 
 * Common edge implementations for agent graphs
 */

import { ResearchState } from '../graphs/research-agent';

// ============================================================================
// TYPES
// ============================================================================

export type EdgeFunction<T = any> = (state: T) => string | Promise<string>;
export type ConditionalEdgeMap = Record<string, string>;

// ============================================================================
// ROUTING EDGES
// ============================================================================

/**
 * Simple Conditional Edge
 * Route based on a simple condition
 */
export function createConditionalEdge<T>(
  conditionFn: (state: T) => boolean,
  truePath: string,
  falsePath: string
): EdgeFunction<T> {
  return (state: T) => conditionFn(state) ? truePath : falsePath;
}

/**
 * Multi-way Router
 * Route to one of multiple paths based on value
 */
export function createRouterEdge<T>(
  valueExtractor: (state: T) => string | number,
  routeMap: Record<string | number, string>,
  defaultPath?: string
): EdgeFunction<T> {
  return (state: T) => {
    const value = valueExtractor(state);
    return routeMap[value] || defaultPath || END_EDGE;
  };
}

/**
 * Quality-based Router
 * Route based on quality score
 */
export function createQualityEdge(
  qualityThreshold: number = 0.7,
  highQualityPath: string = 'complete',
  lowQualityPath: string = 'retry'
): EdgeFunction<ResearchState> {
  return (state: ResearchState) => {
    const confidence = state.confidence || 0;
    
    if (confidence >= qualityThreshold) {
      return highQualityPath;
    }
    
    // Check retry count
    const retryCount = state.retryCount || 0;
    if (retryCount < 2) {
      return lowQualityPath;
    }
    
    // Max retries reached, continue anyway
    return highQualityPath;
  };
}

/**
 * Error-based Router
 * Route based on error presence
 */
export function createErrorEdge<T>(
  errorKey: string = 'error',
  errorPath: string = 'handle_error',
  successPath: string = 'continue'
): EdgeFunction<T> {
  return (state: T) => {
    const hasError = !!(state as any)[errorKey];
    return hasError ? errorPath : successPath;
  };
}

// ============================================================================
// VALIDATION EDGES
// ============================================================================

/**
 * Schema Validation Edge
 * Route based on schema validation
 */
export function createValidationEdge<T>(
  validatorFn: (state: T) => { valid: boolean; errors: string[] },
  validPath: string = 'valid',
  invalidPath: string = 'fix'
): EdgeFunction<T> {
  return (state: T) => {
    const result = validatorFn(state);
    return result.valid ? validPath : invalidPath;
  };
}

/**
 * Completeness Check Edge
 * Route based on whether all required fields are present
 */
export function createCompletenessEdge<T>(
  requiredFields: string[]
): EdgeFunction<T> {
  return (state: T) => {
    const missingFields = requiredFields.filter(field => {
      const value = (state as any)[field];
      return value === undefined || value === null || value === '';
    });
    
    return missingFields.length === 0 ? 'complete' : 'gather_more';
  };
}

// ============================================================================
// RETRY EDGES
// ============================================================================

/**
 * Retry with Backoff Edge
 * Route with exponential backoff
 */
export function createRetryEdge(
  retryPath: string,
  failPath: string,
  maxRetries: number = 3,
  retryCountKey: string = 'retryCount'
): EdgeFunction<any> {
  return (state: any) => {
    const retryCount = state[retryCountKey] || 0;
    
    if (retryCount < maxRetries) {
      return retryPath;
    }
    
    return failPath;
  };
}

/**
 * Conditional Retry Edge
 * Retry only if certain conditions are met
 */
export function createConditionalRetryEdge<T>(
  shouldRetryFn: (state: T) => boolean,
  retryPath: string,
  continuePath: string,
  maxRetriesKey: string = 'maxRetries',
  retryCountKey: string = 'retryCount'
): EdgeFunction<T> {
  return (state: T) => {
    const shouldRetry = shouldRetryFn(state);
    const retryCount = (state as any)[retryCountKey] || 0;
    const maxRetries = (state as any)[maxRetriesKey] || 3;
    
    if (shouldRetry && retryCount < maxRetries) {
      return retryPath;
    }
    
    return continuePath;
  };
}

// ============================================================================
// STATE-BASED EDGES
// ============================================================================

/**
 * State Machine Edge
 * Route based on current state value
 */
export function createStateEdge<T>(
  stateKey: string,
  stateMap: Record<string, string>,
  defaultPath?: string
): EdgeFunction<T> {
  return (state: T) => {
    const currentState = (state as any)[stateKey];
    return stateMap[currentState] || defaultPath || END_EDGE;
  };
}

/**
 * Progress-based Edge
 * Route based on progress percentage
 */
export function createProgressEdge(
  progressKey: string = 'progress',
  thresholds: Array<{ threshold: number; path: string }>,
  defaultPath?: string
): EdgeFunction<any> {
  return (state: any) => {
    const progress = state[progressKey] || 0;
    
    for (const { threshold, path } of thresholds) {
      if (progress >= threshold) {
        return path;
      }
    }
    
    return defaultPath || END_EDGE;
  };
}

// ============================================================================
// UTILITY EDGES
// ============================================================================

/**
 * Always END Edge
 * Always route to END
 */
export const END_EDGE = '__END__';

/**
 * Always Continue Edge
 * Always continue to next step
 */
export function createContinueEdge(): EdgeFunction {
  return () => 'continue';
}

/**
 * Loop Edge
 * Create a loop back to a previous step
 */
export function createLoopEdge(loopBackTo: string): EdgeFunction {
  return () => loopBackTo;
}

/**
 * Branch Edge
 * Create parallel branches
 */
export function createBranchEdge(branches: string[]): EdgeFunction {
  return () => branches.join('|');
}

// ============================================================================
// RESEARCH-SPECIFIC EDGES
// ============================================================================

/**
 * Research Search Results Edge
 * Route based on search results quality
 */
export function createSearchResultsEdge(
  minResults: number = 3,
  hasResultsPath: string = 'extract',
  noResultsPath: string = 'retry_search'
): EdgeFunction<ResearchState> {
  return (state: ResearchState) => {
    const hasEnoughResults = state.searchResults && state.searchResults.length >= minResults;
    return hasEnoughResults ? hasResultsPath : noResultsPath;
  };
}

/**
 * Research Analysis Edge
 * Route based on analysis completeness
 */
export function createAnalysisEdge(
  hasAnalysisPath: string = 'synthesize',
  needsMoreDataPath: string = 'gather_more'
): EdgeFunction<ResearchState> {
  return (state: ResearchState) => {
    const hasAnalysis = state.analysis !== null && state.analysis !== undefined;
    const hasEnoughData = state.extractedContent && state.extractedContent.length >= 3;
    
    if (hasAnalysis && hasEnoughData) {
      return hasAnalysisPath;
    }
    
    return needsMoreDataPath;
  };
}

/**
 * Research Synthesis Edge
 * Route based on synthesis quality
 */
export function createSynthesisEdge(
  goodSynthesisPath: string = 'verify',
  poorSynthesisPath: string = 'reanalyze'
): EdgeFunction<ResearchState> {
  return (state: ResearchState) => {
    const hasInsights = state.insights && state.insights.length >= 2;
    const hasRecommendations = state.recommendations && state.recommendations.length >= 1;
    
    if (hasInsights && hasRecommendations) {
      return goodSynthesisPath;
    }
    
    return poorSynthesisPath;
  };
}

// ============================================================================
// EDGE COMPOSERS
// ============================================================================

/**
 * Chain Multiple Edges
 * Create a chain of edge decisions
 */
export function chainEdges<T>(
  edges: Array<EdgeFunction<T>>
): EdgeFunction<T> {
  return (state: T) => {
    for (const edge of edges) {
      const result = edge(state);
      if (result !== 'continue') {
        return result;
      }
    }
    return END_EDGE;
  };
}

/**
 * Priority-based Edge
 * Try edges in priority order
 */
export function priorityEdges<T>(
  priorityEdges: Array<{ priority: number; edge: EdgeFunction<T> }>,
  defaultEdge?: EdgeFunction<T>
): EdgeFunction<T> {
  return (state: T) => {
    const sorted = priorityEdges.sort((a, b) => b.priority - a.priority);
    
    for (const { edge } of sorted) {
      const result = edge(state);
      if (result !== END_EDGE) {
        return result;
      }
    }
    
    return defaultEdge ? defaultEdge(state) : END_EDGE;
  };
}
