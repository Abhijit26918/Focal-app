"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { Flame, Check, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FREQUENCY_LABELS, type HabitWithStats } from "@/types/habit";

// Category color map (same palette used in tasks)
const CATEGORY_COLORS: Record<string, string> = {
  DataScience: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Entrepreneurship: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  AIResearch: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Fitness: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Studies: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Opportunities: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Personal: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

interface HabitCardProps {
  habit: HabitWithStats;
  onRefresh: () => void;
  onEdit: (habit: HabitWithStats) => void;
}

export function HabitCard({ habit, onRefresh, onEdit }: HabitCardProps) {
  const [optimisticDone, setOptimisticDone] = useState(habit.completedToday);
  const [loading, setLoading] = useState(false);

  // Build the last 14 days grid (oldest → today)
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(today, 13 - i);
    return format(d, "yyyy-MM-dd");
  });

  const completionSet = new Set(habit.completionDates);

  async function toggleToday() {
    const newDone = !optimisticDone;
    setOptimisticDone(newDone);
    setLoading(true);

    const todayStr = format(today, "yyyy-MM-dd");
    try {
      if (newDone) {
        const res = await fetch(`/api/habits/${habit.id}/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: todayStr }),
        });
        if (!res.ok) throw new Error();
        toast.success(`${habit.name} — marked complete!`);
      } else {
        const res = await fetch(
          `/api/habits/${habit.id}/completions?date=${todayStr}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error();
        toast.success(`${habit.name} — unmarked`);
      }
      onRefresh();
    } catch {
      setOptimisticDone(!newDone); // revert
      toast.error("Failed to update habit");
    } finally {
      setLoading(false);
    }
  }

  async function deleteHabit() {
    if (!confirm(`Delete "${habit.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/habits/${habit.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Habit deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete habit");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Top row: color dot + name + streak */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Color indicator */}
          <span
            className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-slate-50">
              {habit.name}
            </p>
            {habit.description && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Streak badge */}
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
          <Flame className="h-3 w-3" />
          {habit.streak}
        </div>
      </div>

      {/* Category + frequency */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="secondary"
          className={`text-[10px] font-medium ${CATEGORY_COLORS[habit.category] ?? ""}`}
        >
          {habit.category}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {FREQUENCY_LABELS[habit.targetFrequency] ?? habit.targetFrequency}
        </Badge>
      </div>

      {/* 14-day mini heatmap */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Last 14 days
        </p>
        <div className="flex gap-1">
          {days.map((d) => {
            const done = completionSet.has(d) || (d === format(today, "yyyy-MM-dd") && optimisticDone);
            return (
              <div
                key={d}
                title={d}
                className={`h-4 w-4 rounded-sm transition-colors ${
                  done
                    ? "opacity-90"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
                style={done ? { backgroundColor: habit.color } : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Complete today toggle */}
        <button
          onClick={toggleToday}
          disabled={loading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors ${
            optimisticDone
              ? "border-transparent bg-emerald-500 text-white hover:bg-emerald-600"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
          aria-label={optimisticDone ? "Unmark today" : "Mark done today"}
        >
          <Check className="h-4 w-4" />
          {optimisticDone ? "Done today!" : "Mark done"}
        </button>

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onEdit(habit)}
          aria-label="Edit habit"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500"
          onClick={deleteHabit}
          aria-label="Delete habit"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
