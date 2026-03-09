"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  AlertCircle,
  Clock,
  X,
  CheckCircle,
  BellOff,
  Mail,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useTaskNotifications,
  type NotificationTask,
} from "@/hooks/useTaskNotifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────────────────────────

interface DbNotification {
  id: string;
  type: "Reminder" | "DailyDigest" | "Deadline" | "Suggestion";
  message: string;
  scheduledFor: string;
  sentAt: string | null;
  read: boolean;
  createdAt: string;
  task: { id: string; title: string; priority: string; category: string } | null;
}

// ── Priority colours ────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: "text-red-600 dark:text-red-400",
  High: "text-orange-600 dark:text-orange-400",
  Medium: "text-blue-600 dark:text-blue-400",
  Low: "text-slate-500 dark:text-slate-400",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function TaskRow({
  task,
  icon,
}: {
  task: NotificationTask;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
          {task.title}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {task.dueDate
            ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
            : "No due date"}{" "}
          ·{" "}
          <span className={PRIORITY_COLOR[task.priority]}>{task.priority}</span>{" "}
          · {task.category}
        </p>
      </div>
    </div>
  );
}

function DbNotificationRow({
  notification,
  onDismiss,
}: {
  notification: DbNotification;
  onDismiss: (id: string) => void;
}) {
  const icon =
    notification.type === "Deadline" || notification.type === "Reminder" ? (
      <Clock className="h-3.5 w-3.5 text-amber-400" />
    ) : (
      <Mail className="h-3.5 w-3.5 text-indigo-400" />
    );

  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
          {notification.task?.title ?? notification.message}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {notification.type === "DailyDigest" ? "Daily Digest" : notification.type}{" "}
          · {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="mt-0.5 shrink-0 rounded p-0.5 text-slate-300 transition-colors hover:text-slate-500 dark:hover:text-slate-400"
        aria-label="Dismiss notification"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

type Tab = "tasks" | "email";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("tasks");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { permissionState, requestPermission, overdueTasks, todayTasks, totalCount } =
    useTaskNotifications();

  // Fetch DB notifications (email-sent records)
  const { data: dbData } = useQuery<{ notifications: DbNotification[] }>({
    queryKey: ["db-notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
    refetchInterval: 5 * 60 * 1000, // every 5 min
  });

  const dbNotifications = dbData?.notifications ?? [];
  const unreadDbCount = dbNotifications.filter((n) => !n.read).length;

  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["db-notifications"] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["db-notifications"] }),
  });

  // When email tab opens, mark all unread notifications as read
  useEffect(() => {
    if (open && tab === "email") {
      dbNotifications
        .filter((n) => !n.read)
        .forEach((n) => markReadMutation.mutate(n.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badgeCount = totalCount + unreadDbCount;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label={`Notifications — ${badgeCount} pending`}
        aria-expanded={open}
      >
        {permissionState === "denied" ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {badgeCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
            aria-hidden
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Notifications
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Close notifications"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {(["tasks", "email"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
                  tab === t
                    ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t === "tasks" ? "Tasks" : "Email"}
                {t === "tasks" && totalCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] text-red-600">
                    {totalCount}
                  </span>
                )}
                {t === "email" && unreadDbCount > 0 && (
                  <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] text-indigo-600">
                    {unreadDbCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {/* Tasks tab */}
            {tab === "tasks" && (
              <>
                {permissionState === "default" && (
                  <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Enable browser notifications to get alerts even when Focal
                      isn&apos;t active.
                    </p>
                    <button
                      onClick={() => {
                        requestPermission();
                        setOpen(false);
                      }}
                      className="mt-1 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Enable notifications →
                    </button>
                  </div>
                )}
                {permissionState === "denied" && (
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <p className="text-[11px] text-slate-500">
                      Browser notifications are blocked. Enable them in your
                      browser&apos;s site settings.
                    </p>
                  </div>
                )}

                {overdueTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 bg-red-50 px-4 py-2 dark:bg-red-950/20">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                        Overdue ({overdueTasks.length})
                      </span>
                    </div>
                    {overdueTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        icon={<AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                      />
                    ))}
                  </div>
                )}

                {todayTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-2 dark:bg-amber-950/20">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        Due Today ({todayTasks.length})
                      </span>
                    </div>
                    {todayTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        icon={<Clock className="h-3.5 w-3.5 text-amber-400" />}
                      />
                    ))}
                  </div>
                )}

                {overdueTasks.length === 0 && todayTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      All caught up!
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      No overdue or due-today tasks.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Email tab */}
            {tab === "email" && (
              <>
                {dbNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Mail className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No emails sent yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Enable email notifications in settings.
                    </p>
                  </div>
                ) : (
                  dbNotifications.map((n) => (
                    <DbNotificationRow
                      key={n.id}
                      notification={n}
                      onDismiss={(id) => dismissMutation.mutate(id)}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
            <a
              href="/dashboard?settings=notifications"
              className="text-[11px] text-slate-400 transition-colors hover:text-indigo-500 dark:hover:text-indigo-400"
            >
              Email notification settings →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
