"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Loader2 } from "lucide-react";

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  todayDue: number;
  overdue: number;
}

interface StatsBarProps {
  refreshKey?: number;
}

export function StatsBar({ refreshKey }: StatsBarProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/tasks/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, [refreshKey]);

  if (!stats) {
    return (
      <div className="grid grid-cols-4 gap-4 border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      label: "Total Active",
      value: stats.total - stats.completed,
      icon: ListTodo,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-50 dark:bg-slate-800",
    },
    {
      label: "Due Today",
      value: stats.todayDue,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Loader2,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
      label: stats.overdue > 0 ? "Overdue" : "Completed",
      value: stats.overdue > 0 ? stats.overdue : stats.completed,
      icon: stats.overdue > 0 ? AlertTriangle : CheckCircle2,
      color:
        stats.overdue > 0
          ? "text-red-600 dark:text-red-400"
          : "text-green-600 dark:text-green-400",
      bg:
        stats.overdue > 0
          ? "bg-red-50 dark:bg-red-900/30"
          : "bg-green-50 dark:bg-green-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      {tiles.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 ${bg}`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${color}`} />
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {value}
            </p>
            <p className={`text-xs font-medium ${color}`}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
