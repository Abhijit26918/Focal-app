"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/tasks/TaskForm";
import { toast } from "sonner";

interface RecurringPattern {
  type: "daily" | "weekly" | "monthly";
  interval: number;
}

interface TaskTag {
  tagId: string;
  tag: { id: string; name: string; color: string };
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: string;
  dueDate: string | null;
  estimatedDuration?: number | null;
  tags?: TaskTag[];
  recurringPattern?: RecurringPattern | null;
}

const PRIORITY_DOT: Record<string, string> = {
  Urgent: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-blue-500",
  Low: "bg-slate-400",
};

const PRIORITY_TEXT: Record<string, string> = {
  Urgent: "text-red-600 dark:text-red-400",
  High: "text-orange-600 dark:text-orange-400",
  Medium: "text-blue-600 dark:text-blue-400",
  Low: "text-slate-500 dark:text-slate-400",
};

const STATUS_PILL: Record<string, string> = {
  ToDo: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  InProgress: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  Cancelled: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500",
};

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarViewProps {
  refreshKey: number;
  onRefresh: () => void;
}

export function CalendarView({ refreshKey, onRefresh }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Calendar grid: week starts Monday
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Recompute inside callback so deps are stable
      const ms = startOfMonth(currentMonth);
      const me = endOfMonth(currentMonth);
      const cs = startOfWeek(ms, { weekStartsOn: 1 });
      const ce = endOfWeek(me, { weekStartsOn: 1 });
      const res = await fetch(
        `/api/tasks?from=${encodeURIComponent(cs.toISOString())}&to=${encodeURIComponent(ce.toISOString())}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch {
      // Non-critical — calendar stays empty
    } finally {
      setLoading(false);
    }
  }, [currentMonth, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function getTasksForDay(day: Date): Task[] {
    return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  }

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  function handleDayClick(day: Date) {
    // Toggle selection off if clicking the already-selected day
    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day));
  }

  function openCreateForDate(date: Date) {
    setCreateDate(date);
    setCreateOpen(true);
  }

  async function handleCompleteToggle(task: Task) {
    const newStatus = task.status === "Completed" ? "ToDo" : "Completed";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(newStatus === "Completed" ? "Task completed!" : "Marked as to-do");
      fetchTasks();
      onRefresh();
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function handleDelete(task: Task) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Task deleted");
      fetchTasks();
      onRefresh();
    } catch {
      toast.error("Failed to delete task");
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── Calendar Grid ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-auto p-6">
        {/* Month navigation */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            {loading && (
              <p className="text-xs text-slate-400">Loading…</p>
            )}
          </div>

          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day column headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar day grid */}
        <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = Boolean(selectedDate && isSameDay(day, selectedDate));
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`flex min-h-[80px] flex-col gap-0.5 p-1.5 text-left transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
                aria-label={format(day, "MMMM d, yyyy")}
                aria-pressed={isSelected}
              >
                {/* Date number */}
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isTodayDate
                      ? "bg-blue-600 text-white"
                      : isSelected
                        ? "font-bold text-blue-700 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {/* Task chips — show up to 2, then overflow count */}
                <div className="flex flex-col gap-0.5">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight ${
                        task.status === "Completed"
                          ? "bg-green-50 text-green-700 line-through dark:bg-green-950/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                      title={task.title}
                    >
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="px-1 text-[10px] text-slate-400 dark:text-slate-500">
                      +{dayTasks.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day Detail Panel ── */}
      {selectedDate && (
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Panel header */}
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {format(selectedDate, "EEEE")}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {format(selectedDate, "MMMM d, yyyy")}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-0.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Close day panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Task list for selected day */}
          <div className="flex-1 overflow-y-auto p-3">
            {selectedDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No tasks due this day
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => openCreateForDate(selectedDate)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add task
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Complete toggle */}
                      <button
                        onClick={() => handleCompleteToggle(task)}
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                          task.status === "Completed"
                            ? "border-green-500 bg-green-500"
                            : "border-slate-300 hover:border-green-400 dark:border-slate-600"
                        }`}
                        aria-label={
                          task.status === "Completed" ? "Mark incomplete" : "Mark complete"
                        }
                      />

                      <div className="min-w-0 flex-1">
                        {/* Title — click to edit */}
                        <button
                          onClick={() => setEditTask(task)}
                          className={`block w-full text-left text-sm font-medium hover:underline ${
                            task.status === "Completed"
                              ? "text-slate-400 line-through dark:text-slate-500"
                              : "text-slate-900 dark:text-slate-50"
                          }`}
                        >
                          {task.title}
                        </button>

                        {/* Meta row */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-semibold ${PRIORITY_TEXT[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_PILL[task.status]}`}
                          >
                            {task.status === "InProgress" ? "In Progress" : task.status}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            {task.category}
                          </span>
                          {task.recurringPattern && (
                            <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                              <RefreshCw className="h-2.5 w-2.5" />
                              Recurring
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {task.tags.map(({ tag }) => (
                              <span
                                key={tag.id}
                                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Delete button (visible on hover) */}
                      <button
                        onClick={() => handleDelete(task)}
                        className="mt-0.5 hidden shrink-0 rounded p-0.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:block dark:text-slate-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        aria-label="Delete task"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add task footer (shown when there are tasks) */}
          {selectedDayTasks.length > 0 && (
            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => openCreateForDate(selectedDate)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add task for this day
              </Button>
            </div>
          )}
        </aside>
      )}

      {/* TaskForm for creating a task on the clicked date.
          Key changes on each new date so form remounts with fresh defaults. */}
      <TaskForm
        key={createDate ? format(createDate, "yyyy-MM-dd") : "cal-new"}
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDate(null);
        }}
        onSuccess={() => {
          fetchTasks();
          onRefresh();
        }}
        initialValues={
          createDate ? { dueDate: format(createDate, "yyyy-MM-dd") } : undefined
        }
      />

      {/* TaskForm for editing an existing task from the panel */}
      {editTask && (
        <TaskForm
          key={editTask.id}
          open={true}
          onClose={() => setEditTask(null)}
          onSuccess={() => {
            fetchTasks();
            onRefresh();
            setEditTask(null);
          }}
          initialValues={{
            id: editTask.id,
            title: editTask.title,
            description: editTask.description ?? "",
            category: editTask.category as never,
            priority: editTask.priority,
            status: editTask.status as never,
            dueDate: editTask.dueDate
              ? format(new Date(editTask.dueDate), "yyyy-MM-dd")
              : "",
            estimatedDuration: editTask.estimatedDuration?.toString() ?? "",
            tagIds: editTask.tags?.map((t) => t.tag.id) ?? [],
            recurringPattern: editTask.recurringPattern ?? null,
          }}
        />
      )}
    </div>
  );
}
