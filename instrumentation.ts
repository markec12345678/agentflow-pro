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
      ...request,
      url: request.path ?? "/",
      method: request.method ?? "GET",
      headers: new Headers(),
    };
    Sentry.captureRequestError(error, requestInfo as Parameters<typeof Sentry.captureRequestError>[1], context);
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const err = error instanceof Error ? error : new Error(String(error));
    import("@/alerts/log-system-error")
      .then((m) => m.logSystemError(err, { path: request?.path }))
      .catch(() => { });
  }
}
