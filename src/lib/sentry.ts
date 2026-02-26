/**
 * AgentFlow Pro - Sentry Error Tracking Configuration
 * Production error monitoring and performance tracking
 */

import * as Sentry from '@sentry/nextjs';

// Sentry configuration for Next.js
export const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE_VERSION,
  dist: 'dist',
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  
  // Session tracking
  replaysSessionSampleRate: 0.1,
  
  // Error reporting
  maxBreadcrumbs: 50,
  debug: false,
  
  // Integrations
  integrations: [
    new Sentry.Integration({
      enabled: true,
      'sentry.react.react': {
        enabled: true,
        trackComponentUpdates: true,
        trackSuspiciousFrames: true,
        trackHookUpdates: true,
      },
      'sentry.logging.bunyan': {
        level: 'error',
      },
      'sentry.metrics.gauge': {
        enabled: true,
      },
      'sentry.metrics.node': {
        enabled: true,
      },
      'sentry.metrics.react': {
        enabled: true,
      },
    },
  ],
  
  // Before send error
  beforeSend: (event) => {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Add custom context
    event.context = {
      ...event.context,
      custom: {
        userId: event.user?.id,
        userAgent: event.request?.headers?.['user-agent'],
        url: event.request?.url,
      },
    };
    
    return event;
  },
  
  // Before send breadcrumb
  beforeSendBreadcrumb: (breadcrumb) => {
    // Add custom breadcrumb data
    breadcrumb.data = {
      ...breadcrumb.data,
      timestamp: new Date().toISOString(),
    };
    
    return breadcrumb;
  },
  
  // Custom tags
  tags: ['agentflow-pro', 'tourism', 'ai', 'automation'],
  
  // Custom context
  context: {
    tags: ['agentflow-pro', 'tourism', 'ai', 'automation'],
    user: {
      id: string,
      email: string,
      plan: string,
    },
    server: {
      name: string,
      version: string,
      environment: string,
    },
    runtime: {
      name: string,
      version: string,
    },
  },
};

