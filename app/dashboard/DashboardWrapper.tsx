"use client";

import dynamic from "next/dynamic";

// ssr: false must live in a Client Component in Next.js 16+
const DashboardClient = dynamic(
  () => import("@/app/dashboard/DashboardClient").then((m) => m.DashboardClient),
  { ssr: false }
);

interface DashboardWrapperProps {
  userName: string;
  userAvatar: string;
}

export function DashboardWrapper({ userName, userAvatar }: DashboardWrapperProps) {
  return <DashboardClient userName={userName} userAvatar={userAvatar} />;
}
