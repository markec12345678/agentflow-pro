import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656",
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  environment: process.env.NODE_ENV || "development",
});
