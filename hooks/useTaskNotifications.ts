"use client";

import { useState, useEffect, useCallback } from "react";

export interface NotificationTask {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string | null;
}

// localStorage key tracking when each task was last notified
const NOTIFIED_KEY = "tm_notified_tasks";
// Re-notify after 4 hours of silence for the same task
const NOTIFY_COOLDOWN_MS = 4 * 60 * 60 * 1000;

function getNotifiedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function shouldNotify(taskId: string): boolean {
  const map = getNotifiedMap();
  const last = map[taskId];
  return !last || Date.now() - last > NOTIFY_COOLDOWN_MS;
}

function markNotified(taskId: string) {
  const map = getNotifiedMap();
  map[taskId] = Date.now();
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors
  }
}

function sendBrowserNotification(title: string, body: string, taskId: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!shouldNotify(taskId)) return;

  // tag deduplicates: same tag replaces the previous notification
  new Notification(title, { body, icon: "/favicon.ico", tag: taskId });
  markNotified(taskId);
}

export function useTaskNotifications() {
  const [permissionState, setPermissionState] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [overdueTasks, setOverdueTasks] = useState<NotificationTask[]>([]);
  const [todayTasks, setTodayTasks] = useState<NotificationTask[]>([]);

  // Set initial permission state (must run client-side)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionState("unsupported");
    } else {
      setPermissionState(Notification.permission);
    }
  }, []);

  const fetchAndNotify = useCallback(async () => {
    try {
      const [overdueRes, todayRes] = await Promise.all([
        fetch("/api/tasks?overdue=true"),
        fetch("/api/tasks?today=true"),
      ]);

      const [overdueData, todayData] = await Promise.all([
        overdueRes.json(),
        todayRes.json(),
      ]);

      const overdue: NotificationTask[] = overdueData.tasks ?? [];
      const today: NotificationTask[] = todayData.tasks ?? [];

      setOverdueTasks(overdue);
      setTodayTasks(today);

      // System notifications for overdue tasks
      for (const task of overdue) {
        sendBrowserNotification(
          `⚠️ Overdue: ${task.title}`,
          `Category: ${task.category} · ${task.priority} priority`,
          `overdue-${task.id}`
        );
      }

      // System notifications only for Urgent/High tasks due today
      for (const task of today.filter(
        (t) => t.priority === "Urgent" || t.priority === "High"
      )) {
        sendBrowserNotification(
          `🔔 Due today: ${task.title}`,
          `${task.priority} priority · ${task.category}`,
          `today-${task.id}`
        );
      }
    } catch {
      // Non-critical — silently skip
    }
  }, []);

  // Fetch on mount and poll every 10 minutes
  useEffect(() => {
    fetchAndNotify();
    const interval = setInterval(fetchAndNotify, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAndNotify]);

  async function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    if (result === "granted") {
      // Immediately fire notifications for any pending tasks
      fetchAndNotify();
    }
  }

  return {
    permissionState,
    requestPermission,
    overdueTasks,
    todayTasks,
    overdueCount: overdueTasks.length,
    todayCount: todayTasks.length,
    totalCount: overdueTasks.length + todayTasks.length,
    refresh: fetchAndNotify,
  };
}
