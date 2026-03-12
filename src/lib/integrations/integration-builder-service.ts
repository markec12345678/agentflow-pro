/**
 * Custom Integration Builder Service
 * Allows users to create no-code API integrations
 */

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'api' | 'oauth';
  trigger: {
    type: 'webhook' | 'polling' | 'manual';
    url?: string;
    pollingInterval?: number; // minutes
  };
  authentication?: {
    type: 'none' | 'api-key' | 'bearer' | 'basic' | 'oauth2';
    apiKey?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
  };
  actions: IntegrationAction[];
  mappings: DataMapping[];
  errorHandling: {
    retries: number;
    retryDelay: number; // seconds
    onError: 'stop' | 'continue' | 'notify';
    notifyEmail?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IntegrationAction {
  id: string;
  name: string;
  type: 'http-request' | 'transform' | 'filter' | 'delay' | 'branch';
  config: any;
  order: number;
}

interface DataMapping {
  sourceField: string;
  targetField: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'date' | 'number' | 'custom';
  transformFormula?: string;
  required: boolean;
}

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  source: string;
}

export class IntegrationBuilderService {
  /**
   * Create new integration
   */
  async createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const { prisma } = await import('@/lib/prisma');

    const integration = await prisma.customIntegration.create({
      data: {
        name: config.name,
        description: config.description,
        type: config.type,
        triggerConfig: config.trigger,
        authConfig: config.authentication,
        actions: config.actions,
        mappings: config.mappings,
        errorHandling: config.errorHandling,
        active: config.active,
      },
    });

    return this.prismaToIntegration(integration);
  }

  /**
   * Execute integration actions
   */
  async executeIntegration(integrationId: string, payload: WebhookPayload): Promise<any> {
    const { prisma } = await import('@/lib/prisma');

    const integration = await prisma.customIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    if (!integration.active) {
      throw new Error('Integration is not active');
    }

    const config = integration.config as IntegrationConfig;
    let data = payload.data;

    // Execute actions in order
    for (const action of config.actions.sort((a, b) => a.order - b.order)) {
      try {
        data = await this.executeAction(action, data, integration);
      } catch (error) {
        console.error(`Action ${action.name} failed:`, error);

        // Error handling
        if (config.errorHandling.onError === 'stop') {
          throw error;
        } else if (config.errorHandling.onError === 'notify') {
          await this.sendErrorNotification(config, error, payload);
        }
        // continue if onError === 'continue'
      }
    }

    // Log execution
    await prisma.integrationExecution.create({
      data: {
        integrationId,
        status: 'success',
        inputData: payload,
        outputData: data,
        executedAt: new Date(),
      },
    });

    return data;
  }

  /**
   * Execute single action
   */
  private async executeAction(
    action: IntegrationAction,
    data: any,
    integration: any
  ): Promise<any> {
    switch (action.type) {
      case 'http-request':
        return this.executeHttpRequest(action, data);
      case 'transform':
        return this.transformData(action, data);
      case 'filter':
        return this.filterData(action, data);
      case 'delay':
        await this.delay(action.config.delayMs || 1000);
        return data;
      case 'branch':
        return this.executeBranch(action, data, integration);
      default:
        return data;
    }
  }

  /**
   * Execute HTTP request action
   */
  private async executeHttpRequest(action: IntegrationAction, data: any): Promise<any> {
    const { url, method, headers, body } = action.config;

    // Apply data mappings to body
    const mappedBody = this.applyMappings(body, data);

    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: mappedBody ? JSON.stringify(mappedBody) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Transform data action
   */
  private transformData(action: IntegrationAction, data: any): any {
    const { transformations } = action.config;

    let result = { ...data };

    for (const transform of transformations) {
      const { field, operation, value } = transform;

      switch (operation) {
        case 'set':
          result[field] = value;
          break;
        case 'delete':
          delete result[field];
          break;
        case 'rename':
          result[value] = result[field];
          delete result[field];
          break;
        case 'uppercase':
          result[field] = String(result[field]).toUpperCase();
          break;
        case 'lowercase':
          result[field] = String(result[field]).toLowerCase();
          break;
        case 'concat':
          result[field] = result[field] + value;
          break;
      }
    }

    return result;
  }

  /**
   * Filter data action
   */
  private filterData(action: IntegrationAction, data: any): any {
    const { condition } = action.config;

    // Simple condition evaluation
    const { field, operator, value } = condition;

    const passes = this.evaluateCondition(data[field], operator, value);

    return passes ? data : null;
  }

  /**
   * Execute branch action
   */
  private async executeBranch(
    action: IntegrationAction,
    data: any,
    integration: any
  ): Promise<any> {
    const { branches } = action.config;

    for (const branch of branches) {
      const { condition, actions } = branch;

      const passes = this.evaluateCondition(data[condition.field], condition.operator, condition.value);

      if (passes) {
        // Execute branch actions
        for (const branchAction of actions) {
          data = await this.executeAction(branchAction, data, integration);
        }
        break;
      }
    }

    return data;
  }

  /**
   * Apply data mappings
   */
  private applyMappings(template: any, data: any): any {
    if (!template) return undefined;

    const result = JSON.parse(JSON.stringify(template));

    for (const key in result) {
      if (typeof result[key] === 'string' && result[key].startsWith('{{') && result[key].endsWith('}}')) {
        const fieldPath = result[key].slice(2, -2).trim();
        result[key] = this.getFieldValue(data, fieldPath);
      }
    }

    return result;
  }

  /**
   * Get nested field value
   */
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send error notification
   */
  private async sendErrorNotification(config: IntegrationConfig, error: any, payload: WebhookPayload): Promise<void> {
    if (!config.errorHandling.notifyEmail) return;

    const { sendGridService } = await import('@/lib/integrations/sendgrid-service');

    await sendGridService.sendEmail({
      to: config.errorHandling.notifyEmail,
      subject: `Integration Error: ${config.name}`,
      html: `
        <h2>Integration Error</h2>
        <p><strong>Integration:</strong> ${config.name}</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('sl-SI')}</p>
        <h3>Payload:</h3>
        <pre>${JSON.stringify(payload, null, 2)}</pre>
      `,
    });
  }

  /**
   * Generate webhook URL
   */
  generateWebhookUrl(integrationId: string, token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    return `${baseUrl}/api/integrations/webhook/${integrationId}?token=${token}`;
  }

  /**
   * Convert Prisma model to IntegrationConfig
   */
  private prismaToIntegration(prismaData: any): IntegrationConfig {
    return {
      id: prismaData.id,
      name: prismaData.name,
      description: prismaData.description,
      type: prismaData.type,
      trigger: prismaData.triggerConfig,
      authentication: prismaData.authConfig,
      actions: prismaData.actions,
      mappings: prismaData.mappings,
      errorHandling: prismaData.errorHandling,
      active: prismaData.active,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };
  }
}

export const integrationBuilderService = new IntegrationBuilderService();
