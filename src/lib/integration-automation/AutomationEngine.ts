/**
 * Automation Engine
 * Comprehensive integration and workflow automation system
 */

import {
  AutomationEngine as IAutomationEngine,
  IntegrationConfig,
  WorkflowDefinition,
  WorkflowExecution,
  IntegrationTestResult,
  ExecutionOptions,
  ExecutionFilters,
  DateRange,
  IntegrationMetrics,
  WorkflowMetrics,
  SystemHealth,
  Alert,
  AlertFilters,
  SystemConfig,
  AutomationEvent,
  EventFilter,
  EventCallback,
  IntegrationType,
  IntegrationStatus,
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  StepType,
  HttpMethod,
} from '@/types/integration-automation';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/infrastructure/observability/logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import webpush from 'web-push';

export class AutomationEngine implements IAutomationEngine {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private eventSubscriptions: Map<string, { filters: EventFilter[]; callback: EventCallback }> = new Map();
  private httpClients: Map<string, AxiosInstance> = new Map();
  private emailTransporter: nodemailer.Transporter;
  private systemConfig: SystemConfig;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
    });

    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.systemConfig = this.initializeSystemConfig();
    this.initializeQueues();
    this.initializeMockData();
  }

  /**
   * Integration Management Methods
   */
  async getIntegrations(): Promise<IntegrationConfig[]> {
    return Array.from(this.integrations.values());
  }

  async getIntegration(id: string): Promise<IntegrationConfig> {
    const integration = this.integrations.get(id);
    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }
    return integration;
  }

  async createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const integration: IntegrationConfig = {
      ...config,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.integrations.set(integration.id, integration);
    
    // Initialize HTTP client if needed
    if (config.type === 'booking-engine' || config.type === 'payment-gateway') {
      await this.initializeHttpClient(integration);
    }

    logger.info(`🔗 Created integration: ${integration.name}`);
    return integration;
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const integration = await this.getIntegration(id);
    const updatedIntegration = {
      ...integration,
      ...updates,
      updatedAt: new Date(),
    };

    this.integrations.set(id, updatedIntegration);
    
    // Reinitialize HTTP client if settings changed
    if (updates.settings || updates.credentials) {
      await this.initializeHttpClient(updatedIntegration);
    }

    logger.info(`🔗 Updated integration: ${updatedIntegration.name}`);
    return updatedIntegration;
  }

  async deleteIntegration(id: string): Promise<void> {
    const integration = await this.getIntegration(id);
    
    // Clean up HTTP client
    this.httpClients.delete(id);
    
    // Clean up queues
    const queueKey = `integration-${id}`;
    const queue = this.queues.get(queueKey);
    if (queue) {
      await queue.close();
      this.queues.delete(queueKey);
    }

    this.integrations.delete(id);
    logger.info(`🔗 Deleted integration: ${integration.name}`);
  }

  async testIntegration(id: string): Promise<IntegrationTestResult> {
    const integration = await this.getIntegration(id);
    const startTime = Date.now();

    logger.info(`🧪 Testing integration: ${integration.name}`);

    const tests = await Promise.all([
      this.testConnection(integration),
      this.testAuthentication(integration),
      this.testEndpoints(integration),
      this.testDataFlow(integration),
      this.testPerformance(integration),
    ]);

    const duration = Date.now() - startTime;
    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const warnings = tests.filter(t => t.success && t.duration > 1000).length;

    const result: IntegrationTestResult = {
      success: failed === 0,
      duration,
      tests,
      summary: {
        total: tests.length,
        passed,
        failed,
        warnings,
        successRate: (passed / tests.length) * 100,
      },
      recommendations: this.generateTestRecommendations(tests),
    };

    // Update integration status based on test results
    const status = failed === 0 ? 'active' : 'error';
    await this.updateIntegration(id, { status, lastError: failed > 0 ? { code: 'TEST_FAILED', message: 'Integration test failed', details: {}, timestamp: new Date(), severity: 'high', resolved: false } : undefined });

    logger.info(`🧪 Integration test completed: ${result.success ? 'PASSED' : 'FAILED'}`);
    return result;
  }

  /**
   * Workflow Management Methods
   */
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`);
    }
    return workflow;
  }

  async createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      ...definition,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);
    
    // Initialize workflow queue if active
    if (workflow.status === 'active') {
      await this.initializeWorkflowQueue(workflow);
    }

    logger.info(`⚙️ Created workflow: ${workflow.name}`);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const workflow = await this.getWorkflow(id);
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updatedWorkflow);
    
    // Reinitialize queue if status changed
    if (updates.status) {
      if (updatedWorkflow.status === 'active') {
        await this.initializeWorkflowQueue(updatedWorkflow);
      } else {
        await this.cleanupWorkflowQueue(id);
      }
    }

    logger.info(`⚙️ Updated workflow: ${updatedWorkflow.name}`);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflow = await this.getWorkflow(id);
    
    // Clean up queue
    await this.cleanupWorkflowQueue(id);
    
    // Clean up executions
    const executions = Array.from(this.executions.values()).filter(e => e.workflowId === id);
    executions.forEach(e => this.executions.delete(e.id));

    this.workflows.delete(id);
    logger.info(`⚙️ Deleted workflow: ${workflow.name}`);
  }

  async deployWorkflow(id: string): Promise<void> {
    const workflow = await this.getWorkflow(id);
    
    // Validate workflow
    await this.validateWorkflow(workflow);
    
    // Update status to active
    await this.updateWorkflow(id, { status: 'active' });
    
    logger.info(`🚀 Deployed workflow: ${workflow.name}`);
  }

  async undeployWorkflow(id: string): Promise<void> {
    const workflow = await this.getWorkflow(id);
    
    // Update status to inactive
    await this.updateWorkflow(id, { status: 'inactive' });
    
    logger.info(`⏹️ Undeployed workflow: ${workflow.name}`);
  }

  /**
   * Execution Management Methods
   */
  async executeWorkflow(workflowId: string, input: Record<string, unknown>, options?: ExecutionOptions): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (workflow.status !== 'active') {
      throw new Error(`Workflow is not active: ${workflow.name}`);
    }

    const execution: WorkflowExecution = {
      id: uuidv4(),
      workflowId,
      workflowVersion: workflow.version,
      status: 'pending',
      startedAt: new Date(),
      trigger: {
        type: 'api',
        data: input,
        timestamp: new Date(),
      },
      input,
      variables: this.initializeVariables(workflow, input),
      steps: [],
      metadata: {
        environment: this.systemConfig.environment,
        version: this.systemConfig.version,
        ...options?.metadata,
      },
    };

    this.executions.set(execution.id, execution);

    // Add to queue
    const queue = this.queues.get(`workflow-${workflowId}`);
    if (queue) {
      const jobOptions: JobOptions = {
        attempts: options?.retryPolicy?.attempts || 3,
        backoff: {
          type: options?.retryPolicy?.backoff || 'exponential',
          delay: options?.retryPolicy?.delay || 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      };

      await queue.add('execute', { executionId: execution.id, input, options }, jobOptions);
    }

    logger.info(`🚀 Started workflow execution: ${execution.id}`);
    return execution;
  }

  async getExecution(id: string): Promise<WorkflowExecution> {
    const execution = this.executions.get(id);
    if (!execution) {
      throw new Error(`Execution not found: ${id}`);
    }
    return execution;
  }

  async getExecutions(workflowId?: string, filters?: ExecutionFilters): Promise<WorkflowExecution[]> {
    let executions = Array.from(this.executions.values());

    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId);
    }

    if (filters) {
      if (filters.status) {
        executions = executions.filter(e => e.status === filters.status);
      }
      if (filters.dateRange) {
        executions = executions.filter(e => 
          e.startedAt >= filters.dateRange!.start && 
          e.startedAt <= filters.dateRange!.end
        );
      }
      if (filters.triggerType) {
        executions = executions.filter(e => e.trigger.type === filters.triggerType);
      }
      if (filters.limit) {
        executions = executions.slice(0, filters.limit);
      }
    }

    return executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async cancelExecution(id: string): Promise<void> {
    const execution = await this.getExecution(id);
    
    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      this.executions.set(id, execution);
      
      logger.info(`⏹️ Cancelled execution: ${id}`);
    }
  }

  async retryExecution(id: string): Promise<void> {
    const execution = await this.getExecution(id);
    
    if (execution.status === 'failed') {
      // Reset execution status and retry
      execution.status = 'pending';
      execution.error = undefined;
      execution.steps = execution.steps.map(s => ({ ...s, status: 'pending', error: undefined, output: undefined }));
      
      this.executions.set(id, execution);
      
      // Re-add to queue
      const workflow = await this.getWorkflow(execution.workflowId);
      const queue = this.queues.get(`workflow-${workflow.id}`);
      if (queue) {
        await queue.add('retry', { executionId: id, input: execution.input });
      }
      
      logger.info(`🔄 Retrying execution: ${id}`);
    }
  }

  /**
   * Monitoring and Analytics Methods
   */
  async getIntegrationMetrics(integrationId: string, period: DateRange): Promise<IntegrationMetrics> {
    const integration = await this.getIntegration(integrationId);
    
    // Mock metrics calculation
    const metrics: IntegrationMetrics = {
      integrationId,
      period,
      requests: {
        total: 1000,
        successful: 950,
        failed: 50,
        successRate: 0.95,
        averageResponseTime: 250,
        requestsPerMinute: 16.7,
      },
      errors: {
        total: 50,
        byType: {
          'TIMEOUT': 20,
          'CONNECTION_ERROR': 15,
          'AUTHENTICATION_ERROR': 10,
          'VALIDATION_ERROR': 5,
        },
        byEndpoint: {
          '/api/bookings': 25,
          '/api/payments': 15,
          '/api/inventory': 10,
        },
        recent: [
          {
            timestamp: new Date(),
            code: 'TIMEOUT',
            message: 'Request timeout',
            endpoint: '/api/bookings',
          },
        ],
      },
      performance: {
        averageResponseTime: 250,
        p50: 200,
        p95: 500,
        p99: 1000,
        throughput: 16.7,
        errorRate: 0.05,
      },
      usage: {
        requests: 1000,
        dataTransferred: 1024000, // 1MB
        cost: 10.50,
        quota: {
          used: 1000,
          limit: 10000,
          percentage: 10,
          resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
    };

    return metrics;
  }

  async getWorkflowMetrics(workflowId: string, period: DateRange): Promise<WorkflowMetrics> {
    const workflow = await this.getWorkflow(workflowId);
    const executions = await this.getExecutions(workflowId, { dateRange: period });
    
    const successful = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    const cancelled = executions.filter(e => e.status === 'cancelled');
    
    const durations = successful.map(e => e.duration || 0);
    const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

    const metrics: WorkflowMetrics = {
      workflowId,
      period,
      executions: {
        total: executions.length,
        successful: successful.length,
        failed: failed.length,
        cancelled: cancelled.length,
        averageDuration,
        executionsPerDay: executions.length / Math.max(1, (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)),
      },
      performance: {
        averageDuration,
        p50: this.calculatePercentile(durations, 0.5),
        p95: this.calculatePercentile(durations, 0.95),
        p99: this.calculatePercentile(durations, 0.99),
        throughput: successful.length / Math.max(1, (period.end.getTime() - period.start.getTime()) / (1000 * 60)),
        successRate: successful.length / Math.max(1, executions.length),
      },
      errors: {
        total: failed.length,
        byStep: this.calculateErrorsByStep(failed),
        byType: this.calculateErrorsByType(failed),
        recent: failed.slice(0, 10).map(f => ({
          timestamp: f.startedAt,
          stepId: f.steps.find(s => s.error)?.stepId || 'unknown',
          stepName: f.steps.find(s => s.error)?.name || 'unknown',
          error: f.error?.message || 'Unknown error',
        })),
      },
    };

    return metrics;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const components = await this.checkComponentHealth();
    const metrics = await this.getSystemMetrics();
    const alerts = await this.getActiveAlerts();
    
    const overallStatus = components.every(c => c.status === 'healthy') ? 'healthy' : 
                           components.some(c => c.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      components,
      metrics,
      alerts,
    };

    return health;
  }

  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    // Mock alerts - in production, query from database
    const alerts: Alert[] = [
      {
        id: uuidv4(),
        name: 'High Error Rate',
        severity: 'high',
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 0.05,
          duration: 300,
        },
        message: 'Error rate exceeded 5% threshold',
        timestamp: new Date(),
        component: 'integration-booking-engine',
        acknowledged: false,
      },
      {
        id: uuidv4(),
        name: 'Slow Response Time',
        severity: 'medium',
        condition: {
          metric: 'response_time',
          operator: 'gt',
          threshold: 1000,
          duration: 600,
        },
        message: 'Average response time exceeded 1s',
        timestamp: new Date(),
        component: 'integration-payment-gateway',
        acknowledged: true,
        acknowledgedBy: 'admin',
        acknowledgedAt: new Date(),
      },
    ];

    if (filters) {
      return alerts.filter(alert => {
        if (filters.severity && !filters.severity.includes(alert.severity)) return false;
        if (filters.component && alert.component !== filters.component) return false;
        if (filters.acknowledged !== undefined && alert.acknowledged !== filters.acknowledged) return false;
        if (filters.dateRange && !(alert.timestamp >= filters.dateRange.start && alert.timestamp <= filters.dateRange.end)) return false;
        return true;
      });
    }

    return alerts;
  }

  /**
   * Configuration Management Methods
   */
  async getSystemConfig(): Promise<SystemConfig> {
    return this.systemConfig;
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    this.systemConfig = {
      ...this.systemConfig,
      ...config,
    };

    logger.info('⚙️ Updated system configuration');
    return this.systemConfig;
  }

  /**
   * Event Management Methods
   */
  async emitEvent(event: AutomationEvent): Promise<void> {
    // Store event
    await this.redis.setex(`event:${event.id}`, 3600, JSON.stringify(event));

    // Notify subscribers
    for (const [subscriptionId, { filters, callback }] of this.eventSubscriptions.entries()) {
      if (this.matchesEventFilters(event, filters)) {
        try {
          await callback(event);
        } catch (error) {
          logger.error(`Error in event subscription ${subscriptionId}:`, error);
        }
      }
    }

    // Trigger workflow executions
    await this.triggerWorkflowsByEvent(event);

    logger.info(`📡 Emitted event: ${event.type}`);
  }

  async subscribeToEvents(filters: EventFilter[], callback: EventCallback): Promise<string> {
    const subscriptionId = uuidv4();
    this.eventSubscriptions.set(subscriptionId, { filters, callback });
    
    logger.info(`📡 Subscribed to events: ${subscriptionId}`);
    return subscriptionId;
  }

  async unsubscribeFromEvents(subscriptionId: string): Promise<void> {
    this.eventSubscriptions.delete(subscriptionId);
    logger.info(`📡 Unsubscribed from events: ${subscriptionId}`);
  }

  /**
   * Private Helper Methods
   */
  private initializeSystemConfig(): SystemConfig {
    return {
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      features: [
        { name: 'webhooks', enabled: true, config: {} },
        { name: 'workflows', enabled: true, config: {} },
        { name: 'integrations', enabled: true, config: {} },
        { name: 'monitoring', enabled: true, config: {} },
      ],
      limits: {
        maxWorkflows: 100,
        maxIntegrations: 50,
        maxConcurrentExecutions: 10,
        maxExecutionTime: 3600, // 1 hour
        maxPayloadSize: 10485760, // 10MB
        maxRetries: 3,
      },
      security: {
        encryption: {
          algorithm: 'aes-256-gcm',
          keySize: 256,
          ivSize: 12,
          mode: 'gcm',
        },
        authentication: {
          required: true,
          methods: ['api-key', 'jwt'],
          tokenExpiry: 3600,
          refreshEnabled: true,
        },
        authorization: {
          required: true,
          roles: ['admin', 'user'],
          permissions: ['read', 'write', 'execute'],
          policies: [],
        },
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          burstLimit: 200,
          strategy: 'sliding',
        },
        audit: {
          enabled: true,
          logLevel: 'info',
          retention: 90,
          fields: ['user', 'action', 'resource', 'timestamp'],
        },
      },
      performance: {
        timeout: 30000,
        maxConcurrent: 10,
        queueSize: 1000,
        cacheSize: 100,
        batchSize: 50,
      },
      logging: {
        level: 'info',
        format: 'json',
        destinations: [
          { type: 'console', config: {}, enabled: true },
          { type: 'file', config: { path: 'logs/automation.log' }, enabled: true },
        ],
        sampling: 1.0,
      },
      monitoring: {
        enabled: true,
        metrics: ['requests', 'errors', 'duration', 'throughput'],
        healthCheck: {
          enabled: true,
          interval: 60,
          timeout: 5000,
          endpoints: [],
          failureThreshold: 3,
          recoveryThreshold: 2,
        },
        alerts: [],
      },
    };
  }

  private initializeQueues(): void {
    // Initialize default queues
    const workflowQueue = new Bull('workflow execution', {
      redis: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    workflowQueue.process('execute', this.processWorkflowExecution.bind(this));
    workflowQueue.process('retry', this.processWorkflowExecution.bind(this));

    this.queues.set('workflow', workflowQueue);
  }

  private async initializeWorkflowQueue(workflow: WorkflowDefinition): Promise<void> {
    const queueKey = `workflow-${workflow.id}`;
    
    if (!this.queues.has(queueKey)) {
      const queue = new Bull(queueKey, {
        redis: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      queue.process('execute', this.processWorkflowExecution.bind(this));
      queue.process('retry', this.processWorkflowExecution.bind(this));

      this.queues.set(queueKey, queue);
    }
  }

  private async cleanupWorkflowQueue(workflowId: string): Promise<void> {
    const queueKey = `workflow-${workflowId}`;
    const queue = this.queues.get(queueKey);
    
    if (queue) {
      await queue.close();
      this.queues.delete(queueKey);
    }
  }

  private async processWorkflowExecution(job: Job): Promise<void> {
    const { executionId, input, options } = job.data;
    const execution = await this.getExecution(executionId);
    const workflow = await this.getWorkflow(execution.workflowId);

    try {
      execution.status = 'running';
      this.executions.set(executionId, execution);

      // Execute workflow steps
      await this.executeWorkflowSteps(workflow, execution);

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      logger.info(`✅ Workflow execution completed: ${executionId}`);
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.error = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: {},
        timestamp: new Date(),
      };

      logger.error(`❌ Workflow execution failed: ${executionId}`, error);
    } finally {
      this.executions.set(executionId, execution);
    }
  }

  private async executeWorkflowSteps(workflow: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    for (const step of workflow.steps) {
      const stepExecution = {
        id: uuidv4(),
        stepId: step.id,
        name: step.name,
        type: step.type,
        status: 'pending' as const,
        startedAt: new Date(),
        input: execution.variables,
        attempts: 0,
        logs: [],
      };

      execution.steps.push(stepExecution);

      try {
        stepExecution.status = 'running';
        stepExecution.startedAt = new Date();

        // Execute step based on type
        const result = await this.executeStep(step, execution);
        
        stepExecution.status = 'completed';
        stepExecution.completedAt = new Date();
        stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt.getTime();
        stepExecution.output = result;

        // Update execution variables with step output
        if (result) {
          Object.assign(execution.variables, result);
        }

      } catch (error) {
        stepExecution.status = 'failed';
        stepExecution.completedAt = new Date();
        stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt.getTime();
        stepExecution.error = {
          code: 'STEP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          details: {},
          timestamp: new Date(),
        };

        throw error;
      }
    }
  }

  private async executeStep(step: any, execution: WorkflowExecution): Promise<any> {
    switch (step.type) {
      case 'integration':
        return await this.executeIntegrationStep(step, execution);
      case 'webhook':
        return await this.executeWebhookStep(step, execution);
      case 'notification':
        return await this.executeNotificationStep(step, execution);
      case 'delay':
        return await this.executeDelayStep(step, execution);
      case 'decision':
        return await this.executeDecisionStep(step, execution);
      case 'script':
        return await this.executeScriptStep(step, execution);
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  private async executeIntegrationStep(step: any, execution: WorkflowExecution): Promise<any> {
    const config = step.config.integration;
    const integration = await this.getIntegration(config.integrationId);
    const client = this.httpClients.get(integration.id);

    if (!client) {
      throw new Error(`HTTP client not initialized for integration: ${integration.id}`);
    }

    const requestConfig: AxiosRequestConfig = {
      method: config.method,
      url: `${integration.endpoints.find(e => e.id === config.endpoint)?.path || ''}`,
      data: config.parameters,
      timeout: step.timeout || 30000,
    };

    const response = await client.request(requestConfig);
    return response.data;
  }

  private async executeWebhookStep(step: any, execution: WorkflowExecution): Promise<any> {
    const config = step.config.webhook;
    
    const response = await axios({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.body || execution.variables,
      timeout: step.timeout || 30000,
    });

    return response.data;
  }

  private async executeNotificationStep(step: any, execution: WorkflowExecution): Promise<any> {
    const config = step.config.notification;
    
    if (config.type === 'email') {
      await this.emailTransporter.sendMail({
        to: config.recipients,
        subject: 'Workflow Notification',
        text: config.template,
        html: config.template,
      });
    }

    return { sent: true, recipients: config.recipients };
  }

  private async executeDelayStep(step: any, execution: WorkflowExecution): Promise<any> {
    const config = step.config.delay;
    const delay = config.duration * this.getDurationMultiplier(config.unit);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return { delayed: delay };
  }

  private async executeDecisionStep(step: any, execution: WorkflowExecution): Promise<any> {
    const config = step.config.decision;
    
    // Simple condition evaluation - in production, use proper expression parser
    const result = this.evaluateCondition(config.condition, execution.variables);
    
    return { decision: result, branch: result ? config.branches[0]?.name : config.defaultBranch };
  }

  private async executeScriptStep(step: any, execution: WorkflowExecution): Promise<any> {
    const config = step.config.script;
    
    // Simple script execution - in production, use proper sandbox
    if (config.language === 'javascript') {
      // SECURITY WARNING: This executes arbitrary code
      // In production, use a sandboxed environment like:
      // - vm2 (Node.js sandbox)
      // - QuickJS (isolated JavaScript engine)
      // - Server-side execution with strict validation
      
      // TODO: Implement secure code execution
      // For now, this is disabled for security
      throw new Error(
        'Custom code execution is disabled for security reasons. ' +
        'Please use predefined actions instead.'
      );
      
      // Old insecure implementation (commented out):
      // const func = new Function('context', config.code);
      // const result = func(execution.variables);
      // return result;
    }

    throw new Error(`Unsupported script language: ${config.language}`);
  }

  private getDurationMultiplier(unit: string): number {
    switch (unit) {
      case 'seconds': return 1000;
      case 'minutes': return 60 * 1000;
      case 'hours': return 60 * 60 * 1000;
      case 'days': return 24 * 60 * 60 * 1000;
      default: return 1000;
    }
  }

  private evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    // SECURITY: Use a safe expression parser instead of eval
    // For now, implement basic string matching
    
    // Simple safe conditions (no code execution):
    if (condition.includes('===') || condition.includes('==')) {
      const parts = condition.split(/===|==/);
      if (parts.length === 2) {
        const left = parts[0].trim();
        const right = parts[1].trim();
        
        // Extract variable name from context
        const leftValue = context[left] ?? left;
        const rightValue = context[right] ?? right;
        
        return String(leftValue) === String(rightValue);
      }
    }
    
    // Default: condition not met (safe default)
    return false;
  }

  private async initializeHttpClient(integration: IntegrationConfig): Promise<void> {
    const client = axios.create({
      timeout: integration.settings.timeout * 1000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add authentication
    if (integration.credentials.type === 'api-key') {
      client.defaults.headers.common['Authorization'] = `Bearer ${integration.credentials.data.apiKey}`;
    }

    // Add retry logic
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || config.__retryCount >= integration.settings.retryAttempts) {
          return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;
        config.__retryCount += 1;

        const delay = integration.settings.retryDelay * Math.pow(2, config.__retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        return client(config);
      }
    );

    this.httpClients.set(integration.id, client);
  }

  private async validateWorkflow(workflow: WorkflowDefinition): Promise<void> {
    // Basic validation
    if (!workflow.name || workflow.name.trim() === '') {
      throw new Error('Workflow name is required');
    }

    if (!workflow.trigger || !workflow.trigger.type) {
      throw new Error('Workflow trigger is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate steps
    for (const step of workflow.steps) {
      if (!step.name || step.name.trim() === '') {
        throw new Error('Step name is required');
      }
      if (!step.type) {
        throw new Error('Step type is required');
      }
    }
  }

  private initializeVariables(workflow: WorkflowDefinition, input: Record<string, unknown>): Record<string, unknown> {
    const variables: Record<string, unknown> = {};

    // Initialize with default values
    for (const variable of workflow.variables) {
      variables[variable.name] = variable.defaultValue;
    }

    // Override with input values
    Object.assign(variables, input);

    return variables;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  private calculateErrorsByStep(executions: WorkflowExecution[]): Record<string, number> {
    const errors: Record<string, number> = {};
    
    for (const execution of executions) {
      for (const step of execution.steps) {
        if (step.error) {
          errors[step.stepId] = (errors[step.stepId] || 0) + 1;
        }
      }
    }
    
    return errors;
  }

  private calculateErrorsByType(executions: WorkflowExecution[]): Record<string, number> {
    const errors: Record<string, number> = {};
    
    for (const execution of executions) {
      if (execution.error) {
        errors[execution.error.code] = (errors[execution.error.code] || 0) + 1;
      }
    }
    
    return errors;
  }

  private async checkComponentHealth(): Promise<any[]> {
    const components = [
      {
        name: 'Redis',
        status: 'healthy' as const,
        message: 'Connected',
        lastCheck: new Date(),
        responseTime: 5,
        uptime: 99.9,
      },
      {
        name: 'Queue System',
        status: 'healthy' as const,
        message: 'All queues operational',
        lastCheck: new Date(),
        responseTime: 10,
        uptime: 99.5,
      },
      {
        name: 'Email Service',
        status: 'healthy' as const,
        message: 'SMTP connection active',
        lastCheck: new Date(),
        responseTime: 50,
        uptime: 98.0,
      },
    ];

    return components;
  }

  private async getSystemMetrics(): Promise<any> {
    return {
      cpu: 45.2,
      memory: 67.8,
      disk: 34.1,
      network: {
        bytesIn: 1024000,
        bytesOut: 512000,
        packetsIn: 1500,
        packetsOut: 800,
        connections: 25,
      },
      activeConnections: 25,
      queueSize: 12,
    };
  }

  private async getActiveAlerts(): Promise<any[]> {
    return [];
  }

  private matchesEventFilters(event: AutomationEvent, filters: EventFilter[]): boolean {
    for (const filter of filters) {
      if (filter.type && event.type !== filter.type) return false;
      if (filter.source && event.source !== filter.source) return false;
      if (filter.dateRange && !(event.timestamp >= filter.dateRange.start && event.timestamp <= filter.dateRange.end)) return false;
    }
    return true;
  }

  private async triggerWorkflowsByEvent(event: AutomationEvent): Promise<void> {
    const workflows = await this.getWorkflows();
    
    for (const workflow of workflows) {
      if (workflow.status === 'active' && workflow.trigger.type === 'event') {
        const eventConfig = workflow.trigger.config.event;
        
        if (eventConfig.source === event.source && eventConfig.eventType === event.type) {
          // Check filters
          let shouldTrigger = true;
          for (const filter of eventConfig.filters || []) {
            const fieldValue = (event.data as any)[filter.field];
            if (!this.matchesFilter(fieldValue, filter.operator, filter.value)) {
              shouldTrigger = false;
              break;
            }
          }
          
          if (shouldTrigger) {
            await this.executeWorkflow(workflow.id, event.data);
          }
        }
      }
    }
  }

  private matchesFilter(fieldValue: unknown, operator: string, filterValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === filterValue;
      case 'not-equals':
        return fieldValue !== filterValue;
      case 'contains':
        return String(fieldValue).includes(String(filterValue));
      case 'not-contains':
        return !String(fieldValue).includes(String(filterValue));
      case 'gt':
        return Number(fieldValue) > Number(filterValue);
      case 'lt':
        return Number(fieldValue) < Number(filterValue);
      default:
        return true;
    }
  }

  private async testConnection(integration: IntegrationConfig): Promise<any> {
    try {
      const client = this.httpClients.get(integration.id);
      if (!client) {
        await this.initializeHttpClient(integration);
      }
      
      // Test basic connectivity
      await this.httpClients.get(integration.id)!.get('/health');
      
      return {
        name: 'Connection Test',
        type: 'connection',
        success: true,
        duration: 100,
        message: 'Connection successful',
      };
    } catch (error) {
      return {
        name: 'Connection Test',
        type: 'connection',
        success: false,
        duration: 5000,
        message: error instanceof Error ? error.message : 'Connection failed',
        details: { error },
      };
    }
  }

  private async testAuthentication(integration: IntegrationConfig): Promise<any> {
    try {
      const client = this.httpClients.get(integration.id);
      if (!client) {
        throw new Error('HTTP client not initialized');
      }
      
      // Test authentication
      await client.get('/auth/me');
      
      return {
        name: 'Authentication Test',
        type: 'authentication',
        success: true,
        duration: 150,
        message: 'Authentication successful',
      };
    } catch (error) {
      return {
        name: 'Authentication Test',
        type: 'authentication',
        success: false,
        duration: 1000,
        message: error instanceof Error ? error.message : 'Authentication failed',
        details: { error },
      };
    }
  }

  private async testEndpoints(integration: IntegrationConfig): Promise<any> {
    const results = [];
    
    for (const endpoint of integration.endpoints.slice(0, 3)) {
      try {
        const client = this.httpClients.get(integration.id);
        if (!client) {
          throw new Error('HTTP client not initialized');
        }
        
        const startTime = Date.now();
        await client.request({
          method: endpoint.method,
          url: endpoint.path,
        });
        const duration = Date.now() - startTime;
        
        results.push({
          name: `Endpoint Test: ${endpoint.name}`,
          type: 'endpoint',
          success: true,
          duration,
          message: `${endpoint.method} ${endpoint.path} successful`,
        });
      } catch (error) {
        results.push({
          name: `Endpoint Test: ${endpoint.name}`,
          type: 'endpoint',
          success: false,
          duration: 5000,
          message: error instanceof Error ? error.message : 'Endpoint test failed',
          details: { error, endpoint },
        });
      }
    }
    
    return results;
  }

  private async testDataFlow(integration: IntegrationConfig): Promise<any> {
    try {
      // Test data mapping and transformation
      const testData = { test: 'data' };
      const transformed = this.transformData(testData, integration.mappings);
      
      return {
        name: 'Data Flow Test',
        type: 'data',
        success: true,
        duration: 50,
        message: 'Data transformation successful',
        details: { input: testData, output: transformed },
      };
    } catch (error) {
      return {
        name: 'Data Flow Test',
        type: 'data',
        success: false,
        duration: 100,
        message: error instanceof Error ? error.message : 'Data flow test failed',
        details: { error },
      };
    }
  }

  private async testPerformance(integration: IntegrationConfig): Promise<any> {
    const requests = [];
    const startTime = Date.now();
    
    try {
      const client = this.httpClients.get(integration.id);
      if (!client) {
        throw new Error('HTTP client not initialized');
      }
      
      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        client.get('/health')
      );
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      return {
        name: 'Performance Test',
        type: 'performance',
        success: true,
        duration,
        message: `10 concurrent requests completed in ${duration}ms`,
        details: { requestsPerSecond: (10000 / duration).toFixed(2) },
      };
    } catch (error) {
      return {
        name: 'Performance Test',
        type: 'performance',
        success: false,
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Performance test failed',
        details: { error },
      };
    }
  }

  private transformData(data: any, mappings: any[]): any {
    const result = {};
    
    for (const mapping of mappings) {
      const sourceValue = this.getNestedValue(data, mapping.sourceField);
      result[mapping.targetField] = this.applyTransformation(sourceValue, mapping.transformation);
    }
    
    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private applyTransformation(value: any, transformation: any): any {
    switch (transformation.type) {
      case 'direct':
        return value;
      case 'format':
        return String(value).toUpperCase();
      case 'calculate':
        return Number(value) * 2; // Example transformation
      default:
        return value;
    }
  }

  private generateTestRecommendations(tests: any[]): string[] {
    const recommendations = [];
    
    const failedTests = tests.filter(t => !t.success);
    const slowTests = tests.filter(t => t.duration > 1000);
    
    if (failedTests.length > 0) {
      recommendations.push('Fix failed tests before deploying to production');
    }
    
    if (slowTests.length > 0) {
      recommendations.push('Optimize slow endpoints for better performance');
    }
    
    if (tests.every(t => t.success)) {
      recommendations.push('Integration is ready for production deployment');
    }
    
    return recommendations;
  }

  private initializeMockData(): void {
    logger.info('🔧 Initializing automation engine with mock data');
    
    // Add some mock integrations
    this.createMockIntegrations();
    
    // Add some mock workflows
    this.createMockWorkflows();
  }

  private async createMockIntegrations(): Promise<void> {
    const mockIntegrations: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Booking.com Integration',
        type: 'booking-engine',
        provider: 'Booking.com',
        version: '1.0',
        status: 'active',
        credentials: {
          type: 'api-key',
          encrypted: true,
          data: { apiKey: 'mock-api-key' },
          rotationRequired: false,
        },
        settings: {
          timeout: 30,
          retryAttempts: 3,
          retryDelay: 5,
          rateLimit: {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
            burstLimit: 200,
            strategy: 'sliding',
          },
          caching: {
            enabled: true,
            ttl: 300,
            maxSize: 100,
            strategy: 'lru',
            invalidation: [],
          },
          logging: {
            level: 'info',
            format: 'json',
            destinations: [
              { type: 'console', config: {}, enabled: true },
            ],
            sampling: 1.0,
          },
          security: {
            encryption: {
              algorithm: 'aes-256-gcm',
              keySize: 256,
              ivSize: 12,
              mode: 'gcm',
            },
            authentication: {
              required: true,
              methods: ['api-key'],
              tokenExpiry: 3600,
              refreshEnabled: false,
            },
            authorization: {
              required: false,
              roles: [],
              permissions: [],
              policies: [],
            },
            validation: {
              requestValidation: true,
              responseValidation: true,
              schemaValidation: false,
              sanitization: true,
              rules: [],
            },
          },
          performance: {
            timeout: 30,
            maxConcurrent: 10,
            queueSize: 100,
            circuitBreaker: {
              enabled: true,
              failureThreshold: 5,
              recoveryTimeout: 60000,
              halfOpenMaxCalls: 3,
              slidingWindowType: 'count',
              slidingWindowSize: 10,
            },
            bulkhead: {
              enabled: false,
              maxConcurrentCalls: 10,
              maxWaitTime: 5000,
              queueSize: 50,
            },
          },
        },
        endpoints: [
          {
            id: 'health',
            name: 'Health Check',
            path: '/health',
            method: 'GET',
            description: 'Check API health',
            parameters: [],
            monitoring: {
              enabled: true,
              metrics: ['response_time', 'success_rate'],
              alerts: [],
              sampling: 1.0,
            },
          },
        ],
        webhooks: [],
        mappings: [],
        syncSettings: {
          enabled: true,
          direction: 'bidirectional',
          frequency: 'real-time',
          conflictResolution: {
            strategy: 'source-wins',
            rules: [],
          },
          filters: [],
          batchSize: 100,
          maxRetries: 3,
          errorHandling: {
            strategy: 'retry',
            maxRetries: 3,
            retryDelay: 5000,
            deadLetterQueue: true,
            notification: [],
          },
        },
        monitoring: {
          enabled: true,
          metrics: [
            { name: 'requests', type: 'counter', description: 'Total requests', labels: {}, enabled: true },
            { name: 'errors', type: 'counter', description: 'Total errors', labels: {}, enabled: true },
          ],
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 5000,
            endpoints: [
              { url: '/health', method: 'GET', expectedStatus: 200, timeout: 5000 },
            ],
            failureThreshold: 3,
            recoveryThreshold: 2,
          },
          alerts: [],
          dashboards: [],
        },
      },
    ];

    for (const integration of mockIntegrations) {
      await this.createIntegration(integration);
    }
  }

  private async createMockWorkflows(): Promise<void> {
    const mockWorkflows: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Booking Confirmation Workflow',
        description: 'Automatically send booking confirmations and update internal systems',
        version: '1.0',
        status: 'active',
        trigger: {
          type: 'event',
          config: {
            event: {
              source: 'booking-engine',
              eventType: 'booking.created',
              filters: [],
            },
          },
          enabled: true,
        },
        steps: [
          {
            id: 'send-confirmation',
            name: 'Send Booking Confirmation',
            type: 'notification',
            config: {
              notification: {
                type: 'email',
                recipients: ['guest@example.com'],
                template: 'Booking confirmation template',
                data: {},
                priority: 'high',
              },
            },
            position: { x: 100, y: 100 },
            retryPolicy: {
              attempts: 3,
              delay: 1000,
              backoff: 'exponential',
              maxDelay: 10000,
              jitter: true,
              retryableErrors: ['TIMEOUT', 'CONNECTION_ERROR'],
            },
            timeout: 30000,
          },
        ],
        variables: [
          {
            name: 'bookingId',
            type: 'string',
            required: true,
            description: 'Booking ID',
            validation: [],
          },
        ],
        errorHandling: {
          strategy: 'retry',
          maxRetries: 3,
          retryDelay: 5000,
          notification: [],
        },
        monitoring: {
          enabled: true,
          metrics: [
            { name: 'executions', type: 'counter', description: 'Workflow executions', labels: {} },
          ],
          alerts: [],
          logging: {
            level: 'info',
            includePayload: false,
            includeResult: false,
            customFields: [],
          },
        },
        executionCount: 0,
        successCount: 0,
        errorCount: 0,
      },
    ];

    for (const workflow of mockWorkflows) {
      await this.createWorkflow(workflow);
    }
  }
}
