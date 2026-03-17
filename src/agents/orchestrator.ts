import { Agent } from '../orchestrator/Orchestrator';
import { VerifierAgent, VerificationPlan, VerificationExecution, VerificationResult, VerificationReport } from './verification/VerifierAgent';

interface OrchestratorAgentError {
  agentId: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

export interface WorkflowExecutionWithVerification extends WorkflowResult {
  verificationReport?: VerificationReport;
  requiresHumanReview: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  agentIds: string[];
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  nodes: any[];
  edges: any[];
}

export interface WorkflowResult {
  success: boolean;
  results: Record<string, any>;
  errors: OrchestratorAgentError[];
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
  private verifier?: VerifierAgent;
  private enableVerification = true;

  constructor(
    private agents: Agent[] = [],
    options?: {
      verifier?: VerifierAgent;
      enableVerification?: boolean;
    }
  ) {
    if (options?.verifier) {
      this.verifier = options.verifier;
    }
    if (options?.enableVerification !== undefined) {
      this.enableVerification = options.enableVerification;
    }
  }

  addAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  setVerifier(verifier: VerifierAgent): void {
    this.verifier = verifier;
  }

  async executeWorkflow(workflow: Workflow): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: Record<string, any> = {};
    const errors: OrchestratorAgentError[] = [];
    let parallelExecutions = 0;
    let retries = 0;

    try {
      // Parse workflow nodes and edges
      const nodes = JSON.parse(JSON.stringify(workflow.nodes) || '[]');
      const edges = JSON.parse(JSON.stringify(workflow.edges) || '[]');

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

      // Verify results if verifier is available
      let verificationReport: VerificationReport | undefined;
      let requiresHumanReview = false;

      if (this.enableVerification && this.verifier && Object.keys(results).length > 0) {
        console.log('[Orchestrator] Running verification...');
        
        const workflowPlan: VerificationPlan = {
          id: workflow.id,
          goal: workflow.name,
          requirements: workflow.config?.requirements || [],
          successCriteria: workflow.config?.successCriteria || [],
          constraints: workflow.config?.constraints || [],
        };

        // Create verification execution from workflow results
        const verificationExecution: VerificationExecution = {
          agentId: 'orchestrator',
          agentType: 'workflow',
          input: workflow,
          output: results,
          executionTime: Date.now() - startTime,
          metrics: {
            agentsExecuted: Object.keys(results).length,
            parallelExecutions,
            retries
          }
        };

        const verificationResult: VerificationResult = {
          success: errors.length === 0,
          result: results,
        };

        verificationReport = await this.verifier.verify(
          workflowPlan,
          verificationExecution,
          verificationResult
        );

        requiresHumanReview = verificationReport.requiresHumanReview;

        // If verification failed badly, consider retry
        if (!verificationReport.passed && verificationReport.recommendations.action === 'retry') {
          console.log('[Orchestrator] Verification recommends retry');
          retries++;
          if (retries <= this.maxRetries) {
            // Could implement retry logic here
          }
        }

        console.log(`[Orchestrator] Verification complete: ${verificationReport.overallConfidence.toFixed(2)}`);
      }

      const workflowResult: WorkflowExecutionWithVerification = {
        success: errors.length === 0 && (!this.enableVerification || !verificationReport || verificationReport.passed),
        results,
        errors,
        executionTime: Date.now() - startTime,
        metrics: {
          agentsExecuted: Object.keys(results).length,
          parallelExecutions,
          retries
        },
        verificationReport,
        requiresHumanReview
      };

      return workflowResult;
    } catch (error) {
      errors.push({
        agentId: 'ORCHESTRATOR',
        type: 'SYSTEM_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
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
      throw new Error(`Agent execution failed: ${plan.agent.id} - ${error instanceof Error ? error.message : 'Unknown error'}`);
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
