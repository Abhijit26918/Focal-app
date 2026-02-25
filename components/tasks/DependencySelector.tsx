"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Search, Link2 } from "lucide-react";

export interface TaskOption {
  id: string;
  title: string;
  status: string;
  category: string;
  priority: string;
}

const STATUS_PILL: Record<string, string> = {
  ToDo: "bg-slate-100 text-slate-600",
  InProgress: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-slate-100 text-slate-400 line-through",
};

const STATUS_LABEL: Record<string, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

interface DependencySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  allTasks: TaskOption[];
  // ID of the task being edited — excluded from the list to prevent self-dependency
  excludeId?: string;
}

export function DependencySelector({
  selectedIds,
  onChange,
  allTasks,
  excludeId,
}: DependencySelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTasks = allTasks.filter((t) => selectedIds.includes(t.id));
  const availableTasks = allTasks.filter(
    (t) =>
      t.id !== excludeId &&
      !selectedIds.includes(t.id) &&
      t.title.toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function addDep(task: TaskOption) {
    onChange([...selectedIds, task.id]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeDep(id: string) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  // Backspace on empty input removes the last selected dep
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && query === "" && selectedIds.length > 0) {
        onChange(selectedIds.slice(0, -1));
      }
    },
    [query, selectedIds, onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips + input */}
      <div
        className="flex min-h-[2.25rem] flex-wrap items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-500"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {selectedTasks.map((task) => (
          <span
            key={task.id}
            className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >
            <Link2 className="h-2.5 w-2.5 shrink-0" />
            <span className="max-w-[140px] truncate">{task.title}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeDep(task.id); }}
              className="ml-0.5 rounded-full hover:text-indigo-900 dark:hover:text-indigo-100"
              aria-label={`Remove dependency: ${task.title}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <div className="flex flex-1 items-center gap-1">
          <Search className="h-3 w-3 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedIds.length === 0 ? "Search tasks to add as dependency…" : "Add another…"}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
          {availableTasks.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-slate-400">
              {query ? "No matching tasks found" : "No available tasks"}
            </p>
          ) : (
            availableTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => addDep(task)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{task.category}</p>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_PILL[task.status]}`}
                >
                  {STATUS_LABEL[task.status] ?? task.status}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
