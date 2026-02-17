import { test, expect } from "./fixtures";

test.describe("Workflow Execute", () => {
  test("execute workflow with agents", async ({ page, auth, request }) => {
    const workflow = {
      id: `wf_exec_${Date.now()}`,
      name: "E2E Execute Test",
      nodes: [
        { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
        { id: "a1", type: "Action", data: { action: "log" }, position: { x: 200, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };

    const res = await request.post("/api/workflows", { data: workflow });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();

    await page.goto(`/workflows?id=${created.id}`);
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /^Execute$/ }).click();

    await expect(page.getByText(/complete|success/i)).toBeVisible({ timeout: 15000 });
  });
});
