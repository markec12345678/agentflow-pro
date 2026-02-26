import {
  WORKFLOW_APPS,
  getWorkflowAppById,
  CATEGORY_LABELS,
} from "@/data/workflow-apps";

describe("workflow-apps", () => {
  it("WORKFLOW_APPS has entries", () => {
    expect(WORKFLOW_APPS.length).toBeGreaterThan(0);
    expect(WORKFLOW_APPS[0]).toHaveProperty("id", "name", "category");
  });

  it("getWorkflowAppById returns app for valid id", () => {
    const first = WORKFLOW_APPS[0];
    expect(getWorkflowAppById(first.id)).toEqual(first);
  });

  it("getWorkflowAppById returns undefined for invalid id", () => {
    expect(getWorkflowAppById("invalid-id")).toBeUndefined();
  });

  it("CATEGORY_LABELS has expected keys", () => {
    expect(CATEGORY_LABELS).toHaveProperty("content");
    expect(CATEGORY_LABELS).toHaveProperty("research");
  });
});
