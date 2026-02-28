import { isMockMode, mockMode } from "@/lib/mock-mode";

describe("mock-mode", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  it("isMockMode returns true when MOCK_MODE=true", () => {
    process.env.MOCK_MODE = "true";
    process.env.OPENAI_API_KEY = "key";
    expect(isMockMode()).toBe(true);
  });

  it("isMockMode returns true when no API keys set and MOCK_MODE not true", () => {
    process.env.MOCK_MODE = "false";
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.SERPAPI_API_KEY;
    delete process.env.CONTEXT7_API_KEY;
    delete process.env.FIRECRAWL_API_KEY;
    expect(isMockMode()).toBe(true);
  });

  it("isMockMode returns false when OPENAI_API_KEY is set", () => {
    process.env.MOCK_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-xxx";
    expect(isMockMode()).toBe(false);
  });

  it("isMockMode returns false when only GEMINI_API_KEY is set", () => {
    process.env.MOCK_MODE = "false";
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = "AIza-test";
    expect(isMockMode()).toBe(false);
  });

  it("mockMode returns same as isMockMode", () => {
    process.env.MOCK_MODE = "true";
    expect(mockMode()).toBe(isMockMode());
  });
});
