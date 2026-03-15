import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    "https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay
  replaysSessionSampleRate: process.env.NODE_ENV === "development" ? 0 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.SENTRY_RELEASE || "1.0.0",

  // Skip OpenTelemetry in development
  skipOpenTelemetrySetup: process.env.NODE_ENV === "development",
});
