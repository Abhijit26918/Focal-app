/**
 * Plain-HTML email templates for Focal notifications.
 * No external deps — just template strings so they work in any Node environment.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const BRAND_COLOR = "#0f172a"; // slate-950
const ACCENT_COLOR = "#6366f1"; // indigo-500

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: ${BRAND_COLOR}; padding: 24px 32px; }
    .header-logo { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; text-decoration: none; }
    .header-logo span { color: ${ACCENT_COLOR}; }
    .content { padding: 32px; }
    h1 { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #0f172a; }
    .subtitle { margin: 0 0 24px; font-size: 14px; color: #64748b; }
    .section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin: 24px 0 8px; }
    .task-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: block; }
    .task-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 4px; }
    .task-meta { font-size: 12px; color: #94a3b8; margin: 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 4px; }
    .badge-urgent { background: #fef2f2; color: #dc2626; }
    .badge-high   { background: #fff7ed; color: #ea580c; }
    .badge-medium { background: #eff6ff; color: #2563eb; }
    .badge-low    { background: #f8fafc; color: #64748b; }
    .badge-overdue { background: #fef2f2; color: #dc2626; }
    .cta { display: inline-block; margin-top: 24px; padding: 12px 24px; background: ${ACCENT_COLOR}; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
    .footer { border-top: 1px solid #f1f5f9; padding: 20px 32px; font-size: 12px; color: #94a3b8; }
    .footer a { color: #94a3b8; }
    .empty { text-align: center; padding: 24px 0; font-size: 14px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a class="header-logo" href="https://focaltasks.app">Focal<span>.</span></a>
    </div>
    <div class="content">
      ${body}
      <a href="https://focaltasks.app/dashboard" class="cta">Open Dashboard →</a>
    </div>
    <div class="footer">
      You're receiving this because you enabled email notifications in Focal.<br/>
      <a href="https://focaltasks.app/dashboard">Manage preferences</a>
    </div>
  </div>
</body>
</html>`;
}

function priorityBadge(priority: string): string {
  const cls =
    priority === "Urgent"
      ? "badge-urgent"
      : priority === "High"
        ? "badge-high"
        : priority === "Medium"
          ? "badge-medium"
          : "badge-low";
  return `<span class="badge ${cls}">${priority}</span>`;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Task shape used by templates
// ---------------------------------------------------------------------------

export interface EmailTask {
  id: string;
  title: string;
  priority: string;
  category: string;
  dueDate: Date | string | null;
}

// ---------------------------------------------------------------------------
// Daily Digest
// ---------------------------------------------------------------------------

export interface DailyDigestData {
  userName: string;
  overdueTasks: EmailTask[];
  todayTasks: EmailTask[];
  upcomingTasks: EmailTask[]; // due in next 7 days
  date: Date;
}

export function dailyDigestTemplate(data: DailyDigestData): {
  subject: string;
  html: string;
} {
  const dateStr = data.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const totalPending = data.overdueTasks.length + data.todayTasks.length;

  function taskList(tasks: EmailTask[], showOverdueBadge = false): string {
    if (tasks.length === 0)
      return '<p class="empty">Nothing here — enjoy the clear slate! 🎉</p>';
    return tasks
      .map(
        (t) => `
      <div class="task-card">
        <p class="task-title">${t.title}</p>
        <p class="task-meta">
          ${priorityBadge(t.priority)}
          ${showOverdueBadge ? '<span class="badge badge-overdue">Overdue</span>' : ""}
          <span>${t.category}</span>
          ${t.dueDate ? ` · Due ${formatDate(t.dueDate)}` : ""}
        </p>
      </div>`,
      )
      .join("");
  }

  const body = `
    <h1>Good morning, ${data.userName}!</h1>
    <p class="subtitle">${dateStr} · ${totalPending > 0 ? `${totalPending} task${totalPending !== 1 ? "s" : ""} need your attention` : "You're all caught up!"}</p>

    ${
      data.overdueTasks.length > 0
        ? `<p class="section-label">⚠ Overdue (${data.overdueTasks.length})</p>${taskList(data.overdueTasks, true)}`
        : ""
    }

    <p class="section-label">📅 Due Today (${data.todayTasks.length})</p>
    ${taskList(data.todayTasks)}

    ${
      data.upcomingTasks.length > 0
        ? `<p class="section-label">🔭 Upcoming (${data.upcomingTasks.length})</p>${taskList(data.upcomingTasks)}`
        : ""
    }
  `;

  return {
    subject: `Focal · Your daily digest — ${dateStr}`,
    html: base("Daily Digest", body),
  };
}

// ---------------------------------------------------------------------------
// Deadline Reminder
// ---------------------------------------------------------------------------

export interface DeadlineReminderData {
  userName: string;
  task: EmailTask;
  minutesUntilDue: number;
}

export function deadlineReminderTemplate(data: DeadlineReminderData): {
  subject: string;
  html: string;
} {
  const timeLabel =
    data.minutesUntilDue <= 60
      ? `${data.minutesUntilDue} minute${data.minutesUntilDue !== 1 ? "s" : ""}`
      : `${Math.round(data.minutesUntilDue / 60)} hour${Math.round(data.minutesUntilDue / 60) !== 1 ? "s" : ""}`;

  const body = `
    <h1>⏰ Deadline reminder</h1>
    <p class="subtitle">Hey ${data.userName}, this task is due in <strong>${timeLabel}</strong>.</p>

    <div class="task-card">
      <p class="task-title">${data.task.title}</p>
      <p class="task-meta">
        ${priorityBadge(data.task.priority)}
        <span>${data.task.category}</span>
        ${data.task.dueDate ? ` · Due ${formatDate(data.task.dueDate)}` : ""}
      </p>
    </div>
  `;

  return {
    subject: `Focal · Deadline in ${timeLabel}: "${data.task.title}"`,
    html: base("Deadline Reminder", body),
  };
}
