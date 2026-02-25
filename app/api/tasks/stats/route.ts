import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

// GET /api/tasks/stats — aggregated counts for the dashboard header
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [total, completed, inProgress, todayDue, overdue] = await Promise.all([
      prisma.task.count({
        where: { userId: dbUser.id, status: { not: "Cancelled" } },
      }),
      prisma.task.count({
        where: { userId: dbUser.id, status: "Completed" },
      }),
      prisma.task.count({
        where: { userId: dbUser.id, status: "InProgress" },
      }),
      prisma.task.count({
        where: {
          userId: dbUser.id,
          status: { notIn: ["Completed", "Cancelled"] },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.task.count({
        where: {
          userId: dbUser.id,
          status: { notIn: ["Completed", "Cancelled"] },
          dueDate: { lt: todayStart },
        },
      }),
    ]);

    return NextResponse.json({ total, completed, inProgress, todayDue, overdue });
  } catch (error) {
    console.error("[GET /api/tasks/stats]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
