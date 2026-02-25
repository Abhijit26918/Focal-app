import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth/sync-user";
import { DashboardWrapper } from "@/app/dashboard/DashboardWrapper";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await syncUser();

  const name = user.firstName || user.emailAddresses[0]?.emailAddress || "there";

  return <DashboardWrapper userName={name} userAvatar={user.imageUrl} />;
}
