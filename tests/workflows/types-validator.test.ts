/**
 * Workflow types and validator tests
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
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
    expect(r.errors.some((e) => e.includes("at least one node"))).toBe(true);
  });

  it("rejects Agent missing agentType", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: {}, position: { x: 100, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("missing agentType"))).toBe(true);
  });

  it("rejects Condition missing operator", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "c1", type: "Condition", data: { operandA: "x", operandB: "y" }, position: { x: 100, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "c1" }],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("missing operator"))).toBe(true);
  });

  it("accepts Condition isEmpty without operandB", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "c1", type: "Condition", data: { operator: "isEmpty", operandA: "{{x}}" }, position: { x: 100, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 200, y: 0 } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "c1" },
        { id: "e2", source: "c1", target: "a1" },
      ],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(true);
  });

  it("rejects orphan nodes", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 100, y: 0 } },
        { id: "orphan", type: "Agent", data: { agentType: "content" }, position: { x: 200, y: 100 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Orphan") && e.includes("orphan"))).toBe(true);
  });

  it("rejects cycle in workflow", () => {
    const w: Workflow = {
      id: "w1",
      name: "Test",
      nodes: [
        { id: "t1", type: "Trigger", data: {}, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 100, y: 0 } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "a1" },
        { id: "e2", source: "a1", target: "t1" },
      ],
    };
    const r = validateWorkflow(w);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("cycle"))).toBe(true);
  });
});
