import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { deadlineReminderTemplate } from "@/lib/email/templates";
import type { UserPreferences } from "@/types";

/**
 * GET /api/cron/deadline-reminders
 *
 * Triggered by Vercel Cron every hour.
 * Sends a deadline-reminder email for tasks due within the next 2 hours
 * that haven't been reminded yet during this window.
 *
 * De-duplication strategy: before sending, we check whether a Deadline
 * notification for this task was already sent in the last 90 minutes —
 * if so, we skip it to avoid spamming.
 */
export async function GET(request: NextRequest) {
  // ── Security check ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours ahead
  const dedupeWindow = new Date(now.getTime() - 90 * 60 * 1000); // 90 min ago

  // ── Find tasks due in the next 2 hours ────────────────────────────────────
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["ToDo", "InProgress"] },
      dueDate: { gte: now, lte: windowEnd },
    },
    select: {
      id: true,
      title: true,
      priority: true,
      category: true,
      dueDate: true,
      userId: true,
      user: {
        select: { id: true, email: true, name: true, preferences: true },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const task of tasks) {
    const prefs = (
      task.user.preferences as UserPreferences | null
    )?.notifications;

    // Skip users who haven't opted in
    if (!prefs?.emailNotifications || !prefs?.deadlineReminders) {
      skipped++;
      continue;
    }

    // De-duplicate: skip if we already sent a Deadline notification for this
    // task within the last 90 minutes
    const recent = await prisma.notification.findFirst({
      where: {
        userId: task.userId,
        taskId: task.id,
        type: "Deadline",
        sentAt: { gte: dedupeWindow },
      },
    });

    if (recent) {
      skipped++;
      continue;
    }

    try {
      const minutesUntilDue = Math.round(
        (task.dueDate!.getTime() - now.getTime()) / 60_000,
      );

      const { subject, html } = deadlineReminderTemplate({
        userName: task.user.name ?? task.user.email.split("@")[0],
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate,
        },
        minutesUntilDue,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: task.user.email,
        subject,
        html,
      });

      await prisma.notification.create({
        data: {
          userId: task.userId,
          taskId: task.id,
          type: "Deadline",
          message: `Deadline reminder sent — "${task.title}" due in ${minutesUntilDue} minutes`,
          scheduledFor: task.dueDate!,
          sentAt: now,
        },
      });

      sent++;
    } catch (err) {
      console.error(
        `[cron/deadline-reminders] Failed for task ${task.id}:`,
        err,
      );
      failed++;
    }
  }

  console.log(
    `[cron/deadline-reminders] sent=${sent} skipped=${skipped} failed=${failed}`,
  );
  return NextResponse.json({ sent, skipped, failed });
}
