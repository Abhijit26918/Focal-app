import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/notifications — list the current user's notifications (unread by default)
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(showAll ? {} : { read: false }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        task: { select: { id: true, title: true, priority: true, category: true } },
      },
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
