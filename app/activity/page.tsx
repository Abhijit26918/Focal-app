import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth/sync-user";
import { ActivityWrapper } from "@/app/activity/ActivityWrapper";

export default async function ActivityPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  await syncUser();

  return <ActivityWrapper />;
}
