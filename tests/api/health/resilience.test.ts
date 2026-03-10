/**
 * GET /api/health/resilience - Blok B #7 verification
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { GET } from "@/app/api/health/resilience/route";

describe("GET /api/health/resilience", () => {
  it("returns 200 with retry and circuit breaker config", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.retry).toBeDefined();
    expect(json.retry.configured).toBe(true);
    expect(json.retry.paths).toEqual(
      expect.arrayContaining(["api/v1/generate", "WorkflowExecutor (agent run)"])
    );
    expect(json.retry.maxRetries).toBe(3);
    expect(json.circuitBreaker).toBeDefined();
  });
});
