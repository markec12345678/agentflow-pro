import { Agent } from './Agent';
import { Workflow } from '@prisma/client';
import { AgentError } from './errors';

export interface WorkflowResult {
  success: boolean;
  results: Record<string, any>;
  errors: AgentError[];
  executionTime: number;
  metrics: {
    agentsExecuted: number;
    parallelExecutions: number;
    retries: number;
  };
}

export interface AgentExecutionPlan {
  agent: Agent;
  input: any;
  dependencies: string[];
  canRunParallel: boolean;
  retryCount: number;
}

export class AgentOrchestrator {
  private maxRetries = 3;
  private parallelLimit = 4;

  constructor(private agents: Agent[] = []) {}

  addAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  async executeWorkflow(workflow: Workflow): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: Record<string, any> = {};
    const errors: AgentError[] = [];
    let parallelExecutions = 0;
    let retries = 0;

    try {
      // Parse workflow nodes and edges
      const nodes = JSON.parse(workflow.nodes || '[]');
      const edges = JSON.parse(workflow.edges || '[]');

      // Create execution plan
      const executionPlan = this.createExecutionPlan(nodes, edges);

      // Execute agents according to plan
      while (executionPlan.length > 0) {
        const currentBatch = executionPlan.filter(plan =>
          plan.dependencies.every(dep => results[dep]) &&
          plan.retryCount < this.maxRetries
        );

        if (currentBatch.length === 0) {
          throw new Error('Circular dependency detected or all agents failed');
        }

        // Execute parallel batches
        const batchPromises = currentBatch.slice(0, this.parallelLimit).map(plan => {
          parallelExecutions++;
          return this.executeAgentPlan(plan, results);
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          const plan = currentBatch[index];
          if (result.status === 'fulfilled') {
            results[plan.agent.id] = result.value;
            // Remove completed plans
            const planIndex = executionPlan.findIndex(p => p.agent.id === plan.agent.id);
            if (planIndex > -1) executionPlan.splice(planIndex, 1);
          } else {
            errors.push(result.reason);
            // Increment retry count
            const planIndex = executionPlan.findIndex(p => p.agent.id === plan.agent.id);
            if (planIndex > -1) {
              executionPlan[planIndex].retryCount++;
              retries++;
            }
          }
        });
      }

      return {
        success: errors.length === 0,
        results,
        errors,
        executionTime: Date.now() - startTime,
        metrics: {
          agentsExecuted: Object.keys(results).length,
          parallelExecutions,
          retries
        }
      };
    } catch (error) {
      errors.push(new AgentError('ORCHESTRATOR', error.message));
      return {
        success: false,
        results,
        errors,
        executionTime: Date.now() - startTime,
        metrics: {
          agentsExecuted: Object.keys(results).length,
          parallelExecutions,
          retries
        }
      };
    }
  }

  private createExecutionPlan(nodes: any[], edges: any[]): AgentExecutionPlan[] {
    // Map edges to dependencies
    const dependencies: Record<string, string[]> = {};
    edges.forEach(edge => {
      if (!dependencies[edge.target]) {
        dependencies[edge.target] = [];
      }
      dependencies[edge.target].push(edge.source);
    });

    // Create execution plan
    return nodes.map(node => {
      const agent = this.agents.find(a => a.id === node.id || a.type === node.type);
      if (!agent) {
        throw new Error(`Agent not found: ${node.id || node.type}`);
      }

      return {
        agent,
        input: node.data?.input || {},
        dependencies: dependencies[node.id] || [],
        canRunParallel: node.data?.parallel !== false,
        retryCount: 0
      };
    });
  }

  private async executeAgentPlan(plan: AgentExecutionPlan, context: Record<string, any>): Promise<any> {
    try {
      // Enhance input with context from previous agents
      const enhancedInput = {
        ...plan.input,
        context: Object.fromEntries(
          Object.entries(context).filter(([key]) =>
            plan.dependencies.includes(key)
          )
        )
      };

      // Execute agent
      const result = await plan.agent.execute(enhancedInput);

      // Validate result
      if (!result || typeof result !== 'object') {
        throw new Error(`Invalid result from agent ${plan.agent.id}`);
      }

      return result;
    } catch (error) {
      throw new AgentError(plan.agent.id, error.message, {
        input: plan.input,
        retryCount: plan.retryCount
      });
    }
  }
}

export class AgentError extends Error {
  constructor(
    public agentId: string,
    message: string,
    public context?: any
  ) {
    super(`[${agentId}] ${message}`);
    this.name = 'AgentError';
  }
}
