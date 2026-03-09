"use client";

import dynamic from "next/dynamic";

const HabitsClient = dynamic(
  () => import("@/app/(protected)/habits/HabitsClient").then((m) => m.HabitsClient),
  { ssr: false }
);

export function HabitsWrapper() {
  return <HabitsClient />;
}
