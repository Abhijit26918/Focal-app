"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ListTodo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitForm } from "@/components/habits/HabitForm";
import type { HabitWithStats } from "@/types/habit";

export function HabitList() {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<HabitWithStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    fetch("/api/habits")
      .then((r) => r.json())
      .then((data) => setHabits(data.habits ?? []))
      .catch(() => setHabits([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Summary stats
  const totalToday = habits.filter((h) => h.completedToday).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Habits
          </h2>
          {!loading && habits.length > 0 && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {totalToday}/{habits.length} done today
              {bestStreak > 0 && ` · Best streak: ${bestStreak} 🔥`}
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Habit
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && habits.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
          <ListTodo className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-400">
            No habits yet
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Start building consistency — create your first habit!
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Habit
          </Button>
        </div>
      )}

      {/* Habit cards grid */}
      {!loading && habits.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onRefresh={refresh}
              onEdit={(h) => setEditHabit(h)}
            />
          ))}
        </div>
      )}

      {/* Create form */}
      <HabitForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

      {/* Edit form */}
      {editHabit && (
        <HabitForm
          open={!!editHabit}
          habit={editHabit}
          onClose={() => setEditHabit(null)}
          onSuccess={() => {
            setEditHabit(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
