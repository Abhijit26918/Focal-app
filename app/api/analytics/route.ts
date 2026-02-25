import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { format, subDays } from "date-fns";

// GET /api/analytics — aggregated productivity data
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const uid = dbUser.id;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const yearAgo = subDays(now, 364);

    const [allTasks, recentCompleted, yearCompleted] = await Promise.all([
      // All tasks (non-cancelled)
      prisma.task.findMany({
        where: { userId: uid, status: { not: "Cancelled" } },
        select: { category: true, priority: true, status: true, completedAt: true, createdAt: true },
      }),
      // Completed in last 30 days (for trend chart)
      prisma.task.findMany({
        where: { userId: uid, status: "Completed", completedAt: { gte: thirtyDaysAgo } },
        select: { completedAt: true },
        orderBy: { completedAt: "asc" },
      }),
      // Completed in last 365 days (for heatmap)
      prisma.task.findMany({
        where: { userId: uid, status: "Completed", completedAt: { gte: yearAgo } },
        select: { completedAt: true },
      }),
    ]);

    // Tasks by category
    const categoryMap: Record<string, { total: number; completed: number }> = {};
    for (const t of allTasks) {
      if (!categoryMap[t.category]) categoryMap[t.category] = { total: 0, completed: 0 };
      categoryMap[t.category].total++;
      if (t.status === "Completed") categoryMap[t.category].completed++;
    }
    const byCategory = Object.entries(categoryMap).map(([name, v]) => ({
      name: name.replace(/([A-Z])/g, " $1").trim(), // "DataScience" → "Data Science"
      total: v.total,
      completed: v.completed,
      active: v.total - v.completed,
    }));

    // Tasks by priority
    const priorityMap: Record<string, number> = {};
    for (const t of allTasks) {
      priorityMap[t.priority] = (priorityMap[t.priority] ?? 0) + 1;
    }
    const byPriority = ["Urgent", "High", "Medium", "Low"].map((p) => ({
      name: p,
      value: priorityMap[p] ?? 0,
    }));

    // Tasks by status
    const statusMap: Record<string, number> = {};
    for (const t of allTasks) {
      statusMap[t.status] = (statusMap[t.status] ?? 0) + 1;
    }
    const byStatus = [
      { name: "To Do", value: statusMap["ToDo"] ?? 0, color: "#94a3b8" },
      { name: "In Progress", value: statusMap["InProgress"] ?? 0, color: "#3b82f6" },
      { name: "Completed", value: statusMap["Completed"] ?? 0, color: "#22c55e" },
    ].filter((s) => s.value > 0);

    // Completion trend — group by day for last 30 days
    const trendMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap[d.toISOString().split("T")[0]] = 0;
    }
    for (const t of recentCompleted) {
      if (t.completedAt) {
        const day = t.completedAt.toISOString().split("T")[0];
        if (day in trendMap) trendMap[day]++;
      }
    }
    const completionTrend = Object.entries(trendMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completed: count,
    }));

    // Heatmap — daily completion counts keyed by "yyyy-MM-dd"
    const heatmap: Record<string, number> = {};
    for (const t of yearCompleted) {
      if (t.completedAt) {
        const day = format(t.completedAt, "yyyy-MM-dd");
        heatmap[day] = (heatmap[day] ?? 0) + 1;
      }
    }

    // Summary numbers
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "Completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      summary: { total, completed, active: total - completed, completionRate },
      byCategory,
      byPriority,
      byStatus,
      completionTrend,
      heatmap,
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
