"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Trash2, X, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExitSelection: () => void;
  onSuccess: () => void;
}

type BulkAction =
  | { action: "complete" }
  | { action: "delete" }
  | { action: "setStatus"; status: string }
  | { action: "setCategory"; category: string }
  | { action: "setPriority"; priority: string };

async function runBulk(taskIds: string[], payload: BulkAction): Promise<number> {
  const res = await fetch("/api/tasks/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskIds, ...payload }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Bulk operation failed");
  }
  const data = await res.json();
  return data.updated ?? data.deleted ?? 0;
}

export function BulkActionBar({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onExitSelection,
  onSuccess,
}: BulkActionBarProps) {
  const [loading, setLoading] = useState(false);
  // Incrementing this key forces all three Selects to remount after each
  // action, resetting them back to their placeholder state so the same
  // value can be re-selected next time without Radix silently skipping it.
  const [selectKey, setSelectKey] = useState(0);

  const n = selectedIds.length;
  const allSelected = n === totalCount && totalCount > 0;

  async function handle(payload: BulkAction) {
    if (n === 0) return;

    if (
      payload.action === "delete" &&
      !confirm(`Delete ${n} task${n > 1 ? "s" : ""}? This cannot be undone.`)
    ) {
      return;
    }

    setLoading(true);
    try {
      const count = await runBulk(selectedIds, payload);
      const label =
        payload.action === "delete"
          ? `Deleted ${count} task${count !== 1 ? "s" : ""}`
          : `Updated ${count} task${count !== 1 ? "s" : ""}`;
      toast.success(label);
      setSelectKey((k) => k + 1); // reset all selects to placeholder
      onSuccess();
      onExitSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
      setSelectKey((k) => k + 1); // reset even on error so user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900">

        {/* Selection count + select-all toggle */}
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 dark:border-slate-700">
          <span className="min-w-[4rem] text-center text-sm font-semibold text-slate-900 dark:text-slate-50">
            {n} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            disabled={loading}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
        </div>

        {/* Complete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          onClick={() => handle({ action: "complete" })}
          disabled={loading || n === 0}
          title="Mark selected tasks as completed"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Complete
        </Button>

        {/* Set Status — key forces remount after each action */}
        <Select
          key={`status-${selectKey}`}
          onValueChange={(v) => handle({ action: "setStatus", status: v })}
          disabled={loading || n === 0}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Set status…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ToDo" className="text-xs">To Do</SelectItem>
            <SelectItem value="InProgress" className="text-xs">In Progress</SelectItem>
            <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
            <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Set Priority */}
        <Select
          key={`priority-${selectKey}`}
          onValueChange={(v) => handle({ action: "setPriority", priority: v })}
          disabled={loading || n === 0}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Set priority…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
            <SelectItem value="High" className="text-xs">High</SelectItem>
            <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
            <SelectItem value="Low" className="text-xs">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Set Category */}
        <Select
          key={`category-${selectKey}`}
          onValueChange={(v) => handle({ action: "setCategory", category: v })}
          disabled={loading || n === 0}
        >
          <SelectTrigger className="h-8 w-[138px] text-xs">
            <SelectValue placeholder="Set category…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DataScience" className="text-xs">Data Science</SelectItem>
            <SelectItem value="Entrepreneurship" className="text-xs">Entrepreneurship</SelectItem>
            <SelectItem value="AIResearch" className="text-xs">AI Research</SelectItem>
            <SelectItem value="Fitness" className="text-xs">Fitness</SelectItem>
            <SelectItem value="Studies" className="text-xs">Studies</SelectItem>
            <SelectItem value="Opportunities" className="text-xs">Opportunities</SelectItem>
            <SelectItem value="Personal" className="text-xs">Personal</SelectItem>
          </SelectContent>
        </Select>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={() => handle({ action: "delete" })}
          disabled={loading || n === 0}
          title="Delete selected tasks"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>

        {/* Cancel */}
        <div className="border-l border-slate-200 pl-2 dark:border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-slate-600"
            onClick={onExitSelection}
            disabled={loading}
            aria-label="Exit selection mode"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  );
}
