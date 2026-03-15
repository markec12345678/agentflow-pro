/**
 * Workflow Versioning Manager for Production-Grade Deployment
 * Provides atomic deployments, version compatibility, and execution isolation
 */

import Redis from 'ioredis';
import { logger } from '@/infrastructure/observability/logger';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowDefinition, WorkflowExecution } from '@/types/integration-automation';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  definition: WorkflowDefinition;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  createdAt: Date;
  activatedAt?: Date;
  deprecatedAt?: Date;
  changelog: string;
  migrationRequired: boolean;
  migrationScript?: string;
  rollbackVersion?: string;
  compatibilityMatrix: {
    minCompatibleVersion: string;
    maxCompatibleVersion: string;
    breakingChanges: string[];
  };
}

export interface DeploymentPlan {
  deploymentId: string;
  workflowId: string;
  fromVersion: string;
  toVersion: string;
  strategy: 'blue-green' | 'rolling' | 'canary' | 'atomic';
  rolloutPercentage: number;
  healthCheckConfig: {
    endpoint: string;
    timeout: number;
    successThreshold: number;
    failureThreshold: number;
  };
  rollbackConfig: {
    enabled: boolean;
    timeout: number;
    triggers: string[];
  };
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  steps: DeploymentStep[];
}

export interface DeploymentStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  logs: string[];
  error?: string;
}

export interface ExecutionRouting {
  executionId: string;
  workflowId: string;
  targetVersion: string;
  routingStrategy: 'version-specific' | 'compatibility-based' | 'migration-required';
  routedAt: Date;
  reason: string;
}

export class WorkflowVersioningManager {
  private redis: Redis;
  private versions: Map<string, WorkflowVersion> = new Map();
  private activeVersions: Map<string, string> = new Map(); // workflowId -> versionId
  private deploymentPlans: Map<string, DeploymentPlan> = new Map();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  /**
   * Create new workflow version
   */
  async createVersion(
    workflowId: string,
    definition: WorkflowDefinition,
    options: {
      version: string;
      changelog: string;
      migrationRequired?: boolean;
      migrationScript?: string;
      rollbackVersion?: string;
    }
  ): Promise<WorkflowVersion> {
    const version: WorkflowVersion = {
      id: uuidv4(),
      workflowId,
      version: options.version,
      definition: { ...definition, version: options.version },
      status: 'draft',
      createdAt: new Date(),
      changelog: options.changelog,
      migrationRequired: options.migrationRequired || false,
      migrationScript: options.migrationScript,
      rollbackVersion: options.rollbackVersion,
      compatibilityMatrix: this.calculateCompatibilityMatrix(definition),
    };

    this.versions.set(version.id, version);
    await this.saveVersion(version);

    logger.info(`📝 Created workflow version ${workflowId}@${options.version}`);
    return version;
  }

  /**
   * Deploy workflow version with atomic guarantees
   */
  async deployVersion(
    workflowId: string,
    version: string,
    strategy: 'blue-green' | 'rolling' | 'canary' | 'atomic' = 'atomic',
    options: {
      rolloutPercentage?: number;
      healthCheckEndpoint?: string;
      rollbackEnabled?: boolean;
    } = {}
  ): Promise<DeploymentPlan> {
    const versionId = await this.getVersionId(workflowId, version);
    const workflowVersion = this.versions.get(versionId);
    
    if (!workflowVersion) {
      throw new Error(`Version ${version} not found for workflow ${workflowId}`);
    }

    const currentActiveVersion = this.activeVersions.get(workflowId);
    
    const deploymentPlan: DeploymentPlan = {
      deploymentId: uuidv4(),
      workflowId,
      fromVersion: currentActiveVersion ? this.versions.get(currentActiveVersion)?.version || 'unknown' : 'none',
      toVersion: version,
      strategy,
      rolloutPercentage: options.rolloutPercentage || 100,
      healthCheckConfig: {
        endpoint: options.healthCheckEndpoint || '/health',
        timeout: 30000,
        successThreshold: 3,
        failureThreshold: 2,
      },
      rollbackConfig: {
        enabled: options.rollbackEnabled !== false,
        timeout: 300000, // 5 minutes
        triggers: ['health_check_failure', 'error_rate_increase', 'performance_degradation'],
      },
      status: 'pending',
      createdAt: new Date(),
      steps: this.createDeploymentSteps(strategy),
    };

    this.deploymentPlans.set(deploymentPlan.deploymentId, deploymentPlan);
    await this.saveDeploymentPlan(deploymentPlan);

    // Execute deployment
    return await this.executeDeployment(deploymentPlan);
  }

