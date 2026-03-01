import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: unknown
): Promise<void> {
  if (typeof Sentry.captureRequestError === "function") {
    const requestInfo = {
      path: request.path ?? "/",
      url: request.path ?? "/",
      method: request.method ?? "GET",
      headers: {} as Record<string, string | string[] | undefined>,
    };
    Sentry.captureRequestError(
      error,
      requestInfo as unknown as Parameters<typeof Sentry.captureRequestError>[1],
      context as unknown as Parameters<typeof Sentry.captureRequestError>[2]
    );
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const err = error instanceof Error ? error : new Error(String(error));
    import("@/alerts/log-system-error")
      .then((m) => m.logSystemError(err, { path: request?.path }))
      .catch(() => { });
  }
}
