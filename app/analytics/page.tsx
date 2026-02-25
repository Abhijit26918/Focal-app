import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth/sync-user";
import { AnalyticsWrapper } from "@/app/analytics/AnalyticsWrapper";

export default async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  await syncUser();

  return <AnalyticsWrapper />;
}
