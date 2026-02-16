/**
 * Research Agent tests
 */

import { createResearchAgent } from "../../src/agents/research/ResearchAgent";

describe("ResearchAgent", () => {
  it("creates agent with correct type and name", () => {
    const agent = createResearchAgent();
    expect(agent.type).toBe("research");
    expect(agent.name).toBe("Research Agent");
  });

  it("returns structured JSON output for empty input", async () => {
    const agent = createResearchAgent();
    const result = await agent.execute({});
    expect(result).toHaveProperty("urls");
    expect(result).toHaveProperty("scrapedData");
    expect(result).toHaveProperty("searchResults");
    expect(Array.isArray(result.urls)).toBe(true);
    expect(Array.isArray(result.scrapedData)).toBe(true);
    expect(Array.isArray(result.searchResults)).toBe(true);
  });
});
