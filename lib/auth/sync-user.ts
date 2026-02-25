import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * Syncs the current Clerk user to our database.
 * Call this on any protected server route/page to ensure the user exists in DB.
 * Returns the database user record.
 */
export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return null;
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  const dbUser = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name,
      avatar: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      avatar: clerkUser.imageUrl,
    },
  });

  return dbUser;
}
