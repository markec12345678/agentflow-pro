/**
 * Code Agent tests
 */

jest.mock("../../src/agents/code/github-client", () => ({
  getFileContents: jest.fn(),
  getDefaultBranchSha: jest.fn(),
  pushFiles: jest.fn(),
  createPullRequest: jest.fn(),
}));

import { createCodeAgent } from "../../src/agents/code/CodeAgent";

describe("CodeAgent", () => {
  it("creates agent with correct type and name", () => {
    const agent = createCodeAgent();
    expect(agent.type).toBe("code");
    expect(agent.name).toBe("Code Agent");
  });

  it("returns structured output with files and suggestions", async () => {
    const agent = createCodeAgent();
    const result = await agent.execute({});
    expect(result).toHaveProperty("files");
    expect(result).toHaveProperty("suggestions");
    expect(Array.isArray(result.files)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});
