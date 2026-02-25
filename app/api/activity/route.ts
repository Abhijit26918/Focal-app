import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

const PAGE_SIZE = 50;

// GET /api/activity — paginated activity feed for the current user
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("type"); // "task" | "habit" | null = all
    const cursor = searchParams.get("cursor"); // createdAt ISO string for pagination

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: dbUser.id,
        ...(entityType && { entityType }),
        ...(cursor && { createdAt: { lt: new Date(cursor) } }),
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
    });

    const hasMore = logs.length > PAGE_SIZE;
    const items = hasMore ? logs.slice(0, PAGE_SIZE) : logs;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ items, nextCursor, hasMore });
  } catch (error) {
    console.error("[GET /api/activity]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
