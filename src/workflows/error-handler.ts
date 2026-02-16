/**
 * AgentFlow Pro - Error handling and retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
}

const RETRYABLE_MESSAGES = [
  "timeout",
  "network",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "fetch failed",
  "500",
  "502",
  "503",
];

export function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return RETRYABLE_MESSAGES.some((m) => msg.toLowerCase().includes(m.toLowerCase()));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 3;
  const initialDelayMs = opts.initialDelayMs ?? 1000;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || !isRetryableError(err)) throw err;
      const delay = initialDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export interface StepResult {
  nodeId: string;
  success: boolean;
  output?: unknown;
  error?: string;
}

export function wrapWithErrorHandler(
  executor: (nodeId: string, context: Record<string, unknown>) => Promise<unknown>,
  opts?: RetryOptions
): (nodeId: string, context: Record<string, unknown>) => Promise<StepResult> {
  return async (nodeId, context): Promise<StepResult> => {
    try {
      const output = await retryWithBackoff(() => executor(nodeId, context), opts);
      return { nodeId, success: true, output };
    } catch (err) {
      return {
        nodeId,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  };
}
