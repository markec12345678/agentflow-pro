/**
 * WorkflowExecutor integration tests - real agents via orchestrator-factory.
 * Uses MOCK_MODE=true so agents return mock data without API keys.
 * Run: MOCK_MODE=true npm test -- executor.integration.test
 *
 * Note: octokit is mocked so Jest can load the orchestrator (CodeAgent depends on it).
 */

jest.mock("octokit", () => ({
  Octokit: jest.fn().mockImplementation(() => ({})),
}));

describe("WorkflowExecutor (real agent integration, mock mode)", () => {
  let WorkflowExecutor: typeof import("@/workflows/WorkflowExecutor").WorkflowExecutor;

  beforeAll(async () => {
    process.env.MOCK_MODE = "true";
    const mod = await import("@/workflows/WorkflowExecutor");
    WorkflowExecutor = mod.WorkflowExecutor;
  });

  it("executes Trigger -> Research Agent with real orchestrator-factory and mock mode", async () => {
    const executor = new WorkflowExecutor();
    const nodes = [
      {
        id: "t1",
        type: "Trigger",
        data: { triggerType: "manual", label: "Start" },
        position: { x: 0, y: 0 },
      },
      {
        id: "a1",
        type: "Agent",
        data: { agentType: "research", label: "Research" },
        position: { x: 200, y: 0 },
      },
    ];
    const edges = [
      { id: "e1", source: "t1", target: "a1" },
    ];

    const progress = await executor.execute(nodes, edges);

    if (progress.status === "error") {
      throw new Error(
        `Execution failed: ${progress.errors.map((e) => e.message).join("; ")}`
      );
    }

    expect(progress.status).toBe("completed");
    expect(progress.results.length).toBe(2);
    expect(progress.results[0]?.status).toBe("success");
    expect(progress.results[0]?.nodeId).toBe("t1");
    expect(progress.results[1]?.status).toBe("success");
    expect(progress.results[1]?.nodeId).toBe("a1");

    const researchOutput = progress.results[1]?.output as {
      urls?: string[];
      scrapedData?: unknown[];
      searchResults?: unknown[];
    };
    expect(researchOutput).toBeDefined();
    expect(researchOutput.urls).toEqual(["https://example.com"]);
    expect(researchOutput.scrapedData).toEqual([
      { url: "https://example.com", markdown: "Mock Test data" },
    ]);
    expect(researchOutput.searchResults).toEqual([
      { url: "https://example.com", title: "Mock", description: "Test data" },
    ]);
  });
});
