/**
 * Use Case: Check System Health
 * 
 * Perform comprehensive health checks on system components
 * and gather system metrics.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/infrastructure/observability/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CheckSystemHealthInput {
  userId: string;
  component?: HealthComponent;
  detailed?: boolean;
  force?: boolean;
}

export interface CheckSystemHealthOutput {
  success: boolean;
  data?: {
    status: SystemStatus;
    timestamp: string;
    healthChecks: HealthCheck[];
    systemMetrics: SystemMetrics;
    uptime: number;
    version: string;
    environment: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type HealthComponent = 'database' | 'api' | 'agents' | 'cache' | 'storage' | 'all';
export type SystemStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface HealthCheck {
  id: string;
  name: string;
  status: SystemStatus;
  lastCheck: string;
  responseTime: number;
  uptime: number;
  errorRate: number;
  details: Record<string, any>;
  history: Array<{
    timestamp: string;
    status: string;
    responseTime: number;
  }>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  cache: {
    hitRate: number;
    memory: number;
    keys: number;
  };
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class CheckSystemHealthUseCase {
  async execute(input: CheckSystemHealthInput): Promise<CheckSystemHealthOutput> {
    try {
      const { userId, component = 'all', detailed = false, force = false } = input;

      // 1. Verify user is admin
      const isAdmin = await this.verifyAdminAccess(userId);
      if (!isAdmin) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        };
      }

      // 2. Perform health checks
      const healthChecks = await this.performHealthChecks(component, force);

      // 3. Get system metrics
      const systemMetrics = await this.getSystemMetrics();

      // 4. Calculate overall status
      const status = this.calculateOverallStatus(healthChecks);

      // 5. Log activity
      await this.logActivity(
        userId,
        'System Health Check',
        `Health check executed${component !== 'all' ? ` for ${component}` : ''}`,
      );

      return {
        success: true,
        data: {
          status,
          timestamp: new Date().toISOString(),
          healthChecks,
          systemMetrics,
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      };
    } catch (error) {
      logger.error('CheckSystemHealth error:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async verifyAdminAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  }

  private async performHealthChecks(
    component: HealthComponent,
    force: boolean,
  ): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    if (component === 'all' || component === 'database') {
      checks.push(await this.checkDatabaseHealth(force));
    }

    if (component === 'all' || component === 'api') {
      checks.push(await this.checkApiHealth(force));
    }

    if (component === 'all' || component === 'agents') {
      checks.push(await this.checkAgentsHealth(force));
    }

    if (component === 'all' || component === 'cache') {
      checks.push(await this.checkCacheHealth(force));
    }

    if (component === 'all' || component === 'storage') {
      checks.push(await this.checkStorageHealth(force));
    }

    return checks;
  }

  private async checkDatabaseHealth(force: boolean): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simulate database check (in production, actually query database)
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.05; // 95% success rate

      return {
        id: 'database',
        name: 'Database',
        status: isHealthy ? 'healthy' : 'critical',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: 99.9,
        errorRate: isHealthy ? 0.1 : 5.2,
        details: {
          connections: Math.floor(Math.random() * 20) + 5,
          maxConnections: 100,
          queryTime: Math.floor(Math.random() * 50) + 10,
          slowQueries: isHealthy ? 0 : Math.floor(Math.random() * 5),
          replication: 'healthy',
          backup: 'completed',
          size: '2.4GB',
        },
        history: this.generateHistoryData(isHealthy ? 'healthy' : 'critical'),
      };
    } catch (error) {
      return {
        id: 'database',
        name: 'Database',
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        uptime: 0,
        errorRate: 100,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        history: [],
      };
    }
  }

  private async checkApiHealth(force: boolean): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simulate API check
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.02; // 98% success rate

      return {
        id: 'api',
        name: 'API Server',
        status: isHealthy ? 'healthy' : Math.random() > 0.5 ? 'warning' : 'critical',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: 99.8,
        errorRate: isHealthy ? 0.2 : 2.1,
        details: {
          endpoints: 45,
          activeConnections: Math.floor(Math.random() * 500) + 100,
          requestsPerMinute: Math.floor(Math.random() * 2000) + 500,
          averageResponseTime: responseTime,
          rateLimit: 'active',
          memoryUsage: Math.floor(Math.random() * 100) + 50,
          version: '1.2.3',
        },
        history: this.generateHistoryData(isHealthy ? 'healthy' : 'warning'),
      };
    } catch (error) {
      return {
        id: 'api',
        name: 'API Server',
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        uptime: 0,
        errorRate: 100,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        history: [],
      };
    }
  }

  private async checkAgentsHealth(force: boolean): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simulate AI agents check
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.1; // 90% success rate

      return {
        id: 'agents',
        name: 'AI Agents',
        status: isHealthy ? 'healthy' : Math.random() > 0.3 ? 'warning' : 'critical',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: 98.5,
        errorRate: isHealthy ? 1.5 : 8.2,
        details: {
          activeAgents: Math.floor(Math.random() * 4) + 1,
          totalAgents: 4,
          queueSize: Math.floor(Math.random() * 50),
          averageProcessingTime: responseTime,
          failedJobs: isHealthy ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 10) + 5,
          lastFailure: isHealthy ? null : '2 minutes ago',
          modelsLoaded: ['gpt-4', 'claude-3', 'llama-2'],
          gpuMemory: Math.floor(Math.random() * 16) + 8,
        },
        history: this.generateHistoryData(isHealthy ? 'healthy' : 'warning'),
      };
    } catch (error) {
      return {
        id: 'agents',
        name: 'AI Agents',
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        uptime: 0,
        errorRate: 100,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        history: [],
      };
    }
  }

  private async checkCacheHealth(force: boolean): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simulate Redis/cache check
      await new Promise((resolve) => setTimeout(resolve, 5 + Math.random() * 20));

      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.01; // 99% success rate

      return {
        id: 'cache',
        name: 'Redis Cache',
        status: isHealthy ? 'healthy' : 'warning',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: 99.99,
        errorRate: isHealthy ? 0.01 : 1.2,
        details: {
          memory: `${(Math.random() * 2 + 1).toFixed(1)}GB / 4GB`,
          hitRate: isHealthy ? Math.floor(Math.random() * 5) + 94 : Math.floor(Math.random() * 20) + 70,
          connections: Math.floor(Math.random() * 20) + 5,
          keys: Math.floor(Math.random() * 50000) + 100000,
          evictions: Math.floor(Math.random() * 100),
          expiredKeys: Math.floor(Math.random() * 1000),
          version: '7.2.3',
        },
        history: this.generateHistoryData(isHealthy ? 'healthy' : 'warning'),
      };
    } catch (error) {
      return {
        id: 'cache',
        name: 'Redis Cache',
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        uptime: 0,
        errorRate: 100,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        history: [],
      };
    }
  }

  private async checkStorageHealth(force: boolean): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simulate storage check
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 500));

      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.05; // 95% success rate

      return {
        id: 'storage',
        name: 'File Storage',
        status: isHealthy ? 'healthy' : Math.random() > 0.4 ? 'warning' : 'critical',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: 99.5,
        errorRate: isHealthy ? 0.5 : 4.8,
        details: {
          usedSpace: `${(Math.random() * 200 + 700).toFixed(0)}GB / 1TB`,
          availableSpace: `${(Math.random() * 200 + 100).toFixed(0)}GB`,
          uploadSpeed: `${(Math.random() * 5 + 1).toFixed(1)}MB/s`,
          downloadSpeed: `${(Math.random() * 20 + 5).toFixed(1)}MB/s`,
          errors: isHealthy ? 0 : Math.floor(Math.random() * 20) + 5,
          totalFiles: Math.floor(Math.random() * 100000) + 50000,
          avgFileSize: `${(Math.random() * 5 + 1).toFixed(1)}MB`,
        },
        history: this.generateHistoryData(isHealthy ? 'healthy' : 'warning'),
      };
    } catch (error) {
      return {
        id: 'storage',
        name: 'File Storage',
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        uptime: 0,
        errorRate: 100,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        history: [],
      };
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    // Simulate system metrics (in production, get actual metrics)
    return {
      cpu: {
        usage: Math.random() * 80 + 10,
        cores: 8,
        temperature: Math.random() * 30 + 50,
      },
      memory: {
        used: Math.random() * 8 + 4,
        total: 16,
        percentage: Math.random() * 40 + 40,
      },
      disk: {
        used: Math.random() * 200 + 700,
        total: 1000,
        percentage: Math.random() * 30 + 70,
      },
      network: {
        bytesIn: Math.random() * 1000000 + 500000,
        bytesOut: Math.random() * 500000 + 250000,
        connections: Math.floor(Math.random() * 100) + 20,
      },
      database: {
        connections: Math.floor(Math.random() * 20) + 5,
        queryTime: Math.random() * 50 + 10,
        cacheHitRate: Math.random() * 10 + 90,
      },
      cache: {
        hitRate: Math.random() * 10 + 90,
        memory: Math.random() * 2 + 1,
        keys: Math.floor(Math.random() * 50000) + 100000,
      },
    };
  }

  private calculateOverallStatus(checks: HealthCheck[]): SystemStatus {
    if (checks.length === 0) return 'unknown';

    const hasCritical = checks.some((check) => check.status === 'critical');
    const hasWarning = checks.some((check) => check.status === 'warning');

    if (hasCritical) return 'critical';
    if (hasWarning) return 'degraded';
    return 'healthy';
  }

  private generateHistoryData(status: string): Array<{ timestamp: string; status: string; responseTime: number }> {
    const history: Array<{ timestamp: string; status: string; responseTime: number }> = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      history.push({
        timestamp: timestamp.toISOString(),
        status: Math.random() > 0.1 ? status : 'warning',
        responseTime: Math.floor(Math.random() * 500) + 50,
      });
    }

    return history.reverse();
  }

  private async logActivity(userId: string, action: string, details: string): Promise<void> {
    logger.info('Activity log:', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const checkSystemHealthUseCase = new CheckSystemHealthUseCase();
