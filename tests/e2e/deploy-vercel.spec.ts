import { test, expect } from "./fixtures";

test.describe("Deploy Vercel", () => {
  test("deploy to Vercel flow", async ({ auth, request }) => {
    const workflow = {
      id: `wf_deploy_${Date.now()}`,
      name: "E2E Deploy Test",
      nodes: [
        { id: "t1", type: "Trigger", data: { triggerType: "manual" }, position: { x: 0, y: 0 } },
        {
          id: "d1",
          type: "Agent",
          data: {
            agentType: "deploy",
            input: { platform: "vercel", projectId: "e2e-test", action: "deploy" },
          },
          position: { x: 200, y: 0 },
        },
      ],
      edges: [{ id: "e1", source: "t1", target: "d1" }],
    };

    const res = await request.post("/api/workflows", { data: workflow });
    expect(res.ok()).toBeTruthy();

    const execRes = await request.post("/api/workflows?execute=true", { data: workflow });
    expect(execRes.ok()).toBeTruthy();
    const data = await execRes.json();
    expect(data.execution?.success).toBe(true);
  });
});