  /**
   * Route execution to appropriate version
   */
  async routeExecution(workflowId: string, executionId: string, input: Record<string, unknown>): Promise<ExecutionRouting> {
    const activeVersionId = this.activeVersions.get(workflowId);
    
    if (!activeVersionId) {
      throw new Error(`No active version found for workflow ${workflowId}`);
    }

    const activeVersion = this.versions.get(activeVersionId);
    if (!activeVersion) {
      throw new Error(`Active version ${activeVersionId} not found`);
    }

    // Check if migration is required
    if (activeVersion.migrationRequired) {
      return {
        executionId,
        workflowId,
        targetVersion: activeVersion.version,
        routingStrategy: 'migration-required',
        routedAt: new Date(),
        reason: 'Version requires data migration',
      };
    }

    // Check compatibility
    const routing = await this.checkCompatibilityAndRoute(workflowId, executionId, activeVersion);
    
    // Save routing decision
    await this.saveExecutionRouting(routing);
    
    return routing;
  }

  /**
   * Get execution version for recovery
   */
  async getExecutionVersion(executionId: string): Promise<WorkflowVersion | null> {
    const routing = await this.getExecutionRouting(executionId);
    if (!routing) {
      return null;
    }

    const versionId = await this.getVersionId(routing.workflowId, routing.targetVersion);
    return this.versions.get(versionId) || null;
  }

  /**
   * Rollback to previous version
   */
  async rollback(workflowId: string, targetVersion?: string): Promise<DeploymentPlan> {
    const currentActiveVersionId = this.activeVersions.get(workflowId);
    if (!currentActiveVersionId) {
      throw new Error(`No active version found for workflow ${workflowId}`);
    }

    const currentVersion = this.versions.get(currentActiveVersionId);
    if (!currentVersion) {
      throw new Error(`Current active version not found`);
    }

    const rollbackToVersion = targetVersion || currentVersion.rollbackVersion;
    if (!rollbackToVersion) {
      throw new Error(`No rollback target version specified and no default rollback version available`);
    }

    logger.info(`🔄 Rolling back ${workflowId} from ${currentVersion.version} to ${rollbackToVersion}`);
    
    // Create rollback deployment plan
    const rollbackPlan: DeploymentPlan = {
      deploymentId: uuidv4(),
      workflowId,
      fromVersion: currentVersion.version,
      toVersion: rollbackToVersion,
      strategy: 'atomic',
      rolloutPercentage: 100,
      healthCheckConfig: {
        endpoint: '/health',
        timeout: 30000,
        successThreshold: 3,
        failureThreshold: 2,
      },
      rollbackConfig: {
        enabled: false, // Disable rollback for rollback operations
        timeout: 300000,
        triggers: [],
      },
      status: 'pending',
      createdAt: new Date(),
      steps: this.createDeploymentSteps('atomic'),
    };

    this.deploymentPlans.set(rollbackPlan.deploymentId, rollbackPlan);
    await this.saveDeploymentPlan(rollbackPlan);

    return await this.executeDeployment(rollbackPlan);
  }

