"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(
  () => import("@/web/components/Analytics").then((m) => ({ default: m.Analytics })),
  { ssr: false }
);

export function AnalyticsLoader() {
  return <Analytics />;
}
