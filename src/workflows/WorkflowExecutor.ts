/**
 * AgentFlow Pro - Workflow Executor (Real Execution Engine)
 */

import { Orchestrator } from "@/orchestrator/Orchestrator";
import { getOrchestrator } from "@/lib/orchestrator-factory";
import { evaluateCondition as evaluateConditionFromLib, getNextBranch } from "./conditions";
import type { ConditionOperator } from "./nodes";

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label?: string;
    type?: string;
    agentType?: string;
    operator?: string;
    operandA?: string;
    operandB?: string;
    field?: string;
    value?: unknown;
    [key: string]: unknown;
  };
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ExecutionResult {
  nodeId: string;
  status: "success" | "error" | "running";
  output?: unknown;
  error?: string;
  timestamp: string;
}

export interface ExecutionProgress {
  workflowId: string;
  status: "idle" | "running" | "completed" | "error";
  currentStep: number;
  totalSteps: number;
  currentAgent: string | null;
  results: ExecutionResult[];
  errors: Array<{ agent: string; message: string }>;
}

export class WorkflowExecutor {
  private orchestrator: Orchestrator;

  constructor(
    userApiKeysOrOrchestrator?: Record<string, string> | Orchestrator,
    orchestrator?: Orchestrator
  ) {
    if (orchestrator instanceof Orchestrator) {
      this.orchestrator = orchestrator;
    } else if (userApiKeysOrOrchestrator instanceof Orchestrator) {
      this.orchestrator = userApiKeysOrOrchestrator;
    } else {
      this.orchestrator = getOrchestrator(
        userApiKeysOrOrchestrator as Record<string, string> | undefined
      );
    }
  }

  async execute(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    initialContext: Record<string, unknown> = {}
  ): Promise<ExecutionProgress> {
    const progress: ExecutionProgress = {
      workflowId: `wf-${Date.now()}`,
      status: "running",
      currentStep: 0,
      totalSteps: nodes.length,
      currentAgent: null,
      results: [],
      errors: [],
    };

    try {
      const triggerNode = nodes.find(
        (n) => getNodeType(n) === "Trigger"
      );
      if (!triggerNode) {
        throw new Error("No trigger node found");
      }

      let currentNode: WorkflowNode | undefined = triggerNode;
      const visited = new Set<string>();
      const context: Record<string, unknown> = { ...initialContext };
      let lastOutput: unknown = null;

      while (currentNode && !visited.has(currentNode.id)) {
        visited.add(currentNode.id);
        progress.currentStep++;
        progress.currentAgent =
          (currentNode.data?.label as string) ?? currentNode.data?.type ?? currentNode.id;

        const result = await this.executeNode(currentNode, lastOutput, context);
        progress.results.push(result);

        if (result.status === "error") {
          progress.errors.push({
            agent: progress.currentAgent ?? currentNode.id,
            message: result.error ?? "Unknown error",
          });
          progress.status = "error";
          break;
        }

        lastOutput = result.output;
        if (result.output != null) {
          context[`${currentNode.id}_output`] = result.output;
        }

        const nodeType = getNodeType(currentNode);
        let nextNodeId: string | undefined;

        if (nodeType === "Condition") {
          const branchResult =
            typeof lastOutput === "object" &&
              lastOutput != null &&
              "conditionMet" in lastOutput
              ? Boolean((lastOutput as { conditionMet?: boolean }).conditionMet)
              : Boolean(lastOutput);
          const nextIds = getNextBranch(
            branchResult,
            normalizeToWorkflowNode(currentNode),
            edges
          );
          nextNodeId = nextIds[0];
        } else {
          const edge = edges.find((e) => e.source === currentNode!.id);
          nextNodeId = edge?.target;
        }

        currentNode = nextNodeId
          ? nodes.find((n) => n.id === nextNodeId)
          : undefined;
      }

      if (progress.status === "running") {
        progress.status = "completed";
      }
    } catch (error: unknown) {
      progress.status = "error";
      progress.errors.push({
        agent: "Workflow Executor",
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return progress;
  }

  private async executeNode(
    node: WorkflowNode,
    input: unknown,
    context: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const type = getNodeType(node);
    const { agentType } = node.data;

    try {
      switch (type) {
        case "Agent": {
          const normalizedAgent =
            String(agentType ?? "")
              .toLowerCase() as "research" | "content" | "code" | "deploy";
          if (
            !["research", "content", "code", "deploy"].includes(normalizedAgent)
          ) {
            throw new Error(`Unknown agent type: ${agentType}`);
          }
          const agentInput =
            (node.data?.input as Record<string, unknown>) ??
            (input != null && typeof input === "object" ? input : { input });
          const taskId = await this.orchestrator.queueTask(
            normalizedAgent,
            agentInput
          );
          const maxWait = 30000;
          const start = Date.now();
          while (Date.now() - start < maxWait) {
            const t = this.orchestrator.getTask(taskId);
            if (t?.status === "completed") {
              return {
                nodeId: node.id,
                status: "success",
                output: t.result,
                timestamp: new Date().toISOString(),
              };
            }
            if (t?.status === "failed") {
              throw new Error(t.error ?? "Agent failed");
            }
            await new Promise((r) => setTimeout(r, 100));
          }
          throw new Error("Agent execution timeout");
        }

        case "Condition": {
          const conditionMet = this.evaluateCondition(node.data, context);
          return {
            nodeId: node.id,
            status: "success",
            output: { conditionMet },
            timestamp: new Date().toISOString(),
          };
        }

        case "Action":
          return {
            nodeId: node.id,
            status: "success",
            output: {
              action: node.data?.action ?? "completed",
              params: node.data?.params,
            },
            timestamp: new Date().toISOString(),
          };

        case "Trigger":
          return {
            nodeId: node.id,
            status: "success",
            output: { triggered: true },
            timestamp: new Date().toISOString(),
          };

        default:
          throw new Error(`Unknown node type: ${type}`);
      }
    } catch (error: unknown) {
      return {
        nodeId: node.id,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private evaluateCondition(
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): boolean {
    const operator = data.operator as ConditionOperator | undefined;
    const operandA = String(
      data.operandA ?? data.field ?? ""
    );
    const operandB = String(data.operandB ?? data.value ?? "");

    if (!operator) return false;

    return evaluateConditionFromLib(
      operator,
      operandA,
      operandB,
      context as Record<string, unknown>
    );
  }
}

function getNodeType(node: WorkflowNode): string {
  const topType = (node as WorkflowNode & { type?: string }).type;
  const dataType = node.data?.type as string | undefined;
  if (topType && topType !== "workflowNode") return topType;
  if (dataType) return dataType;
  return "Action";
}

function normalizeToWorkflowNode(node: WorkflowNode): import("./types").WorkflowNode {
  return {
    id: node.id,
    type: (getNodeType(node) ||
      "Action") as "Trigger" | "Agent" | "Condition" | "Action",
    data: node.data as Record<string, unknown>,
    position: node.position,
  };
}