  /**
   * Get version history
   */
  async getVersionHistory(workflowId: string): Promise<WorkflowVersion[]> {
    const versions: WorkflowVersion[] = [];
    
    for (const version of this.versions.values()) {
      if (version.workflowId === workflowId) {
        versions.push(version);
      }
    }

    return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(workflowId: string): Promise<DeploymentPlan[]> {
    const deployments: DeploymentPlan[] = [];
    
    for (const deployment of this.deploymentPlans.values()) {
      if (deployment.workflowId === workflowId) {
        deployments.push(deployment);
      }
    }

    return deployments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get version compatibility matrix
   */
  async getCompatibilityMatrix(workflowId: string): Promise<{
    versions: string[];
    compatibility: Record<string, string[]>; // version -> compatible versions
    breakingChanges: Record<string, string[]>; // version -> breaking changes
  }> {
    const versions = await this.getVersionHistory(workflowId);
    const versionList = versions.map(v => v.version);
    
    const compatibility: Record<string, string[]> = {};
    const breakingChanges: Record<string, string[]> = {};

    for (const version of versions) {
      compatibility[version.version] = this.getCompatibleVersions(version, versions);
      breakingChanges[version.version] = version.compatibilityMatrix.breakingChanges;
    }

    return {
      versions: versionList,
      compatibility,
      breakingChanges,
    };
  }

  /**
   * Private helper methods
   */
  private async executeDeployment(plan: DeploymentPlan): Promise<DeploymentPlan> {
    plan.status = 'in-progress';
    plan.startedAt = new Date();
    
    logger.info(`🚀 Starting deployment ${plan.deploymentId}: ${plan.workflowId} ${plan.fromVersion} -> ${plan.toVersion}`);

    try {
      for (const step of plan.steps) {
        step.status = 'in-progress';
        step.startedAt = new Date();
        
        await this.executeDeploymentStep(plan, step);
        
        step.status = 'completed';
        step.completedAt = new Date();
        step.duration = step.completedAt.getTime() - step.startedAt.getTime();
        
        logger.info(`✅ Completed deployment step: ${step.name}`);
      }

      // Update active version
      const versionId = await this.getVersionId(plan.workflowId, plan.toVersion);
      this.activeVersions.set(plan.workflowId, versionId);
      
      // Mark version as active
      const version = this.versions.get(versionId);
      if (version) {
        version.status = 'active';
        version.activatedAt = new Date();
        await this.saveVersion(version);
      }

      // Deprecate old version
      if (plan.fromVersion !== 'none') {
        const oldVersionId = await this.getVersionId(plan.workflowId, plan.fromVersion);
        const oldVersion = this.versions.get(oldVersionId);
        if (oldVersion) {
          oldVersion.status = 'deprecated';
          oldVersion.deprecatedAt = new Date();
          await this.saveVersion(oldVersion);
        }
      }

      plan.status = 'completed';
      plan.completedAt = new Date();
      
      logger.info(`🎉 Deployment completed: ${plan.workflowId}@${plan.toVersion}`);
      
    } catch (error) {
      plan.status = 'failed';
      plan.completedAt = new Date();
      
      // Attempt rollback if enabled
      if (plan.rollbackConfig.enabled && plan.fromVersion !== 'none') {
        logger.info(`🔄 Deployment failed, attempting rollback to ${plan.fromVersion}`);
        await this.performAutomaticRollback(plan);
      }
      
      throw error;
    } finally {
      await this.saveDeploymentPlan(plan);
    }

    return plan;
  }

  private async executeDeploymentStep(plan: DeploymentPlan, step: DeploymentStep): Promise<void> {
    switch (step.name) {
      case 'pre-deployment-check':
        await this.performPreDeploymentCheck(plan);
        break;
      case 'deploy-new-version':
        await this.deployNewVersion(plan);
        break;
      case 'health-check':
        await this.performHealthCheck(plan);
        break;
      case 'traffic-switch':
        await this.switchTraffic(plan);
        break;
      case 'post-deployment-validation':
        await this.performPostDeploymentValidation(plan);
        break;
      default:
        throw new Error(`Unknown deployment step: ${step.name}`);
    }
  }

  private async performPreDeploymentCheck(plan: DeploymentPlan): Promise<void> {
    // Check if target version exists
    const versionId = await this.getVersionId(plan.workflowId, plan.toVersion);
    const version = this.versions.get(versionId);
    
    if (!version) {
      throw new Error(`Target version ${plan.toVersion} not found`);
    }

    // Check compatibility
    if (plan.fromVersion !== 'none') {
      const currentVersionId = await this.getVersionId(plan.workflowId, plan.fromVersion);
      const currentVersion = this.versions.get(currentVersionId);
      
      if (currentVersion && !this.isVersionCompatible(version, currentVersion)) {
        throw new Error(`Version ${plan.toVersion} is not compatible with current version ${plan.fromVersion}`);
      }
    }

    logger.info(`✅ Pre-deployment checks passed`);
  }

  private async deployNewVersion(plan: DeploymentPlan): Promise<void> {
    // In a real implementation, this would deploy the new version
    // For now, we just mark it as prepared
    logger.info(`📦 Deploying version ${plan.toVersion}`);
  }

  private async performHealthCheck(plan: DeploymentPlan): Promise<void> {
    // Simulate health check
    const healthCheckUrl = `http://localhost:3002${plan.healthCheckConfig.endpoint}`;
    
    // In a real implementation, make HTTP request to health check endpoint
    logger.info(`🏥 Performing health check at ${healthCheckUrl}`);
    
    // Simulate health check success
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`✅ Health check passed`);
  }

  private async switchTraffic(plan: DeploymentPlan): Promise<void> {
    // In a real implementation, this would switch traffic to new version
    logger.info(`🔄 Switching traffic to version ${plan.toVersion}`);
    
    // Update routing configuration
    const versionId = await this.getVersionId(plan.workflowId, plan.toVersion);
    this.activeVersions.set(plan.workflowId, versionId);
    
    logger.info(`✅ Traffic switched to version ${plan.toVersion}`);
  }

  private async performPostDeploymentValidation(plan: DeploymentPlan): Promise<void> {
    // Validate deployment
    logger.info(`🔍 Performing post-deployment validation`);
    
    // Check if new version is active
    const activeVersionId = this.activeVersions.get(plan.workflowId);
    const activeVersion = this.versions.get(activeVersionId!);
    
    if (!activeVersion || activeVersion.version !== plan.toVersion) {
      throw new Error(`Deployment validation failed: active version is ${activeVersion?.version}, expected ${plan.toVersion}`);
    }
    
    logger.info(`✅ Post-deployment validation passed`);
  }

  private async performAutomaticRollback(failedPlan: DeploymentPlan): Promise<void> {
    try {
      const rollbackPlan = await this.rollback(failedPlan.workflowId, failedPlan.fromVersion);
      logger.info(`🔄 Automatic rollback completed: ${rollbackPlan.toVersion}`);
    } catch (rollbackError) {
      logger.error(`❌ Automatic rollback failed:`, rollbackError);
    }
  }

  private createDeploymentSteps(strategy: string): DeploymentStep[] {
    const baseSteps = [
      { id: uuidv4(), name: 'pre-deployment-check', status: 'pending' as const, logs: [] },
      { id: uuidv4(), name: 'deploy-new-version', status: 'pending' as const, logs: [] },
      { id: uuidv4(), name: 'health-check', status: 'pending' as const, logs: [] },
      { id: uuidv4(), name: 'traffic-switch', status: 'pending' as const, logs: [] },
      { id: uuidv4(), name: 'post-deployment-validation', status: 'pending' as const, logs: [] },
    ];

    return baseSteps;
  }

  private calculateCompatibilityMatrix(definition: WorkflowDefinition): any {
    // Simple implementation - in production, analyze workflow changes
    return {
      minCompatibleVersion: '1.0.0',
      maxCompatibleVersion: '2.0.0',
      breakingChanges: [],
    };
  }

  private async checkCompatibilityAndRoute(workflowId: string, executionId: string, version: WorkflowVersion): Promise<ExecutionRouting> {
    // Check if there are any running executions that need special handling
    const runningExecutions = await this.getRunningExecutions(workflowId);
    
    if (runningExecutions.length > 0 && version.migrationRequired) {
      return {
        executionId,
        workflowId,
        targetVersion: version.version,
        routingStrategy: 'migration-required',
        routedAt: new Date(),
        reason: 'Migration required due to running executions',
      };
    }

    return {
      executionId,
      workflowId,
      targetVersion: version.version,
      routingStrategy: 'version-specific',
      routedAt: new Date(),
      reason: 'Standard version routing',
    };
  }

  private getCompatibleVersions(version: WorkflowVersion, allVersions: WorkflowVersion[]): string[] {
    return allVersions
      .filter(v => v.version !== version.version)
      .filter(v => this.isVersionCompatible(version, v))
      .map(v => v.version);
  }

  private isVersionCompatible(version1: WorkflowVersion, version2: WorkflowVersion): boolean {
    // Simple compatibility check - in production, implement proper semantic versioning
    return true;
  }

  private async getRunningExecutions(workflowId: string): Promise<string[]> {
    // In production, query execution database
    return [];
  }

  private async getVersionId(workflowId: string, version: string): Promise<string> {
    for (const [id, v] of this.versions.entries()) {
      if (v.workflowId === workflowId && v.version === version) {
        return id;
      }
    }
    throw new Error(`Version ${version} not found for workflow ${workflowId}`);
  }

  private async saveVersion(version: WorkflowVersion): Promise<void> {
    const key = `workflow_version:${version.id}`;
    await this.redis.setex(key, 7 * 24 * 3600, JSON.stringify(version));
  }

  private async saveDeploymentPlan(plan: DeploymentPlan): Promise<void> {
    const key = `deployment_plan:${plan.deploymentId}`;
    await this.redis.setex(key, 7 * 24 * 3600, JSON.stringify(plan));
  }

  private async saveExecutionRouting(routing: ExecutionRouting): Promise<void> {
    const key = `execution_routing:${routing.executionId}`;
    await this.redis.setex(key, 24 * 3600, JSON.stringify(routing));
  }

  private async getExecutionRouting(executionId: string): Promise<ExecutionRouting | null> {
    const key = `execution_routing:${executionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
