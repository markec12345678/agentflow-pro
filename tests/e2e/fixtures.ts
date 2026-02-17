/**
 * E2E Shared Fixtures
 */
import { test as base, expect } from "@playwright/test";

const E2E_USER = { email: "e2e@test.com", password: "e2e-secret" };
const E2E_USER_ID = "e2e-user-1";

export const test = base.extend<{
  auth: void;
  workflow: { id: string; name: string };
  billing: { userId: string };
}>({
  auth: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(E2E_USER.email);
    await page.getByLabel(/password/i).fill(E2E_USER.password);
    await page.getByRole("button", { name: /login|sign in/i }).click();
    await page.waitForURL("/**");
    await page.context().addInitScript((userId: string) => {
      (window as unknown as { __e2eUserId?: string }).__e2eUserId = userId;
    }, E2E_USER_ID);
    await use();
  },

  workflow: async ({ request }, use) => {
    const w = {
      id: `wf_e2e_${Date.now()}`,
      name: "E2E Test Workflow",
      nodes: [
        { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
        { id: "a1", type: "Agent", data: { agentType: "research" }, position: { x: 200, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };
    const res = await request.post("/api/workflows", { data: w });
    if (!res.ok) throw new Error(`Workflow create failed: ${await res.text()}`);
    const body = await res.json();
    await use({ id: body.id ?? w.id, name: body.name ?? w.name });
  },

  billing: async ({ }, use) => {
    await use({ userId: E2E_USER_ID });
  },
});

export { expect };
