/**
 * Use Case: Run Test Pipeline
 * 
 * Get CI/CD pipeline status and trigger pipeline runs.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/infrastructure/observability/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RunTestPipelineInput {
  userId: string;
  branch?: string;
  commit?: string;
  environment?: string;
  pipelineConfig?: any;
  status?: string;
  includeConfig?: boolean;
  limit?: number;
  offset?: number;
}

export interface RunTestPipelineOutput {
  success: boolean;
  data?: {
    pipelines: PipelineStatus[];
    pipelineConfigs?: PipelineConfig[];
    total: number;
    limit: number;
    offset: number;
    summary: PipelineSummary;
    triggeredPipeline?: PipelineStatus;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PipelineStatus {
  id: string;
  name: string;
  status: "success" | "failed" | "running" | "pending" | "cancelled";
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  timestamp: string;
  duration?: number;
  stages: Array<{
    name: string;
    status: "success" | "failed" | "running" | "pending" | "skipped";
    duration?: number;
    logs?: string[];
    artifacts?: string[];
  }>;
  environment: string;
  triggeredBy: string;
  repository: string;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: {
    onPush: boolean;
    onPullRequest: boolean;
    onSchedule: boolean;
    branches: string[];
    cronExpression?: string;
  };
  stages: Array<{
    name: string;
    enabled: boolean;
    commands: string[];
    timeout: number;
    retries: number;
    condition?: string;
  }>;
  environment: string;
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    onCancel: boolean;
    emails: string[];
    slack?: {
      webhook: string;
      channel: string;
    };
  };
}

export interface PipelineSummary {
  totalPipelines: number;
  successPipelines: number;
  failedPipelines: number;
  runningPipelines: number;
  pendingPipelines: number;
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class RunTestPipelineUseCase {
  async execute(input: RunTestPipelineInput): Promise<RunTestPipelineOutput> {
    try {
      const {
        userId,
        branch,
        commit,
        environment = "staging",
        pipelineConfig,
        status,
        includeConfig = false,
        limit = 20,
        offset = 0,
      } = input;

      // 1. Verify user is admin
      const adminUser = await this.verifyAdminAccess(userId);
      if (!adminUser) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        };
      }

      // 2. Handle pipeline trigger (POST mode)
      if (branch) {
        const triggeredPipeline = await this.triggerPipeline(
          branch,
          commit,
          environment,
          pipelineConfig,
          adminUser.name || 'Unknown',
        );

        // Log activity
        await this.logActivity(
          userId,
          'Pipeline Triggered',
          `Triggered pipeline for branch: ${branch}`,
        );

        return {
          success: true,
          data: {
            pipelines: [],
            total: 0,
            limit,
            offset,
            summary: {
              totalPipelines: 0,
              successPipelines: 0,
              failedPipelines: 0,
              runningPipelines: 0,
              pendingPipelines: 0,
            },
            triggeredPipeline,
          },
        };
      }

      // 3. Get pipeline status (GET mode)
      const pipelines = await this.getPipelineStatus(status, branch, environment);

      // 4. Apply filters
      let filteredPipelines = pipelines;

      if (status) {
        filteredPipelines = filteredPipelines.filter(p => p.status === status);
      }

      if (branch) {
        filteredPipelines = filteredPipelines.filter(p => p.branch === branch);
      }

      if (environment) {
        filteredPipelines = filteredPipelines.filter(p => p.environment === environment);
      }

      // 5. Sort by timestamp (newest first)
      filteredPipelines.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // 6. Apply pagination
      const paginatedPipelines = filteredPipelines.slice(offset, offset + limit);

      // 7. Get pipeline configs if requested
      let pipelineConfigs: PipelineConfig[] | undefined;
      if (includeConfig) {
        pipelineConfigs = await this.getPipelineConfigs();
      }

      // 8. Calculate summary
      const summary = this.calculateSummary(filteredPipelines);

      return {
        success: true,
        data: {
          pipelines: paginatedPipelines,
          pipelineConfigs,
          total: filteredPipelines.length,
          limit,
          offset,
          summary,
        },
      };
    } catch (error) {
      logger.error('RunTestPipeline error:', error);
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

  private async verifyAdminAccess(userId: string): Promise<{ name: string | null } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return null;
    }

    return user;
  }

  private async getPipelineStatus(
    status?: string | null,
    branch?: string | null,
    environment?: string | null,
  ): Promise<PipelineStatus[]> {
    // Mock pipeline status (in production, fetch from CI/CD system)
    const mockPipelines: PipelineStatus[] = [
      {
        id: "pipeline_1",
        name: "CI Pipeline",
        status: "success",
        branch: "main",
        commit: "abc123def",
        commitMessage: "Fix authentication bug",
        author: "John Doe",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        duration: 125000,
        stages: [
          {
            name: "Build",
            status: "success",
            duration: 45000,
            logs: ["Building application...", "Build completed successfully"],
            artifacts: ["build-output.tar.gz"]
          },
          {
            name: "Test",
            status: "success",
            duration: 60000,
            logs: ["Running tests...", "All tests passed"],
            artifacts: ["test-results.xml"]
          },
          {
            name: "Deploy",
            status: "success",
            duration: 20000,
            logs: ["Deploying to staging...", "Deployment completed"],
            artifacts: ["deployment-log.txt"]
          }
        ],
        environment: "staging",
        triggeredBy: "GitHub Actions",
        repository: "agentflow-pro"
      },
      {
        id: "pipeline_2",
        name: "CI Pipeline",
        status: "failed",
        branch: "feature/payment",
        commit: "def456ghi",
        commitMessage: "Add payment integration",
        author: "Jane Smith",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 89000,
        stages: [
          {
            name: "Build",
            status: "success",
            duration: 42000,
            logs: ["Building application...", "Build completed"],
            artifacts: ["build-output.tar.gz"]
          },
          {
            name: "Test",
            status: "failed",
            duration: 47000,
            logs: ["Running tests...", "Test failed: Payment integration"],
            artifacts: ["test-results.xml", "error-logs.txt"]
          },
          {
            name: "Deploy",
            status: "skipped",
            duration: 0,
            logs: ["Skipped due to test failure"]
          }
        ],
        environment: "staging",
        triggeredBy: "GitHub Actions",
        repository: "agentflow-pro"
      },
      {
        id: "pipeline_3",
        name: "CI Pipeline",
        status: "running",
        branch: "develop",
        commit: "ghi789jkl",
        commitMessage: "Update dependencies",
        author: "Bob Johnson",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        stages: [
          {
            name: "Build",
            status: "success",
            duration: 38000,
            logs: ["Building application...", "Build completed"],
            artifacts: ["build-output.tar.gz"]
          },
          {
            name: "Test",
            status: "running",
            logs: ["Running unit tests...", "45/156 tests completed"]
          },
          {
            name: "Deploy",
            status: "pending",
            logs: ["Waiting for tests to complete"]
          }
        ],
        environment: "development",
        triggeredBy: "Manual",
        repository: "agentflow-pro"
      },
      {
        id: "pipeline_4",
        name: "Production Deploy",
        status: "success",
        branch: "main",
        commit: "mno345pqr",
        commitMessage: "Release v2.1.0",
        author: "Alice Brown",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        duration: 180000,
        stages: [
          {
            name: "Build",
            status: "success",
            duration: 50000,
            logs: ["Building production image...", "Build completed"],
            artifacts: ["production-image.tar.gz"]
          },
          {
            name: "Security Scan",
            status: "success",
            duration: 30000,
            logs: ["Running security scan...", "No vulnerabilities found"],
            artifacts: ["security-report.json"]
          },
          {
            name: "Test",
            status: "success",
            duration: 70000,
            logs: ["Running production tests...", "All tests passed"],
            artifacts: ["test-results.xml"]
          },
          {
            name: "Deploy",
            status: "success",
            duration: 30000,
            logs: ["Deploying to production...", "Deployment completed"],
            artifacts: ["deployment-log.txt", "release-notes.md"]
          }
        ],
        environment: "production",
        triggeredBy: "Manual",
        repository: "agentflow-pro"
      }
    ];

    return mockPipelines;
  }

  private async getPipelineConfigs(): Promise<PipelineConfig[]> {
    // Mock pipeline configs (in production, fetch from CI/CD system)
    const mockConfigs: PipelineConfig[] = [
      {
        id: "config_1",
        name: "CI Pipeline",
        description: "Main CI/CD pipeline for testing and deployment",
        enabled: true,
        triggers: {
          onPush: true,
          onPullRequest: true,
          onSchedule: false,
          branches: ["main", "develop"],
          cronExpression: "0 2 * * *"
        },
        stages: [
          {
            name: "Build",
            enabled: true,
            commands: ["npm install", "npm run build"],
            timeout: 300000,
            retries: 2
          },
          {
            name: "Test",
            enabled: true,
            commands: ["npm run test:unit", "npm run test:integration", "npm run test:e2e"],
            timeout: 600000,
            retries: 1
          },
          {
            name: "Deploy",
            enabled: true,
            commands: ["npm run deploy"],
            timeout: 300000,
            retries: 1,
            condition: "branch == 'main'"
          }
        ],
        environment: "staging",
        notifications: {
          onSuccess: false,
          onFailure: true,
          onCancel: true,
          emails: ["dev-team@example.com"],
          slack: {
            webhook: "https://hooks.slack.com/services/...",
            channel: "#ci-cd"
          }
        }
      }
    ];

    return mockConfigs;
  }

  private async triggerPipeline(
    branch: string,
    commit: string | undefined,
    environment: string,
    pipelineConfig: any,
    triggeredBy: string,
  ): Promise<PipelineStatus> {
    logger.info('Triggering pipeline:', { branch, commit, environment, triggeredBy });

    // Simulate pipeline trigger
    const pipelineRun: PipelineStatus = {
      id: `pipeline_${Date.now()}`,
      name: pipelineConfig?.name || "CI Pipeline",
      status: "running",
      branch,
      commit: commit || "latest",
      commitMessage: "Manual trigger",
      author: triggeredBy,
      timestamp: new Date().toISOString(),
      stages: [
        {
          name: "Build",
          status: "pending",
          logs: ["Pipeline triggered", "Waiting to start build stage"]
        },
        {
          name: "Test",
          status: "pending",
          logs: ["Waiting for build to complete"]
        },
        {
          name: "Deploy",
          status: "pending",
          logs: ["Waiting for tests to complete"]
        }
      ],
      environment,
      triggeredBy: triggeredBy || "Manual",
      repository: "agentflow-pro"
    };

    logger.info('Pipeline triggered successfully:', pipelineRun);
    return pipelineRun;
  }

  private calculateSummary(pipelines: PipelineStatus[]): PipelineSummary {
    return {
      totalPipelines: pipelines.length,
      successPipelines: pipelines.filter(p => p.status === "success").length,
      failedPipelines: pipelines.filter(p => p.status === "failed").length,
      runningPipelines: pipelines.filter(p => p.status === "running").length,
      pendingPipelines: pipelines.filter(p => p.status === "pending").length,
    };
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

export const runTestPipelineUseCase = new RunTestPipelineUseCase();