// Custom Sentry client for additional functionality
export class SentryService {
  private static instance: SentryService;
  private isInitialized = false;

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.getInstance();
  }

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Initialize Sentry with configuration
    Sentry.init(sentryConfig);
    this.isInitialized = true;
    
    console.log('Sentry initialized successfully');
  }

  // Custom error reporting
  captureException(error: Error, context?: any): void {
    if (!this.isInitialized) {
      console.error('Sentry not initialized');
      return;
    }

    Sentry.captureException(error, {
      contexts: context ? [context] : undefined,
      tags: ['custom-error'],
      extra: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
    });
  }

  // Custom message reporting
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: any): void {
    if (!this.isInitialized) {
      console.log(`[${level.toUpperCase()}] ${message}`);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      scope.setMessage(message);
      scope.captureBreadcrumb({
        category: 'custom',
        message,
        level,
        timestamp: new Date().toISOString(),
      });
      Sentry.captureMessage(message);
    });
  }

  // Performance monitoring
  startTransaction(name: string): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.startTransaction({
      name,
      op: 'transaction',
    });
  }

  setTransactionName(name: string): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.getCurrentScope()?.setTransactionName(name);
  }

  setTag(key: string, value: string): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setTag(key, value);
  }

  setUser(user: {
    id: string;
    email: string;
    plan: string;
  }): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser({
      id: user.id,
      email: user.email,
      plan: user.plan,
    });
  }

  // Agent-specific error tracking
  captureAgentError(agentType: string, error: Error, context?: any): void {
    this.captureException(error, {
      contexts: [
        {
          type: 'agent',
          agentType,
          ...context,
        },
      ],
      tags: ['agent-error', agentType],
    });
  }

  // Workflow error tracking
  captureWorkflowError(workflowId: string, error: Error, context?: any): void {
    this.captureException(error, {
      contexts: [
        {
          type: 'workflow',
          workflowId,
          ...context,
        },
      ],
      tags: ['workflow-error'],
    });
  }

  // API error tracking
  captureApiError(endpoint: string, method: string, status: number, error: Error, context?: any): void {
    this.captureException(error, {
      contexts: [
        {
          type: 'api',
          endpoint,
          method,
          status,
          ...context,
        },
      ],
      tags: ['api-error'],
    });
  }

  // Tourism-specific error tracking
  captureTourismError(errorType: string, error: Error, context?: any): void {
    this.captureException(error, {
      contexts: [
        {
          type: 'tourism',
          errorType,
          ...context,
        },
      ],
      tags: ['tourism-error', errorType],
    });
  }

  // Performance tracking
  trackPerformanceMetric(name: string, value: number, unit: string, context?: any): void {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${value} ${unit}`,
      level: 'info',
      data: {
        metric: name,
        value,
        unit,
        ...context,
      },
    });

    Sentry.gauge(name, value, { unit, tags: ['performance'] });
  }

  // User action tracking
  trackUserAction(action: string, context?: any): void {
    Sentry.addBreadcrumb({
      category: 'user',
      message: action,
      level: 'info',
      data: context,
    });
  }

  // System health monitoring
  trackSystemHealth(component: string, status: 'healthy' | 'warning' | 'error', context?: any): void {
    Sentry.addBreadcrumb({
      category: 'system',
      message: `${component}: ${status}`,
      level: status === 'error' ? 'error' : status === 'warning' ? 'warning' : 'info',
      data: context,
    });

    Sentry.gauge(`system.${component}`, status === 'healthy' ? 1 : 0, {
      tags: ['system-health'],
      unit: 'status',
    });
  }

  // Database performance tracking
  trackDatabasePerformance(operation: string, duration: number, context?: any): void {
    this.trackPerformanceMetric(`database.${operation}`, duration, 'ms', context);
  }

  // Agent performance tracking
  trackAgentPerformance(agentType: string, operation: string, duration: number, context?: any): void {
    this.trackPerformanceMetric(`agent.${agentType}.${operation}`, duration, 'ms', context);
  }

  // Workflow performance tracking
  trackWorkflowPerformance(workflowId: string, operation: string, duration: number, context?: any): void {
    this.trackPerformanceMetric(`workflow.${workflowId}.${operation}`, duration, 'ms', context);
  }

  // Error recovery tracking
  trackErrorRecovery(error: Error, recoveryAction: string, success: boolean): void {
    this.captureMessage(
      `Error recovery: ${recoveryAction} - ${success ? 'Success' : 'Failed'}`,
      success ? 'info' : 'error',
      {
        error: error.message,
        recoveryAction,
        success,
      }
    );
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, context?: any): void {
    Sentry.addBreadcrumb({
      category: 'feature',
      message: `Feature used: ${feature}`,
      level: 'info',
      data: context,
    });
  }

  // Rate limiting tracking
  trackRateLimit(limitType: string, current: number, max: number, context?: any): void {
    const percentage = (current / max) * 100;
    const level = percentage > 80 ? 'warning' : percentage > 60 ? 'info' : 'info';
    
    Sentry.addBreadcrumb({
      category: 'rate-limit',
      message: `Rate limit: ${limitType} - ${current}/${max} (${percentage.toFixed(1)}%)`,
      level,
      data: context,
    });

    Sentry.gauge(`rate-limit.${limitType}`, current, {
      max,
      unit: 'requests',
      tags: ['rate-limit'],
    });
  }

  // Get Sentry instance for advanced usage
  getSentryInstance(): typeof Sentry {
    if (!this.isInitialized) {
      throw new Error('Sentry not initialized');
    }
    return Sentry;
  }

  // Check if Sentry is initialized
  isSentryInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const sentryService = SentryService.getInstance();

// Export configuration
export { sentryConfig };

// Error boundary component for React
export class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    sentryService.captureException(error, {
      contexts: [
        {
          type: 'react',
          componentStack: errorInfo.componentStack,
        },
      ],
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring hook
export function usePerformanceTracking(componentName: string) {
  React.useEffect(() => {
    sentryService.trackUserAction(`Component mounted: ${componentName}`);
    
    return () => {
      sentryService.trackUserAction(`Component unmounted: ${componentName}`);
    };
  }, [componentName]);
}

// Error tracking hook
export function useErrorTracking() {
  return React.useCallback((error: Error, context?: any) => {
    sentryService.captureException(error, context);
  }, []);
}

// Performance tracking hook
export function usePerformanceTracking() {
  return React.useCallback((operation: string, duration: number, context?: any) => {
    sentryService.trackPerformanceMetric(operation, duration, 'ms', context);
  }, []);
}

// Feature usage tracking hook
export function useFeatureTracking() {
  return React.useCallback((feature: string, context?: any) => {
    sentryService.trackFeatureUsage(feature, context);
  }, []);
}

// Health monitoring hook
export function useHealthMonitoring() {
  return React.useCallback((component: string, status: 'healthy' | 'warning' | 'error', context?: any) => {
    sentryService.trackSystemHealth(component, status, context);
  }, []);
}

// Database performance tracking hook
export function useDatabasePerformance() {
  return React.useCallback((operation: string, duration: number, context?: any) => {
    sentryService.trackDatabasePerformance(operation, duration, context);
  }, []);
}

// Agent performance tracking hook
export function useAgentPerformance(agentType: string) {
  return React.useCallback((operation: string, duration: number, context?: any) => {
    sentryService.trackAgentPerformance(agentType, operation, duration, context);
  }, []);
}

// Workflow performance tracking hook
export function useWorkflowPerformance() {
  return React.useCallback((workflowId: string, operation: string, duration: number, context?: any) => {
    sentryService.trackWorkflowPerformance(workflowId, operation, duration, context);
  }, []);
}

// Rate limiting tracking hook
export function useRateLimiting() {
  return React.useCallback((limitType: string, current: number, max: number, context?: any) => {
    sentryService.trackRateLimit(limitType, current, max, context);
  }, []);
}
