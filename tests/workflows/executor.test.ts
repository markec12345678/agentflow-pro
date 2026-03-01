/**
 * Workflow executor tests
 */

import { executeWorkflow } from "@/workflows/executor";
import { WorkflowExecutor } from "@/workflows/WorkflowExecutor";
import { Orchestrator } from "@/orchestrator/Orchestrator";
import type { Workflow } from "@/workflows/types";

jest.mock("@/lib/orchestrator-factory", () => ({
  getOrchestrator: () => new Orchestrator(),
}));

const mockWorkflowFindUnique = jest.fn().mockResolvedValue(null);
jest.mock("@/database/schema", () => ({
  prisma: {
    workflow: { findUnique: (...args: unknown[]) => mockWorkflowFindUnique(...args) },
    workflowCheckpoint: { create: jest.fn().mockResolvedValue({ id: "cp1" }) },
  },
  PLAN_LIMITS: { starter: {}, pro: {}, enterprise: {} },
}));

describe("executeWorkflow (legacy)", () => {
  it("rejects invalid workflow", async () => {
    const w: Workflow = {
      id: "w1",
      name: "No Trigger",
      nodes: [{ id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 0, y: 0 } }],
      edges: [],
    };
    const orch = new Orchestrator();
    const result = await executeWorkflow(w, orch, {});
    expect(result.success).toBe(false);
    expect(result.output.error).toBeDefined();
  });

  it("executes linear Trigger -> Agent workflow", async () => {
    const orch = new Orchestrator();
    orch.registerAgent({
      id: "research-agent",
      type: "research",
      name: "Research Agent",
      execute: async () => ({ urls: [], scrapedData: [], searchResults: [] }),
    });

    const w: Workflow = {
      id: "w1",
      name: "Simple",
      nodes: [
        { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 200, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };

    const result = await executeWorkflow(w, orch, {});
    expect(result.success).toBe(true);
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
  });

  it("executes Trigger only", async () => {
    const orch = new Orchestrator();
    const w: Workflow = {
      id: "w1",
      name: "Trigger only",
      nodes: [{ id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } }],
      edges: [],
    };
    const result = await executeWorkflow(w, orch, {});
    expect(result.success).toBe(true);
  });
});

