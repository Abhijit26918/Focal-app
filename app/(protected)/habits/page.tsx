export const dynamic = "force-dynamic";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth/sync-user";
import { HabitsWrapper } from "@/app/(protected)/habits/HabitsWrapper";

export default async function HabitsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  await syncUser();

  return <HabitsWrapper />;
}
