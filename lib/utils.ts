import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(d);
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return due < new Date();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get priority color classes for Tailwind
 */
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:text-orange-400";
    case "medium":
      return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400";
    case "low":
      return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:text-slate-400";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

/**
 * Get status color classes for Tailwind
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400";
    case "inprogress":
      return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400";
    case "todo":
      return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:text-slate-400";
    case "cancelled":
      return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:text-gray-400";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

/**
 * Get category color classes for Tailwind
 */
export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "datascience":
      return "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:text-purple-400";
    case "entrepreneurship":
      return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-400";
    case "airesearch":
      return "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400";
    case "fitness":
      return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400";
    case "studies":
      return "text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400";
    case "opportunities":
      return "text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-950 dark:text-pink-400";
    case "personal":
      return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:text-slate-400";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}
