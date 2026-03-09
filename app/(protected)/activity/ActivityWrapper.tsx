"use client";

import dynamic from "next/dynamic";

const ActivityClient = dynamic(
  () => import("@/app/(protected)/activity/ActivityClient").then((m) => m.ActivityClient),
  { ssr: false }
);

export function ActivityWrapper() {
  return <ActivityClient />;
}
