/**
 * Workflow types and validator tests
 */

import { validateWorkflow } from "@/workflows/validator";
import type { Workflow } from "@/workflows/types";

describe("Workflow validation", () => {
  it("validates workflow with Trigger and Agent", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 100, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects workflow without Trigger", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [{ id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 0, y: 0 } }],
      edges: [],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Trigger"))).toBe(true);
  });

  it("rejects Agent with invalid agentType", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "invalid" }, position: { x: 100, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("invalid"))).toBe(true);
  });

  it("rejects Condition without operandA", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "c1", type: "Condition", data: { operator: "eq", operandB: "x" }, position: { x: 100, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "c1" }],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("operandA"))).toBe(true);
  });

  it("rejects empty workflow", () => {
    const r = validateWorkflow({
      id: "w1",
      name: "Empty",
      nodes: [],
      edges: [],
    });
    expect(r.valid).toBe(false);
  });
});
