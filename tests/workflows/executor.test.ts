/**
 * Workflow executor tests
 */

import { executeWorkflow } from "@/workflows/executor";
import { Orchestrator } from "@/orchestrator/Orchestrator";
import type { Workflow } from "@/workflows/types";

describe("Workflow executor", () => {
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