describe("WorkflowExecutor", () => {
  it("rejects workflow without trigger node", async () => {
    const orch = new Orchestrator();
    orch.registerAgent({
      id: "research-agent",
      type: "research",
      name: "Research Agent",
      execute: async () => ({ urls: [], scrapedData: [], searchResults: [] }),
    });
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "a1", type: "Agent", data: { agentType: "research", label: "Research" }, position: { x: 0, y: 0 } },
    ];
    const edges: { id: string; source: string; target: string }[] = [];
    const progress = await executor.execute(nodes, edges);
    expect(progress.status).toBe("error");
    expect(progress.errors.length).toBeGreaterThan(0);
    expect(progress.errors[0]?.message).toContain("No trigger node found");
  });

  it("executes linear Trigger -> Agent workflow", async () => {
    const orch = new Orchestrator();
    orch.registerAgent({
      id: "research-agent",
      type: "research",
      name: "Research Agent",
      execute: async () => ({ urls: ["https://example.com"], scrapedData: [], searchResults: [] }),
    });
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual", label: "Start" }, position: { x: 0, y: 0 } },
      { id: "a1", type: "Agent", data: { agentType: "research", label: "Research" }, position: { x: 200, y: 0 } },
    ];
    const edges = [{ id: "e1", source: "t1", target: "a1" }];
    const progress = await executor.execute(nodes, edges);
    if (progress.status === "error") {
      throw new Error(
        `Execution failed: ${progress.errors.map((e) => e.message).join("; ")}`
      );
    }
    expect(progress.status).toBe("completed");
    expect(progress.results.length).toBe(2);
    expect(progress.results[0]?.status).toBe("success");
    expect(progress.results[0]?.nodeId).toBe("t1");
    expect(progress.results[1]?.status).toBe("success");
    expect(progress.results[1]?.nodeId).toBe("a1");
    expect(progress.results[1]?.output).toEqual({ urls: ["https://example.com"], scrapedData: [], searchResults: [] });
  });

  it("executes Trigger only", async () => {
    const orch = new Orchestrator();
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual", label: "Start" }, position: { x: 0, y: 0 } },
    ];
    const edges: { id: string; source: string; target: string }[] = [];
    const progress = await executor.execute(nodes, edges);
    expect(progress.status).toBe("completed");
    expect(progress.results.length).toBe(1);
    expect(progress.results[0]?.status).toBe("success");
    expect(progress.results[0]?.output).toEqual({ triggered: true });
  });

  it("executes Trigger -> Condition (eq true) -> Agent", async () => {
    const orch = new Orchestrator();
    orch.registerAgent({
      id: "content-agent",
      type: "content",
      name: "Content Agent",
      execute: async () => ({ blog: "done", social: "", email: "", keywords: [] }),
    });
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
      { id: "c1", type: "Condition", data: { operator: "eq", operandA: "1", operandB: "1" }, position: { x: 100, y: 0 } },
      { id: "a1", type: "Agent", data: { agentType: "content" }, position: { x: 200, y: 0 } },
    ];
    const edges = [
      { id: "e1", source: "t1", target: "c1" },
      { id: "e2", source: "c1", target: "a1", sourceHandle: "true" },
    ];
    const progress = await executor.execute(nodes, edges);
    expect(progress.status).toBe("completed");
    expect(progress.results.length).toBe(3);
    expect(progress.results[1]?.output).toEqual({ conditionMet: true });
    expect(progress.results[2]?.output).toEqual({ blog: "done", social: "", email: "", keywords: [] });
  });

  it("executes Trigger -> Condition (eq false) -> takes false branch", async () => {
    const orch = new Orchestrator();
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
      { id: "c1", type: "Condition", data: { operator: "eq", operandA: "1", operandB: "2" }, position: { x: 100, y: 0 } },
    ];
    const edges = [
      { id: "e1", source: "t1", target: "c1" },
      { id: "e2", source: "c1", target: "a1", sourceHandle: "true" },
      { id: "e3", source: "c1", target: "a2", sourceHandle: "false" },
    ];
    const progress = await executor.execute(nodes, edges);
    expect(progress.status).toBe("completed");
    expect(progress.results[1]?.output).toEqual({ conditionMet: false });
    expect(progress.results.length).toBe(2);
  });

  it("executes Trigger -> Action node", async () => {
    const orch = new Orchestrator();
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
      { id: "ac1", type: "Action", data: { action: "log", params: { msg: "hi" } }, position: { x: 100, y: 0 } },
    ];
    const edges = [{ id: "e1", source: "t1", target: "ac1" }];
    const progress = await executor.execute(nodes, edges);
    expect(progress.status).toBe("completed");
    expect(progress.results[1]?.output).toEqual({ action: "log", params: { msg: "hi" } });
  });

  it("reports error when Agent node fails", async () => {
    const orch = new Orchestrator();
    orch.registerAgent({
      id: "fail-agent",
      type: "research",
      name: "Fail Agent",
      execute: async () => {
        throw new Error("Agent crashed");
      },
    });
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
      { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 200, y: 0 } },
    ];
    const edges = [{ id: "e1", source: "t1", target: "a1" }];
    const progress = await executor.execute(nodes, edges);
    expect(progress.status).toBe("error");
    expect(progress.errors.length).toBeGreaterThan(0);
    expect(progress.errors[0]?.message).toContain("Agent crashed");
  });

  it("executes with startFromNodeId option", async () => {
    const orch = new Orchestrator();
    orch.registerAgent({
      id: "content-agent",
      type: "content",
      name: "Content Agent",
      execute: async () => ({ blog: "from checkpoint", keywords: [] }),
    });
    const executor = new WorkflowExecutor(orch);
    const nodes = [
      { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
      { id: "a1", type: "Agent", data: { agentType: "content" }, position: { x: 200, y: 0 } },
    ];
    const edges = [{ id: "e1", source: "t1", target: "a1" }];
    const progress = await executor.execute(nodes, edges, {}, "wf-1", undefined, {
      startFromNodeId: "a1",
      initialContext: {},
    });
    expect(progress.status).toBe("completed");
    expect(progress.results.length).toBe(1);
    expect(progress.results[0]?.nodeId).toBe("a1");
  });

  it("throws when startFromNodeId not found", async () => {
    const orch = new Orchestrator();
    const executor = new WorkflowExecutor(orch);
    const nodes = [{ id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } }];
    const edges: { id: string; source: string; target: string }[] = [];
    const progress = await executor.execute(nodes, edges, {}, "wf-1", undefined, {
      startFromNodeId: "missing",
    });
    expect(progress.status).toBe("error");
    expect(progress.errors[0]?.message).toContain("Start node missing not found");
  });
});
