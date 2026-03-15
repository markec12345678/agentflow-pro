/**
 * Agent Security Wrapper
 * Wraps agent execution with security checks and approvals
 */

import { approvalManager, assessRisk, createApprovalMiddleware } from './security/approval-manager';
import { promptInjectionDetector, createSecurityMiddleware } from './security/prompt-injection-detector';
import { loopDetector, createLoopPreventionMiddleware } from './security/loop-detector';
import type { Agent } from '../orchestrator/Orchestrator';

export interface SecurityConfig {
  enablePromptInjectionDetection: boolean;
  enableApprovalWorkflow: boolean;
  enableLoopDetection: boolean;
  requireApprovalForActions: string[];
}

const defaultSecurityConfig: SecurityConfig = {
  enablePromptInjectionDetection: true,
  enableApprovalWorkflow: true,
  enableLoopDetection: true,
  requireApprovalForActions: [
    'deploy_to_production',
    'send_customer_email',
    'create_pull_request',
    'delete_database',
    'modify_production_config',
  ],
};

/**
 * Wrap agent with security layers
 */
export function createSecureAgent(
  agent: Agent,
  config: Partial<SecurityConfig> = {}
): Agent {
  const securityConfig = { ...defaultSecurityConfig, ...config };

  return {
    ...agent,
    execute: async (input: unknown): Promise<any> => {
      const inputStr = typeof input === 'string' ? input : JSON.stringify(input);

      // 1. Prompt Injection Detection
      if (securityConfig.enablePromptInjectionDetection) {
        const scanResult = await promptInjectionDetector.scanInput(inputStr);
        
        if (scanResult.recommendation === 'block') {
          throw new Error(
            `Security Alert: Request blocked due to ${scanResult.detectedThreats.length} detected threats`
          );
        }

        if (scanResult.recommendation === 'review') {
          logger.warn(`[Security] Input flagged for review:`, scanResult.detectedThreats);
        }

        // Use sanitized input if available
        const safeInput = scanResult.sanitizedInput || input;
        return executeWithSecurityChecks(agent, safeInput, securityConfig);
      }

      return executeWithSecurityChecks(agent, input, securityConfig);
    },
  };
}

/**
 * Execute agent with security checks (approvals, loop detection)
 */
async function executeWithSecurityChecks(
  agent: Agent,
  input: unknown,
  config: SecurityConfig
): Promise<any> {
  // 2. Determine if approval is needed
  const action = extractActionFromInput(input);
  const riskLevel = assessRisk(agent.id, action, input);

  if (config.enableApprovalWorkflow && requiresApproval(action, config)) {
    const approval = await approvalManager.requestApproval(
      agent.id,
      action,
      `Agent ${agent.id} requires approval for ${action}`,
      input,
      riskLevel
    );

    logger.info(`[Security] Approval requested: ${approval.id}`);

    // Wait for approval
    try {
      await approvalManager.waitForApproval(approval.id, 10 * 60 * 1000);
    } catch (error) {
      throw new Error(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 3. Execute with loop detection
  if (config.enableLoopDetection) {
    const traceId = loopDetector.startTracking(agent.id);
    
    try {
      const result = await agent.execute(input);
      
      loopDetector.recordIteration(traceId, input, result);
      loopDetector.completeTracking(traceId);
      
      return result;
    } catch (error) {
      loopDetector.completeTracking(traceId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // 4. Execute without loop detection
  return agent.execute(input);
}

/**
 * Extract action name from input
 */
function extractActionFromInput(input: unknown): string {
  if (typeof input !== 'object' || input === null) return 'execute';
  
  const inputObj = input as Record<string, any>;
  return inputObj.action || inputObj.type || 'execute';
}

/**
 * Check if action requires approval based on config
 */
function requiresApproval(action: string, config: SecurityConfig): boolean {
  return config.requireApprovalForActions.includes(action);
}

/**
 * Security middleware for agent execution
 */
export function createAgentSecurityMiddleware(config: Partial<SecurityConfig> = {}) {
  const securityConfig = { ...defaultSecurityConfig, ...config };

  return async function securityMiddleware(
    agent: Agent,
    input: unknown,
    execute: () => Promise<any>
  ): Promise<any> {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);

    // Scan for security threats
    if (securityConfig.enablePromptInjectionDetection) {
      const scanResult = await promptInjectionDetector.scanInput(inputStr);
      
      if (scanResult.recommendation === 'block') {
        throw new Error(`Blocked: ${scanResult.detectedThreats.length} security threats detected`);
      }
    }

    // Execute with loop prevention
    if (securityConfig.enableLoopDetection) {
      const loopMiddleware = createLoopPreventionMiddleware(loopDetector);
      return loopMiddleware(agent.id, async () => execute());
    }

    return execute();
  };
}

/**
 * Get security status for agent
 */
export function getAgentSecurityStatus(agentId: string): {
  pendingApprovals: number;
  recentThreats: number;
  loopDetections: number;
} {
  const pendingApprovals = approvalManager.getPendingApprovals().filter(a => a.agentId === agentId).length;
  
  // Would track threats and loop detections in production
  return {
    pendingApprovals,
    recentThreats: 0,
    loopDetections: 0,
  };
}
