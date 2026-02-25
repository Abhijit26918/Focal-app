"use client";

import { useState, KeyboardEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onUpdate: () => void;
}

export function SubtaskList({ taskId, subtasks, onUpdate }: SubtaskListProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function addSubtask() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setNewTitle("");
        setAdding(false);
        onUpdate();
      } else {
        toast.error("Failed to add subtask");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleSubtask(subtaskId: string, completed: boolean) {
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtaskId, completed }),
    });
    onUpdate();
  }

  async function deleteSubtask(subtaskId: string) {
    await fetch(`/api/tasks/${taskId}/subtasks?subtaskId=${subtaskId}`, {
      method: "DELETE",
    });
    onUpdate();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addSubtask();
    if (e.key === "Escape") {
      setAdding(false);
      setNewTitle("");
    }
  }

  const doneCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="mt-3 space-y-1 pl-8">
      {/* Progress label */}
      {subtasks.length > 0 && (
        <p className="mb-1.5 text-xs text-slate-400">
          {doneCount}/{subtasks.length} subtasks
        </p>
      )}

      {/* Subtask rows */}
      {subtasks.map((sub) => (
        <div key={sub.id} className="group flex items-center gap-2">
          <Checkbox
            id={sub.id}
            checked={sub.completed}
            onCheckedChange={(v) => toggleSubtask(sub.id, Boolean(v))}
            className="h-3.5 w-3.5"
          />
          <label
            htmlFor={sub.id}
            className={`flex-1 cursor-pointer text-xs ${
              sub.completed
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {sub.title}
          </label>
          <button
            onClick={() => deleteSubtask(sub.id)}
            className="hidden text-slate-300 hover:text-red-500 group-hover:block dark:text-slate-600"
            aria-label="Delete subtask"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Add subtask input */}
      {adding ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Subtask title…"
            className="h-6 text-xs"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={addSubtask}
            disabled={saving}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => { setAdding(false); setNewTitle(""); }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <Plus className="h-3 w-3" />
          Add subtask
        </button>
      )}
    </div>
  );
}
