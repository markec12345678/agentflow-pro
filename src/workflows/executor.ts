/**
 * AgentFlow Pro - Workflow execution engine
 */

import type { Workflow, WorkflowNode, WorkflowEdge } from "./types";
import type { Orchestrator } from "../orchestrator/Orchestrator";
import type { ConditionOperator } from "./nodes";
import { validateWorkflow } from "./validator";
import { evaluateCondition, getNextBranch } from "./conditions";
import { wrapWithErrorHandler } from "./error-handler";

export interface StepResult {
  nodeId: string;
  success: boolean;
  output?: unknown;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  steps: StepResult[];
  output: Record<string, unknown>;
}

function getOutgoingTargets(nodeId: string, edges: WorkflowEdge[]): string[] {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}

export async function executeWorkflow(
  workflow: Workflow,
  orchestrator: Orchestrator,
  initialContext: Record<string, unknown> = {}
): Promise<ExecutionResult> {
  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    return {
      success: false,
      steps: [],
      output: { error: validation.errors.join("; ") },
    };
  }

  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
  const steps: StepResult[] = [];
  const context = { ...initialContext };

  const runNode = async (
    nodeId: string,
    ctx: Record<string, unknown>
  ): Promise<unknown> => {
    const node = nodeMap.get(nodeId);
    if (!node) return undefined;

    switch (node.type) {
      case "Trigger":
        return { triggered: true };

      case "Agent": {
        const agentType = node.data?.agentType as string;
        const input = (node.data?.input as Record<string, unknown>) ?? ctx;
        const taskId = await orchestrator.queueTask(agentType as "research" | "content" | "code" | "deploy", input);
        const maxWait = 30000;
        const start = Date.now();
        while (Date.now() - start < maxWait) {
          const t = orchestrator.getTask(taskId);
          if (t?.status === "completed") return t.result;
          if (t?.status === "failed") throw new Error(t.error);
          await new Promise((r) => setTimeout(r, 100));
        }
        throw new Error("Agent execution timeout");
      }

      case "Action":
        return { action: node.data?.action, params: node.data?.params };

      case "Condition":
        return evaluateCondition(
          node.data?.operator as ConditionOperator,
          String(node.data?.operandA ?? ""),
          String(node.data?.operandB ?? ""),
          ctx as Record<string, unknown>
        );

      default:
        return undefined;
    }
  };

  const wrappedRun = wrapWithErrorHandler(runNode);
  const executed = new Set<string>();
  const triggerIds = workflow.nodes.filter((n) => n.type === "Trigger").map((n) => n.id);
  const queue = [...triggerIds];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (executed.has(nodeId)) continue;
    executed.add(nodeId);

    const node = nodeMap.get(nodeId)!;
    const result = await wrappedRun(nodeId, context);
    steps.push(result);

    if (!result.success) break;

    const output = result.output;
    if (output != null) context[`${nodeId}_output`] = output;

    if (node.type === "Condition") {
      const branchResult = typeof output === "boolean" ? output : false;
      const nextIds = getNextBranch(branchResult, node, workflow.edges);
      for (const next of nextIds) {
        if (!executed.has(next)) queue.push(next);
      }
    } else {
      for (const next of getOutgoingTargets(nodeId, workflow.edges)) {
        if (!executed.has(next)) queue.push(next);
      }
    }
  }

  return {
    success: steps.every((s) => s.success),
    steps,
    output: context,
  };
}
