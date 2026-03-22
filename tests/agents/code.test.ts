/**
 * Code Agent tests
 */

vi.mock("../../src/agents/code/github-client", () => ({
  getFileContents: vi.fn(),
  getDefaultBranchSha: vi.fn(),
  pushFiles: vi.fn(),
  createPullRequest: vi.fn(),
}));

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { createCodeAgent } from "../../src/agents/code/CodeAgent";

describe("CodeAgent", () => {
  it("creates agent with correct type and name", () => {
    const agent = createCodeAgent();
    expect(agent.type).toBe("code");
    expect(agent.name).toBe("Code Agent");
  });

  it("returns structured output with files and suggestions", async () => {
    const agent = createCodeAgent();
    const result = (await agent.execute({})) as { files?: unknown[]; suggestions?: unknown[] };
    expect(result).toHaveProperty("files");
    expect(result).toHaveProperty("suggestions");
    expect(Array.isArray(result.files)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});
