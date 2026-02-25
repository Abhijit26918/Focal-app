"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskForm } from "@/components/tasks/TaskForm";
import { SubtaskList } from "@/components/tasks/SubtaskList";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatRecurringPattern } from "@/lib/utils/recurring";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface TaskTag {
  tag: { id: string; name: string; color: string };
}

interface RecurringPattern {
  type: "daily" | "weekly" | "monthly";
  interval: number;
}

interface DependencyTask {
  id: string;
  title: string;
  status: string;
}

interface TaskDependency {
  dependsOnTask: DependencyTask;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  priority: string;
  status: string;
  dueDate?: string | null;
  estimatedDuration?: number | null;
  completedAt?: string | null;
  subtasks?: Subtask[];
  tags?: TaskTag[];
  recurringPattern?: RecurringPattern | null;
  dependencies?: TaskDependency[];
}

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  /** Selection mode — shows checkbox instead of complete toggle */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const CATEGORY_STYLES: Record<string, string> = {
  DataScience: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  Entrepreneurship: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  AIResearch: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  Fitness: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Studies: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  Opportunities: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  Personal: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  DataScience: "Data Science",
  Entrepreneurship: "Entrepreneurship",
  AIResearch: "AI Research",
  Fitness: "Fitness",
  Studies: "Studies",
  Opportunities: "Opportunities",
  Personal: "Personal",
};

function formatDueDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Today", overdue: false };
  if (diff === 1) return { label: "Tomorrow", overdue: false };
  return {
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
  };
}

export function TaskCard({
  task,
  onUpdate,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const isCompleted = task.status === "Completed";
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;

  // Tasks that are blocking completion of this task
  const blockers = (task.dependencies ?? []).filter(
    (d) => d.dependsOnTask.status !== "Completed" && d.dependsOnTask.status !== "Cancelled"
  );
  const isBlocked = !isCompleted && blockers.length > 0;

  async function toggleComplete() {
    if (isBlocked) {
      const names = blockers
        .slice(0, 2)
        .map((d) => `"${d.dependsOnTask.title}"`)
        .join(", ");
      toast.error(
        `Finish ${blockers.length === 1 ? "this dependency" : "these dependencies"} first: ${names}${blockers.length > 2 ? ` +${blockers.length - 2} more` : ""}`
      );
      return;
    }
    const newStatus = isCompleted ? "ToDo" : "Completed";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(newStatus === "Completed" ? "Task completed!" : "Task reopened");
    } else {
      toast.error("Failed to update task");
    }
    onUpdate();
  }

  async function deleteTask() {
    setIsDeleting(true);
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Task deleted");
    } else {
      toast.error("Failed to delete task");
    }
    onUpdate();
  }

  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <>
      <Card
        className={`group transition-all duration-150 hover:shadow-md ${
          isCompleted && !selectionMode ? "opacity-60" : ""
        } ${
          isBlocked && !selectionMode ? "border-orange-200 dark:border-orange-800/50" : ""
        } ${
          selectionMode
            ? selected
              ? "border-blue-400 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-900/10"
              : "cursor-pointer hover:border-slate-300"
            : ""
        }`}
        onClick={selectionMode ? () => onToggleSelect?.(task.id) : undefined}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Selection checkbox OR complete toggle */}
            {selectionMode ? (
              <div className="mt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggleSelect?.(task.id)}
                  aria-label={`Select "${task.title}"`}
                />
              </div>
            ) : (
              <button
                onClick={toggleComplete}
                className={`mt-0.5 shrink-0 transition-colors ${
                  isBlocked
                    ? "cursor-not-allowed text-orange-400 dark:text-orange-500"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                aria-label={
                  isBlocked
                    ? `Blocked by ${blockers.length} task${blockers.length > 1 ? "s" : ""}`
                    : isCompleted
                      ? "Mark incomplete"
                      : "Mark complete"
                }
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isBlocked ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={`font-medium text-slate-900 dark:text-slate-50 ${
                  isCompleted ? "line-through" : ""
                }`}
              >
                {task.title}
              </p>

              {task.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {task.description}
                </p>
              )}

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={`text-xs ${CATEGORY_STYLES[task.category]}`} variant="outline">
                  {CATEGORY_LABELS[task.category] ?? task.category}
                </Badge>
                <Badge className={`text-xs ${PRIORITY_STYLES[task.priority]}`} variant="outline">
                  {task.priority}
                </Badge>

                {due && (
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      due.overdue
                        ? "text-red-600 dark:text-red-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    {due.label}
                  </span>
                )}

                {task.estimatedDuration && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    {task.estimatedDuration}m
                  </span>
                )}

                {/* Recurring indicator */}
                {task.recurringPattern && (
                  <span
                    className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400"
                    title="Recurring task"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {formatRecurringPattern(task.recurringPattern)}
                  </span>
                )}

                {/* Blocker badge */}
                {isBlocked && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400"
                    title={blockers.map((d) => d.dependsOnTask.title).join(", ")}
                  >
                    <Lock className="h-3 w-3" />
                    Blocked by {blockers.length}
                  </span>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 &&
                  task.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))
                }

                {/* Subtask toggle */}
                <button
                  onClick={() => setSubtasksOpen((v) => !v)}
                  className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {subtasksOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {hasSubtasks
                    ? `${task.subtasks!.filter((s) => s.completed).length}/${task.subtasks!.length} subtasks`
                    : "Subtasks"}
                </button>
              </div>

              {/* Subtask list */}
              {subtasksOpen && (
                <SubtaskList
                  taskId={task.id}
                  subtasks={task.subtasks ?? []}
                  onUpdate={onUpdate}
                />
              )}
            </div>

            {/* Actions — hidden in selection mode */}
            {!selectionMode && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
                  aria-label="Task actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={deleteTask}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>}
          </div>
        </CardContent>
      </Card>

      <TaskForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={onUpdate}
        initialValues={{
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          category: task.category as never,
          priority: task.priority as never,
          status: task.status as never,
          dueDate: task.dueDate
            ? new Date(task.dueDate).toISOString().split("T")[0]
            : "",
          estimatedDuration: task.estimatedDuration?.toString() ?? "",
          tagIds: task.tags?.map((t) => t.tag.id) ?? [],
          recurringPattern: task.recurringPattern ?? null,
          dependencyIds: task.dependencies?.map((d) => d.dependsOnTask.id) ?? [],
        }}
      />
    </>
  );
}
