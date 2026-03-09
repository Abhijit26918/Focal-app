import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { dailyDigestTemplate, type EmailTask } from "@/lib/email/templates";
import type { UserPreferences } from "@/types";

/**
 * GET /api/cron/daily-digest
 *
 * Triggered by Vercel Cron every day at 07:00 UTC.
 * Sends a personalised daily digest email to each user who has opted in.
 *
 * Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` to cron
 * requests — we validate it before doing any work.
 */
export async function GET(request: NextRequest) {
  // ── Security check ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // ── Fetch opted-in users ─────────────────────────────────────────────────────
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, preferences: true },
  });

  const opted = users.filter((u) => {
    const prefs = (u.preferences as UserPreferences | null)?.notifications;
    return prefs?.emailNotifications && prefs?.dailyDigest;
  });

  let sent = 0;
  let failed = 0;

  for (const user of opted) {
    try {
      // Fetch tasks in one query, split in memory
      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ["ToDo", "InProgress"] },
          dueDate: { lte: sevenDaysAhead },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          category: true,
          dueDate: true,
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      });

      const toEmailTask = (t: (typeof tasks)[number]): EmailTask => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        category: t.category,
        dueDate: t.dueDate,
      });

      const overdueTasks = tasks
        .filter((t) => t.dueDate && t.dueDate < startOfToday)
        .map(toEmailTask);

      const todayTasks = tasks
        .filter(
          (t) =>
            t.dueDate &&
            t.dueDate >= startOfToday &&
            t.dueDate <= endOfToday,
        )
        .map(toEmailTask);

      const upcomingTasks = tasks
        .filter((t) => t.dueDate && t.dueDate > endOfToday)
        .slice(0, 5) // Cap upcoming at 5 to keep email tidy
        .map(toEmailTask);

      // Skip email if there's literally nothing to report
      if (
        overdueTasks.length === 0 &&
        todayTasks.length === 0 &&
        upcomingTasks.length === 0
      ) {
        continue;
      }

      const { subject, html } = dailyDigestTemplate({
        userName: user.name ?? user.email.split("@")[0],
        overdueTasks,
        todayTasks,
        upcomingTasks,
        date: now,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject,
        html,
      });

      // Record the notification in the database
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "DailyDigest",
          message: `Daily digest sent — ${overdueTasks.length} overdue, ${todayTasks.length} due today`,
          scheduledFor: now,
          sentAt: now,
        },
      });

      sent++;
    } catch (err) {
      console.error(`[cron/daily-digest] Failed for user ${user.id}:`, err);
      failed++;
    }
  }

  console.log(`[cron/daily-digest] sent=${sent} failed=${failed} skipped=${opted.length - sent - failed}`);
  return NextResponse.json({ sent, failed });
}
