"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, AlertCircle, Clock, X, CheckCircle, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTaskNotifications, type NotificationTask } from "@/hooks/useTaskNotifications";

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: "text-red-600 dark:text-red-400",
  High: "text-orange-600 dark:text-orange-400",
  Medium: "text-blue-600 dark:text-blue-400",
  Low: "text-slate-500 dark:text-slate-400",
};

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
          <span className={PRIORITY_COLOR[task.priority]}>{task.priority}</span>
          {" "}· {task.category}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    permissionState,
    requestPermission,
    overdueTasks,
    todayTasks,
    totalCount,
  } = useTaskNotifications();

  // Close when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label={`Notifications — ${totalCount} pending`}
        aria-expanded={open}
      >
        {permissionState === "denied" ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}

        {/* Badge */}
        {totalCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
            aria-hidden
          >
            {totalCount > 9 ? "9+" : totalCount}
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

          {/* Permission prompt */}
          {permissionState === "default" && (
            <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Allow browser notifications to get alerts even when TaskMaster
                isn&apos;t your active tab.
              </p>
              <button
                onClick={() => { requestPermission(); setOpen(false); }}
                className="mt-1 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
              >
                Enable notifications →
              </button>
            </div>
          )}

          {permissionState === "denied" && (
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[11px] text-slate-500">
                Browser notifications are blocked. You can enable them in your
                browser&apos;s site settings.
              </p>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {/* Overdue section */}
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
                    icon={
                      <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    }
                  />
                ))}
              </div>
            )}

            {/* Due today section */}
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

            {/* Empty state */}
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
          </div>
        </div>
      )}
    </div>
  );
}
