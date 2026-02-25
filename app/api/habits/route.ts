import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { startOfDay, subDays, format } from "date-fns";
import { logActivity } from "@/lib/activity/log";

const CreateHabitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  category: z.enum([
    "DataScience",
    "Entrepreneurship",
    "AIResearch",
    "Fitness",
    "Studies",
    "Opportunities",
    "Personal",
  ]),
  targetFrequency: z.enum([
    "daily",
    "weekdays",
    "weekly",
    "2x_week",
    "3x_week",
  ]),
  icon: z.string().optional().nullable(),
  color: z.string().optional(),
});

// GET /api/habits — list habits with completion data for the last 14 days
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

    // Fetch habits with completions for the last 14 days
    const since = subDays(startOfDay(new Date()), 13);

    const habits = await prisma.habit.findMany({
      where: { userId: dbUser.id },
      include: {
        completions: {
          where: {
            completedDate: { gte: since },
          },
          orderBy: { completedDate: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // For each habit, compute today's completion status and current streak
    const today = format(new Date(), "yyyy-MM-dd");

    const enriched = habits.map((habit) => {
      const completionDates = new Set(
        habit.completions.map((c) => format(new Date(c.completedDate), "yyyy-MM-dd"))
      );
      const completedToday = completionDates.has(today);
      const streak = computeStreak(habit.targetFrequency, completionDates);

      return {
        ...habit,
        completionDates: Array.from(completionDates),
        completedToday,
        streak,
      };
    });

    return NextResponse.json({ habits: enriched });
  } catch (error) {
    console.error("[GET /api/habits]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/habits — create a new habit
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = CreateHabitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, category, targetFrequency, icon, color } = parsed.data;

    const habit = await prisma.habit.create({
      data: {
        userId: dbUser.id,
        name,
        description: description ?? null,
        category,
        targetFrequency,
        icon: icon ?? null,
        color: color ?? "#3b82f6",
      },
    });

    logActivity({
      userId: dbUser.id,
      action: "habit.created",
      entityType: "habit",
      entityId: habit.id,
      entityTitle: habit.name,
      metadata: { category: habit.category, targetFrequency: habit.targetFrequency },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/habits]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Streak computation ──────────────────────────────────────────────────────

/**
 * Compute the current streak for a habit based on its targetFrequency.
 * completionDates: Set of "yyyy-MM-dd" strings.
 */
function computeStreak(
  targetFrequency: string,
  completionDates: Set<string>
): number {
  const today = new Date();

  if (targetFrequency === "daily") {
    // Count consecutive days ending today (or yesterday if not done today)
    return countDailyStreak(completionDates, today);
  }

  if (targetFrequency === "weekdays") {
    // Count consecutive weekdays (Mon–Fri) ending today
    return countWeekdayStreak(completionDates, today);
  }

  if (targetFrequency === "weekly") {
    return countWeeklyStreak(completionDates, today, 1);
  }

  if (targetFrequency === "2x_week") {
    return countWeeklyStreak(completionDates, today, 2);
  }

  if (targetFrequency === "3x_week") {
    return countWeeklyStreak(completionDates, today, 3);
  }

  return 0;
}

function countDailyStreak(completionDates: Set<string>, today: Date): number {
  let streak = 0;
  let cursor = new Date(today);

  // If today is done, include it; otherwise start from yesterday
  const todayStr = format(cursor, "yyyy-MM-dd");
  if (!completionDates.has(todayStr)) {
    cursor = subDays(cursor, 1);
  }

  while (true) {
    const d = format(cursor, "yyyy-MM-dd");
    if (!completionDates.has(d)) break;
    streak++;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

function countWeekdayStreak(completionDates: Set<string>, today: Date): number {
  let streak = 0;
  let cursor = new Date(today);

  const todayStr = format(cursor, "yyyy-MM-dd");
  const dayOfWeek = cursor.getDay(); // 0=Sun, 6=Sat

  // Start from today or yesterday
  if (!completionDates.has(todayStr) || dayOfWeek === 0 || dayOfWeek === 6) {
    // Move to last weekday
    cursor = subDays(cursor, dayOfWeek === 0 ? 2 : dayOfWeek === 6 ? 1 : 1);
  }

  while (true) {
    const dow = cursor.getDay();
    // Skip weekends
    if (dow === 0 || dow === 6) {
      cursor = subDays(cursor, dow === 0 ? 2 : 1);
      continue;
    }
    const d = format(cursor, "yyyy-MM-dd");
    if (!completionDates.has(d)) break;
    streak++;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

function countWeeklyStreak(
  completionDates: Set<string>,
  today: Date,
  targetCount: number
): number {
  let streak = 0;
  // Get start of current week (Monday)
  let weekStart = getMonday(today);

  while (true) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Count completions in this week
    let count = 0;
    for (const d of completionDates) {
      const date = new Date(d);
      if (date >= weekStart && date <= weekEnd) {
        count++;
      }
    }

    if (count < targetCount) break;
    streak++;
    weekStart = subDays(weekStart, 7);
  }

  return streak;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
