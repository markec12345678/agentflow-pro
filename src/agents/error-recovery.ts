import { AgentError } from './orchestrator';
import { Agent } from '../orchestrator/Orchestrator';

export interface RecoveryAction {
  type: 'retry' | 'skip' | 'fallback' | 'notify';
  agentId: string;
  message: string;
  suggestedFix?: string;
  fallbackData?: any;
}

export class ErrorRecoverySystem {
  private errorPatterns: Map<string, RecoveryStrategy>;

  constructor() {
    this.errorPatterns = new Map();
    this.initializeErrorPatterns();
  }

  private initializeErrorPatterns(): void {
    // Common error patterns and their recovery strategies
    this.errorPatterns.set('rate_limit', {
      type: 'retry',
      delay: 5000,
      maxRetries: 3,
      message: 'Rate limit exceeded, retrying with delay',
      suggestedFix: 'Increase rate limit or implement exponential backoff'
    });

    this.errorPatterns.set('authentication', {
      type: 'notify',
      message: 'Authentication failed',
      suggestedFix: 'Check API keys and permissions'
    });

    this.errorPatterns.set('invalid_input', {
      type: 'fallback',
      message: 'Invalid input format',
      suggestedFix: 'Validate input before execution',
      fallbackData: { error: 'invalid_input', recovered: false }
    });

    this.errorPatterns.set('network', {
      type: 'retry',
      delay: 2000,
      maxRetries: 2,
      message: 'Network error detected',
      suggestedFix: 'Check network connection'
    });

    this.errorPatterns.set('timeout', {
      type: 'retry',
      delay: 3000,
      maxRetries: 1,
      message: 'Operation timed out',
      suggestedFix: 'Increase timeout or optimize operation'
    });
  }

  async handleAgentError(
    error: AgentError,
    agent: Agent,
    context: any
  ): Promise<RecoveryAction> {
    // Analyze error pattern
    const pattern = this.detectErrorPattern(error);
    const strategy = this.errorPatterns.get(pattern) || this.getDefaultStrategy();

    // Apply recovery strategy
    switch (strategy.type) {
      case 'retry':
        return this.handleRetryStrategy(strategy, error, context);

      case 'fallback':
        return this.handleFallbackStrategy(strategy, error, context);

      case 'skip':
        return this.handleSkipStrategy(strategy, error);

      case 'notify':
        return this.handleNotifyStrategy(strategy, error);

      default:
        return this.handleUnknownError(error);
    }
  }

  private detectErrorPattern(error: AgentError): string {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit';
    }

    if (message.includes('auth') || message.includes('token') || message.includes('permission')) {
      return 'authentication';
    }

    if (message.includes('invalid') || message.includes('format') || message.includes('schema')) {
      return 'invalid_input';
    }

    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return 'network';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }

    return 'unknown';
  }

  private async handleRetryStrategy(
    strategy: RecoveryStrategy,
    error: AgentError,
    context: any
  ): Promise<RecoveryAction> {
    // Check if we should retry
    const retryCount = context.retryCount || 0;

    if (retryCount >= (strategy.maxRetries || 3)) {
      return {
        type: 'notify',
        agentId: error.agentId,
        message: `Max retries (${strategy.maxRetries}) exceeded for ${error.agentId}`,
        suggestedFix: strategy.suggestedFix
      };
    }

    // Apply delay if specified
    if (strategy.delay) {
      await new Promise(resolve => setTimeout(resolve, strategy.delay));
    }

    return {
      type: 'retry',
      agentId: error.agentId,
      message: strategy.message,
      suggestedFix: strategy.suggestedFix
    };
  }

  private handleFallbackStrategy(
    strategy: RecoveryStrategy,
    error: AgentError,
    context: any
  ): Promise<RecoveryAction> {
    return Promise.resolve({
      type: 'fallback',
      agentId: error.agentId,
      message: strategy.message,
      suggestedFix: strategy.suggestedFix,
      fallbackData: strategy.fallbackData || { error: error.message, recovered: true }
    });
  }

  private handleSkipStrategy(
    strategy: RecoveryStrategy,
    error: AgentError
  ): Promise<RecoveryAction> {
    return Promise.resolve({
      type: 'skip',
      agentId: error.agentId,
      message: strategy.message,
      suggestedFix: strategy.suggestedFix
    });
  }

  private handleNotifyStrategy(
    strategy: RecoveryStrategy,
    error: AgentError
  ): Promise<RecoveryAction> {
    return Promise.resolve({
      type: 'notify',
      agentId: error.agentId,
      message: strategy.message,
      suggestedFix: strategy.suggestedFix
    });
  }

  private handleUnknownError(error: AgentError): RecoveryAction {
    return {
      type: 'notify',
      agentId: error.agentId,
      message: `Unknown error in ${error.agentId}: ${error.message}`,
      suggestedFix: 'Check logs and agent configuration'
    };
  }

  private getDefaultStrategy(): RecoveryStrategy {
    return {
      type: 'notify',
      message: 'Unexpected error occurred',
      suggestedFix: 'Review error details and system logs'
    };
  }

  // Advanced error analysis
  async analyzeErrorTrends(errors: AgentError[]): Promise<ErrorAnalysisReport> {
    const errorCounts: Record<string, number> = {};
    const agentErrors: Record<string, number> = {};
    const patterns: Record<string, number> = {};

    errors.forEach(error => {
      // Count by agent
      agentErrors[error.agentId] = (agentErrors[error.agentId] || 0) + 1;

      // Detect pattern
      const pattern = this.detectErrorPattern(error);
      patterns[pattern] = (patterns[pattern] || 0) + 1;

      // Count total
      errorCounts[error.agentId] = (errorCounts[error.agentId] || 0) + 1;
    });

    // Identify most common issues
    const topAgents = Object.entries(agentErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topPatterns = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalErrors: errors.length,
      errorRate: errors.length / (errors.length + 1), // Mock calculation
      topFailingAgents: topAgents.map(([agentId, count]) => ({ agentId, count })),
      topErrorPatterns: topPatterns.map(([pattern, count]) => ({ pattern, count })),
      suggestions: this.generateSuggestions(topPatterns)
    };
  }

  private generateSuggestions(patterns: [string, number][]): string[] {
    const suggestions: string[] = [];

    patterns.forEach(([pattern]) => {
      switch (pattern) {
        case 'rate_limit':
          suggestions.push('Consider implementing rate limiting or increasing API quotas');
          break;
        case 'authentication':
          suggestions.push('Review API keys and authentication tokens');
          break;
        case 'network':
          suggestions.push('Check network connectivity and implement retries');
          break;
        case 'timeout':
          suggestions.push('Increase timeout values or optimize slow operations');
          break;
        default:
          suggestions.push(`Investigate ${pattern} errors specifically`);
      }
    });

    return suggestions;
  }
}

interface RecoveryStrategy {
  type: 'retry' | 'skip' | 'fallback' | 'notify';
  message: string;
  suggestedFix: string;
  delay?: number;
  maxRetries?: number;
  fallbackData?: any;
}

interface ErrorAnalysisReport {
  totalErrors: number;
  errorRate: number;
  topFailingAgents: { agentId: string; count: number }[];
  topErrorPatterns: { pattern: string; count: number }[];
  suggestions: string[];
}

// Singleton instance
let recoveryInstance: ErrorRecoverySystem | null = null;

export function getErrorRecoverySystem(): ErrorRecoverySystem {
  if (!recoveryInstance) {
    recoveryInstance = new ErrorRecoverySystem();
  }
  return recoveryInstance;
}
