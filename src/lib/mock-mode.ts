/**
 * AgentFlow Pro - Mock Mode for Development
 * When MOCK_MODE=true, agents return mock data without API calls.
 * Auto-enables when no key API keys are set (dev without credentials).
 */

function hasRequiredApiKeys(): boolean {
  const keys = [
    process.env.SERPAPI_API_KEY,
    process.env.CONTEXT7_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.FIRECRAWL_API_KEY,
  ];
  return keys.some((k) => k && k.length > 0);
}

export const mockMode =
  process.env.MOCK_MODE === "true" || !hasRequiredApiKeys();
