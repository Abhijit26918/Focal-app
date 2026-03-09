"use client";

import dynamic from "next/dynamic";

const AnalyticsClient = dynamic(
  () => import("@/app/(protected)/analytics/AnalyticsClient").then((m) => m.AnalyticsClient),
  { ssr: false }
);

export function AnalyticsWrapper() {
  return <AnalyticsClient />;
}
