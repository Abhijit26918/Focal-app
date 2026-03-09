import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { format, subDays, differenceInCalendarDays } from "date-fns";

// Calculate current and longest streak from an array of "yyyy-MM-dd" date strings
function calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Deduplicate and sort ascending
  const sorted = [...new Set(dates)].sort();

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const lastDate = sorted[sorted.length - 1];

  // Calculate longest streak by scanning forward
  let longestStreak = 1;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(new Date(sorted[i]), new Date(sorted[i - 1]));
    if (diff === 1) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 1;
    }
  }

  // Calculate current streak by scanning backward from today/yesterday
  let currentStreak = 0;
  const isActive = lastDate === today || lastDate === yesterday;
  if (isActive) {
    currentStreak = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      const diff = differenceInCalendarDays(new Date(sorted[i + 1]), new Date(sorted[i]));
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

// GET /api/analytics — aggregated productivity data
// Query params:
//   range: number (7 | 30 | 90) — day window for trend charts (default: 30)
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const uid = dbUser.id;

    // Parse range param — clamp to 7–90 days, default 30
    const { searchParams } = new URL(request.url);
    const range = Math.min(Math.max(parseInt(searchParams.get("range") ?? "30"), 7), 90);

    const now = new Date();
    const rangeStart = subDays(now, range - 1);
    const yearAgo = subDays(now, 364);

    const [allTasks, recentCompleted, yearCompleted, habits] = await Promise.all([
      // All non-cancelled tasks (for summary, category, priority, status breakdowns)
      prisma.task.findMany({
        where: { userId: uid, status: { not: "Cancelled" } },
        select: { category: true, priority: true, status: true, completedAt: true, createdAt: true },
      }),
      // Tasks completed within the selected range (for trend chart)
      prisma.task.findMany({
        where: { userId: uid, status: "Completed", completedAt: { gte: rangeStart } },
        select: { completedAt: true },
        orderBy: { completedAt: "asc" },
      }),
      // Tasks completed in the last 365 days (for heatmap)
      prisma.task.findMany({
        where: { userId: uid, status: "Completed", completedAt: { gte: yearAgo } },
        select: { completedAt: true },
      }),
      // All habits with their completion dates (for streaks + habit trend)
      prisma.habit.findMany({
        where: { userId: uid },
        include: {
          completions: {
            orderBy: { completedDate: "asc" },
            select: { completedDate: true },
          },
        },
      }),
    ]);

    // ── Tasks by category ──────────────────────────────────────────────────────
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

    // ── Tasks by priority ──────────────────────────────────────────────────────
    const priorityMap: Record<string, number> = {};
    for (const t of allTasks) {
      priorityMap[t.priority] = (priorityMap[t.priority] ?? 0) + 1;
    }
    const byPriority = ["Urgent", "High", "Medium", "Low"].map((p) => ({
      name: p,
      value: priorityMap[p] ?? 0,
    }));

    // ── Tasks by status ────────────────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const t of allTasks) {
      statusMap[t.status] = (statusMap[t.status] ?? 0) + 1;
    }
    const byStatus = [
      { name: "To Do", value: statusMap["ToDo"] ?? 0, color: "#94a3b8" },
      { name: "In Progress", value: statusMap["InProgress"] ?? 0, color: "#3b82f6" },
      { name: "Completed", value: statusMap["Completed"] ?? 0, color: "#22c55e" },
    ].filter((s) => s.value > 0);

    // ── Completion trend — one entry per day in the selected range ─────────────
    const trendMap: Record<string, number> = {};
    for (let i = range - 1; i >= 0; i--) {
      trendMap[format(subDays(now, i), "yyyy-MM-dd")] = 0;
    }
    for (const t of recentCompleted) {
      if (t.completedAt) {
        const day = format(t.completedAt, "yyyy-MM-dd");
        if (day in trendMap) trendMap[day]++;
      }
    }
    const completionTrend = Object.entries(trendMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completed: count,
    }));

    // ── Heatmap — daily completion counts keyed by "yyyy-MM-dd" ───────────────
    const heatmap: Record<string, number> = {};
    for (const t of yearCompleted) {
      if (t.completedAt) {
        const day = format(t.completedAt, "yyyy-MM-dd");
        heatmap[day] = (heatmap[day] ?? 0) + 1;
      }
    }

    // ── Most productive hour of day ────────────────────────────────────────────
    // Buckets all completed tasks by the hour their completedAt falls in
    const hourMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    for (const t of allTasks) {
      if (t.completedAt && t.status === "Completed") {
        hourMap[t.completedAt.getHours()]++;
      }
    }
    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      completed: hourMap[h],
    }));

    // ── Habit streaks ──────────────────────────────────────────────────────────
    const habitStreaks = habits.map((habit) => {
      const dates = habit.completions.map((c) => format(c.completedDate, "yyyy-MM-dd"));
      const { currentStreak, longestStreak } = calculateStreaks(dates);
      return {
        id: habit.id,
        name: habit.name,
        category: habit.category as string,
        icon: habit.icon,
        color: habit.color,
        currentStreak,
        longestStreak,
        totalCompletions: habit.completions.length,
        lastCompletedDate: dates[dates.length - 1] ?? null,
      };
    });

    // ── Habit completion trend — completions per day for the selected range ────
    const habitTrendMap: Record<string, number> = {};
    for (let i = range - 1; i >= 0; i--) {
      habitTrendMap[format(subDays(now, i), "yyyy-MM-dd")] = 0;
    }
    for (const habit of habits) {
      for (const c of habit.completions) {
        const day = format(c.completedDate, "yyyy-MM-dd");
        if (day in habitTrendMap) habitTrendMap[day]++;
      }
    }
    const habitTrend = Object.entries(habitTrendMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completions: count,
    }));

    // ── Summary ────────────────────────────────────────────────────────────────
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
      byHour,
      habitStreaks,
      habitTrend,
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
