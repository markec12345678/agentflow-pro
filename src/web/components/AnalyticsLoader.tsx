"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(
  () => import("@/web/components/Analytics").then((m) => ({ default: m.Analytics })),
  { ssr: false }
);

const VercelAnalytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => ({ default: m.Analytics })),
  { ssr: false }
);

export function AnalyticsLoader() {
  return (
    <>
      <Analytics />
      <VercelAnalytics />
    </>
  );
}
