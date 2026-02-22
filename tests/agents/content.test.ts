/**
 * Content Agent tests
 */

import { createContentAgent } from "../../src/agents/content/ContentAgent";

describe("ContentAgent", () => {
  it("creates agent with correct type and name", () => {
    const agent = createContentAgent();
    expect(agent.type).toBe("content");
    expect(agent.name).toBe("Content Agent");
  });

  it("returns structured output for empty input", async () => {
    const agent = createContentAgent();
    const result = (await agent.execute({})) as { blog?: string; social?: string; email?: string; keywords?: unknown[] };
    expect(result).toHaveProperty("blog");
    expect(result).toHaveProperty("social");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("keywords");
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(typeof result.blog).toBe("string");
  });
});
