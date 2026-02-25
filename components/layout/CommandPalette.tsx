"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { TaskForm } from "@/components/tasks/TaskForm";
import { toast } from "sonner";
import {
  LayoutList,
  CalendarClock,
  BarChart2,
  Brain,
  Briefcase,
  BookOpen,
  Dumbbell,
  Star,
  User,
  PieChart,
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "All Tasks", value: "", icon: LayoutList },
  { label: "Today", value: "__today__", icon: CalendarClock },
  { label: "Data Science", value: "DataScience", icon: BarChart2 },
  { label: "AI Research", value: "AIResearch", icon: Brain },
  { label: "Entrepreneurship", value: "Entrepreneurship", icon: Briefcase },
  { label: "Studies", value: "Studies", icon: BookOpen },
  { label: "Fitness", value: "Fitness", icon: Dumbbell },
  { label: "Opportunities", value: "Opportunities", icon: Star },
  { label: "Personal", value: "Personal", icon: User },
  { label: "Analytics", value: "__analytics__", icon: PieChart },
];

// Inline style for cmdk item selection highlight — avoids relying on
// specific Tailwind variant behaviour with cmdk's aria-selected attribute.
const ITEM_BASE =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
const ITEM_HOVER =
  "hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800";

interface SearchTask {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Called when user picks a navigation item — sets the active view */
  onNavigate: (value: string) => void;
  /** Called after a task is created or edited so the list can refresh */
  onTaskCreated: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onTaskCreated,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTask[]>([]);
  const [creating, setCreating] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<SearchTask | null>(null);

  // Reset everything when the palette is closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults([]);
      setTaskToEdit(null);
    }
  }, [open]);

  // Debounced task search — fires 250 ms after the user stops typing
  useEffect(() => {
    if (!query.trim() || !open) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tasks?search=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        // Cap at 5 results so the palette stays compact
        setSearchResults((data.tasks ?? []).slice(0, 5));
      } catch {
        // Non-critical — silently skip
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  // Quick-create: create task immediately with sensible defaults
  async function quickCreate() {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: query.trim(),
          category: "Personal",
          priority: "Medium",
          status: "ToDo",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Task created!");
      onTaskCreated();
      onClose();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  function handleNavigate(value: string) {
    if (value === "__analytics__") {
      router.push("/analytics");
    } else {
      onNavigate(value);
    }
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — positioned in upper-center of viewport */}
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]">
        <div
          className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <Command
            className="flex flex-col"
            loop
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
              }
            }}
          >
            {/* ── Input row ── */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search tasks or type to quick-create…"
                className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
                autoFocus
              />
              <div className="hidden items-center gap-2 sm:flex">
                {query && (
                  <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    ↵ create
                  </kbd>
                )}
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Esc
                </kbd>
              </div>
            </div>

            {/* ── Results ── */}
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No results
              </Command.Empty>

              {/* Quick-create action */}
              {query.trim() && (
                <Command.Group>
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Create
                  </p>
                  <Command.Item
                    value={`create-${query}`}
                    onSelect={quickCreate}
                    disabled={creating}
                    className={`${ITEM_BASE} ${ITEM_HOVER}`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                      <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">
                        {creating ? "Creating…" : `Create "${query.trim()}"`}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Personal · Medium priority · To Do
                      </p>
                    </div>
                  </Command.Item>
                </Command.Group>
              )}

              {/* Task search results */}
              {searchResults.length > 0 && (
                <Command.Group>
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Tasks
                  </p>
                  {searchResults.map((task) => (
                    <Command.Item
                      key={task.id}
                      value={`task-${task.id}-${task.title}`}
                      onSelect={() => {
                        setTaskToEdit(task);
                        setQuery("");
                      }}
                      className={`${ITEM_BASE} ${ITEM_HOVER}`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          task.status === "Completed"
                            ? "text-green-500"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-medium text-slate-900 dark:text-slate-50 ${
                            task.status === "Completed" ? "opacity-60 line-through" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {task.category} · {task.priority}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Navigation */}
              <Command.Group>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Navigate
                </p>
                {NAV_ITEMS.map(({ label, value, icon: Icon }) => (
                  <Command.Item
                    key={value || "__all__"}
                    value={`nav-${label}`}
                    onSelect={() => handleNavigate(value)}
                    className={`${ITEM_BASE} ${ITEM_HOVER} py-2`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            {/* ── Footer hints ── */}
            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 dark:border-slate-800">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                <kbd className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                <kbd className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
                  ↵
                </kbd>
                select
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                <kbd className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
                  Esc
                </kbd>
                close
              </span>
            </div>
          </Command>
        </div>
      </div>

      {/* TaskForm opened when user selects a search result */}
      {taskToEdit && (
        <TaskForm
          open={true}
          onClose={() => {
            setTaskToEdit(null);
            onClose();
          }}
          onSuccess={() => {
            onTaskCreated();
            setTaskToEdit(null);
            onClose();
          }}
          initialValues={{
            id: taskToEdit.id,
            title: taskToEdit.title,
            category: taskToEdit.category as never,
            priority: taskToEdit.priority as never,
            status: taskToEdit.status as never,
          }}
        />
      )}
    </>
  );
}
