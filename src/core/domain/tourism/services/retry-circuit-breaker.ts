/**
 * AgentFlow Pro - Retry Logic with Circuit Breaker
 * Resilient API calls with exponential backoff and circuit breaker pattern
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

export class MaxRetriesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaxRetriesError";
  }
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private timeout: number;

  constructor(
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
    }
  ) {
    this.timeout = config.timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
      } else {
        throw new CircuitBreakerError("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.timeout;
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "OPEN";
      logger.info("[Circuit Breaker] OPENED due to failures");
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  }
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt === config.maxRetries) {
        break;
      }

      // Add jitter
      const jitter = config.jitter ? Math.random() * 0.3 * delay : 0;
      const delayWithJitter = delay + jitter;

      logger.info(
        `[Retry] Attempt ${attempt + 1}/${config.maxRetries} failed. Retrying in ${Math.round(delayWithJitter)}ms`
      );

      await sleep(delayWithJitter);

      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw new MaxRetriesError(`Max retries exceeded: ${lastError!.message}`);
}

/**
 * Combined retry + circuit breaker
 */
export async function resilientCall<T>(
  fn: () => Promise<T>,
  options?: {
    retry?: Partial<RetryConfig>;
    circuitBreaker?: Partial<CircuitBreakerConfig>;
  }
): Promise<T> {
  const retryConfig: RetryConfig = {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    ...options?.retry,
  };

  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000,
    ...options?.circuitBreaker,
  });

  return circuitBreaker.execute(() =>
    retryWithBackoff(fn, retryConfig)
  );
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillInterval: number;
  private lastRefill: number;
  private queue: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];

  constructor(
    maxTokens: number = 100,
    refillInterval: number = 1000 // ms
  ) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Wait in queue
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillInterval);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;

      // Process queue
      while (this.tokens > 0 && this.queue.length > 0) {
        this.tokens--;
        const { resolve } = this.queue.shift()!;
        resolve();
      }
    }
  }
}

/**
 * Apply rate limiting to function
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  rateLimiter: RateLimiter
): T {
  return (async (...args: any[]) => {
    await rateLimiter.acquire();
    return fn(...args);
  }) as T;
}
