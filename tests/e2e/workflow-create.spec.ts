import { test, expect } from "./fixtures";

test.describe("Workflow Create", () => {
  test("create workflow via visual editor", async ({ page, auth: _auth }) => {
    await page.goto("/workflows");

    const sidebar = page.locator("aside").first();
    const canvas = page.getByTestId("workflow-drop-zone");

    await sidebar.getByText("Agent").dragTo(canvas, { targetPosition: { x: 200, y: 150 } });
    await sidebar.getByText("Trigger").dragTo(canvas, { targetPosition: { x: 50, y: 150 } });

    await page.waitForTimeout(500);

    const triggerNode = page.locator('[data-id]').filter({ hasText: "Trigger" }).first();
    const agentNode = page.locator('[data-id]').filter({ hasText: "Agent" }).first();
    if ((await triggerNode.count()) > 0 && (await agentNode.count()) > 0) {
      const sourceHandle = triggerNode.locator(".react-flow__handle");
      const targetHandle = agentNode.locator(".react-flow__handle");
      if ((await sourceHandle.count()) >= 1 && (await targetHandle.count()) >= 1) {
        await sourceHandle.first().dragTo(targetHandle.first());
      }
    }

    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
  });
});
