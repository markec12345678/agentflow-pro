import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercel: no standalone (better asset serving). Docker: use standalone.
  ...(process.env.VERCEL
    ? {}
    : { output: "standalone" as const, outputFileTracingRoot: path.resolve(process.cwd()) }),
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
