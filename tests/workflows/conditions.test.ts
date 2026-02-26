/**
 * Conditions tests
 */

import {
  evaluateCondition,
  getNextBranch,
  executeParallel,
  type ExecutionContext,
} from "@/workflows/conditions";
import type { ConditionOperator } from "@/workflows/nodes";
import type { WorkflowNode, WorkflowEdge } from "@/workflows/types";

describe("evaluateCondition", () => {
  const ctx: ExecutionContext = { x: 5, foo: "hello", items: ["a", "b"] };

  it("eq returns true when equal", () => {
    expect(evaluateCondition("eq", "5", "5", {})).toBe(true);
    expect(evaluateCondition("eq", "{{x}}", "5", ctx)).toBe(true);
  });

  it("eq returns false when not equal", () => {
    expect(evaluateCondition("eq", "5", "6", {})).toBe(false);
  });

  it("ne returns true when not equal", () => {
    expect(evaluateCondition("ne", "5", "6", {})).toBe(true);
  });

  it("gt/lt work", () => {
    expect(evaluateCondition("gt", "10", "5", {})).toBe(true);
    expect(evaluateCondition("lt", "3", "5", {})).toBe(true);
  });

  it("contains works", () => {
    expect(evaluateCondition("contains", "hello world", "world", {})).toBe(true);
    expect(evaluateCondition("contains", "{{foo}}", "ell", ctx)).toBe(true);
  });

  it("isEmpty works", () => {
    expect(evaluateCondition("isEmpty", "{{missing}}", "", {})).toBe(true);
    expect(evaluateCondition("isEmpty", "{{x}}", "", ctx)).toBe(false);
    expect(evaluateCondition("isEmpty", "{{items}}", "", ctx)).toBe(false);
    expect(evaluateCondition("isEmpty", "{{emptyArr}}", "", { emptyArr: [] })).toBe(true);
    expect(evaluateCondition("isEmpty", "", "", {})).toBe(true);
  });

  it("gte/lte work", () => {
    expect(evaluateCondition("gte", "5", "5", {})).toBe(true);
    expect(evaluateCondition("lte", "3", "5", {})).toBe(true);
  });

  it("returns false for unknown operator", () => {
    expect(evaluateCondition("unknown" as ConditionOperator, "a", "b", {})).toBe(false);
  });
});

describe("getNextBranch", () => {
  const node: WorkflowNode = { id: "c1", type: "Condition", data: {}, position: { x: 0, y: 0 } };

  it("returns true branch targets when condition is true", () => {
    const edges: WorkflowEdge[] = [
      { id: "e1", source: "c1", target: "next-true", sourceHandle: "true" },
      { id: "e2", source: "c1", target: "next-false", sourceHandle: "false" },
    ];
    expect(getNextBranch(true, node, edges)).toEqual(["next-true"]);
  });

  it("returns false branch targets when condition is false", () => {
    const edges: WorkflowEdge[] = [
      { id: "e1", source: "c1", target: "next-true", sourceHandle: "true" },
      { id: "e2", source: "c1", target: "next-false", sourceHandle: "false" },
    ];
    expect(getNextBranch(false, node, edges)).toEqual(["next-false"]);
  });

  it("returns empty when no edges", () => {
    expect(getNextBranch(true, node, [])).toEqual([]);
  });

  it("falls back to first edge when no handle match", () => {
    const edges: WorkflowEdge[] = [{ id: "e1", source: "c1", target: "fallback" }];
    expect(getNextBranch(true, node, edges)).toEqual(["fallback"]);
  });
});

describe("executeParallel", () => {
  it("runs all executors in parallel", async () => {
    const results = await executeParallel(
      ["a", "b"],
      async (id) => id.toUpperCase(),
      {}
    );
    expect(results).toEqual(["A", "B"]);
  });
});
