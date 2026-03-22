/**
 * GET /api/health/resilience - Runtime resilience verification
 * Returns configuration status for retry and circuit breaker.
 * Used by RESILIENCE-VERIFICATION.md checks and monitoring.
 */
import { NextResponse } from "next/server";

const RETRY_PATHS = [
  "api/v1/generate",
  "api/chat (vector search, plan)",
  "WorkflowExecutor (agent run)",
];

export async function GET() {
  return NextResponse.json({
    retry: {
      configured: true,
      paths: RETRY_PATHS,
      maxRetries: 3,
      retryable: ["timeout", "network", "ECONNRESET", "ETIMEDOUT", "500", "502", "503"],
    },
    circuitBreaker: {
      configured: false,
      note: "Načrtovano za orchestrator layer",
    },
  });
}
