import { test, expect } from "./fixtures";

test.describe("Billing Usage", () => {
  test("usage tracking and limits", async ({ request, billing }) => {
    const res = await request.get("/api/usage", {
      headers: { "x-user-id": billing.userId },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.agentRuns).toBe("number");
    expect(typeof data.limit).toBe("number");
    expect(typeof data.canRunAgent).toBe("boolean");
    expect(data.planId).toBeDefined();
  });
});
