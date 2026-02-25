"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  ArrowLeft,
  History,
  Plus,
  CheckCircle2,
  Pencil,
  Trash2,
  Flame,
  RefreshCw,
  Loader2,
  ListFilter,
} from "lucide-react";
import { FocalIcon } from "@/components/ui/focal-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityTitle: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ── Action config: icon, colour, label ───────────────────────────────────────

interface ActionConfig {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  label: (item: ActivityItem) => string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  "task.created": {
    icon: Plus,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
    label: (i) => `Created task "${i.entityTitle ?? "Untitled"}"`,
  },
  "task.completed": {
    icon: CheckCircle2,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-900/20",
    label: (i) => `Completed task "${i.entityTitle ?? "Untitled"}"`,
  },
  "task.updated": {
    icon: Pencil,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    label: (i) => `Updated task "${i.entityTitle ?? "Untitled"}"`,
  },
  "task.deleted": {
    icon: Trash2,
    colorClass: "text-red-500 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-900/20",
    label: (i) => `Deleted task "${i.entityTitle ?? "Untitled"}"`,
  },
  "task.bulk_complete": {
    icon: CheckCircle2,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-900/20",
    label: (i) => `Completed ${i.metadata?.count ?? "multiple"} tasks`,
  },
  "task.bulk_delete": {
    icon: Trash2,
    colorClass: "text-red-500 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-900/20",
    label: (i) => `Deleted ${i.metadata?.count ?? "multiple"} tasks`,
  },
  "task.bulk_setStatus": {
    icon: RefreshCw,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    label: (i) =>
      `Set ${i.metadata?.count ?? "multiple"} tasks to ${i.metadata?.status ?? "new status"}`,
  },
  "task.bulk_setCategory": {
    icon: RefreshCw,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-50 dark:bg-violet-900/20",
    label: (i) =>
      `Moved ${i.metadata?.count ?? "multiple"} tasks to ${i.metadata?.category ?? "new category"}`,
  },
  "task.bulk_setPriority": {
    icon: RefreshCw,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
    label: (i) =>
      `Set priority to ${i.metadata?.priority ?? "new priority"} for ${i.metadata?.count ?? "multiple"} tasks`,
  },
  "habit.created": {
    icon: Plus,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-900/20",
    label: (i) => `Created habit "${i.entityTitle ?? "Untitled"}"`,
  },
  "habit.completed": {
    icon: Flame,
    colorClass: "text-orange-500 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-900/20",
    label: (i) => `Completed habit "${i.entityTitle ?? "Untitled"}"`,
  },
};

const FALLBACK_CONFIG: ActionConfig = {
  icon: History,
  colorClass: "text-slate-500",
  bgClass: "bg-slate-50 dark:bg-slate-800",
  label: (i) => i.action,
};

// ── Date group label ──────────────────────────────────────────────────────────

function groupLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

function timeLabel(dateStr: string): string {
  return format(parseISO(dateStr), "h:mm a");
}

// ── Component ─────────────────────────────────────────────────────────────────

type FilterType = "all" | "task" | "habit";

export function ActivityClient() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchActivity = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      if (cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(`/api/activity?${params}`);
        const data = await res.json();
        if (isInitial) {
          setItems(data.items ?? []);
        } else {
          setItems((prev) => [...prev, ...(data.items ?? [])]);
        }
        setHasMore(data.hasMore ?? false);
        setNextCursor(data.nextCursor ?? null);
      } catch {
        // keep existing items on error
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Group items by day
  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <FocalIcon className="h-5 w-5 text-slate-900 dark:text-slate-50" />
              <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Activity
              </span>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Filter tabs */}
        <div className="mb-6 flex items-center gap-2">
          <ListFilter className="h-4 w-4 shrink-0 text-slate-400" />
          {(["all", "task", "habit"] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === t
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-700"
              }`}
            >
              {t === "all" ? "All" : t === "task" ? "Tasks" : "Habits"}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            {[1, 2].map((g) => (
              <div key={g}>
                <Skeleton className="mb-3 h-4 w-24 rounded" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <History className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              No activity yet
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Start creating tasks and habits — your activity will appear here.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && groups.length > 0 && (
          <div className="space-y-8">
            {groups.map(({ label, items: groupItems }) => (
              <div key={label}>
                {/* Day header */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Events */}
                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const cfg = ACTION_CONFIG[item.action] ?? FALLBACK_CONFIG;
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
                      >
                        {/* Icon bubble */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bgClass}`}
                        >
                          <Icon className={`h-4 w-4 ${cfg.colorClass}`} />
                        </div>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-800 dark:text-slate-200">
                            {cfg.label(item)}
                          </p>

                          {/* Metadata badges */}
                          {item.metadata && item.entityType === "task" && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.metadata.category ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-normal"
                                >
                                  {String(item.metadata.category)
                                    .replace(/([A-Z])/g, " $1")
                                    .trim()}
                                </Badge>
                              ) : null}
                              {item.metadata.priority ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-normal"
                                >
                                  {String(item.metadata.priority)}
                                </Badge>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                          {timeLabel(item.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivity(nextCursor ?? undefined)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
