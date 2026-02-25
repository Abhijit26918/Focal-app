"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/components/tasks/TaskCard";
import { BulkActionBar } from "@/components/tasks/BulkActionBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClipboardList, GripVertical, CheckSquare } from "lucide-react";

interface TaskTag {
  tag: { id: string; name: string; color: string };
}

interface TaskDependency {
  dependsOnTask: { id: string; title: string; status: string };
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
  sortOrder?: number | null;
  tags?: TaskTag[];
  dependencies?: TaskDependency[];
}

interface TaskListProps {
  filters?: {
    status?: string;
    category?: string;
    priority?: string;
    today?: boolean;
    search?: string;
    tag?: string;
  };
  refreshKey?: number;
}

// ── Sortable wrapper around TaskCard ─────────────────────────────────────────
function SortableTaskCard({
  task,
  onUpdate,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  task: Task;
  onUpdate: () => void;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: selectionMode });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="flex items-stretch gap-1"
    >
      {/* Drag handle — hidden in selection mode */}
      {!selectionMode && (
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="flex items-center rounded px-0.5 text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-700 dark:hover:text-slate-400"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          aria-label="Drag to reorder"
          tabIndex={0}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Card content */}
      <div className="min-w-0 flex-1">
        <TaskCard
          task={task}
          onUpdate={onUpdate}
          selectionMode={selectionMode}
          selected={selected}
          onToggleSelect={onToggleSelect}
        />
      </div>
    </div>
  );
}

// ── Main TaskList ─────────────────────────────────────────────────────────────
export function TaskList({ filters, refreshKey }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.today) params.set("today", "true");
    if (filters?.search) params.set("search", filters.search);
    if (filters?.tag) params.set("tag", filters.tag);

    const res = await fetch(`/api/tasks?${params.toString()}`);
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }, [
    filters?.status,
    filters?.category,
    filters?.priority,
    filters?.today,
    filters?.search,
    filters?.tag,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  // Exit selection mode when filters change (tasks set changes)
  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [refreshKey]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(tasks.map((t) => t.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  // Configure sensors: pointer (mouse/touch) + keyboard for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a 6px movement before dragging starts — prevents accidental drags
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const active = tasks.filter(
    (t) => t.status !== "Completed" && t.status !== "Cancelled"
  );
  const done = tasks.filter(
    (t) => t.status === "Completed" || t.status === "Cancelled"
  );

  const activeDragTask = activeDragId
    ? active.find((t) => t.id === activeDragId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active: draggedItem, over } = event;
    if (!over || draggedItem.id === over.id) return;

    setTasks((prev) => {
      const activeIds = prev
        .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
        .map((t) => t.id);

      const oldIndex = activeIds.indexOf(String(draggedItem.id));
      const newIndex = activeIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reorderedActiveIds = arrayMove(activeIds, oldIndex, newIndex);

      // Optimistic update: reorder tasks array in state immediately
      const activeTaskMap = new Map(
        prev
          .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
          .map((t) => [t.id, t])
      );
      const reorderedActive = reorderedActiveIds.map(
        (id) => activeTaskMap.get(id)!
      );
      const doneItems = prev.filter(
        (t) => t.status === "Completed" || t.status === "Cancelled"
      );

      // Fire-and-forget — persist to DB without blocking the UI
      fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reorderedActiveIds }),
      }).catch(() => {
        // If persist fails, re-fetch to restore server order
        fetchTasks();
      });

      return [...reorderedActive, ...doneItems];
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
        <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          No tasks yet
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Create your first task using the button above
        </p>
      </div>
    );
  }

  const taskList = (
    <div className="space-y-6">
      {/* Toolbar row: task count + Select toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant={selectionMode ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => {
            if (selectionMode) {
              exitSelection();
            } else {
              setSelectionMode(true);
            }
          }}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          {selectionMode ? "Cancel selection" : "Select"}
        </Button>
      </div>

      {/* Active tasks */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onUpdate={fetchTasks}
              selectionMode={selectionMode}
              selected={selectedIds.has(task.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Completed / Cancelled — not sortable */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Completed ({done.length})
          </p>
          {done.map((task) => (
            <div key={task.id} className="flex items-stretch gap-1">
              {/* spacer to align with active tasks that have a drag handle */}
              {!selectionMode && <div className="w-5 shrink-0" />}
              <div className="min-w-0 flex-1">
                <TaskCard
                  task={task}
                  onUpdate={fetchTasks}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(task.id)}
                  onToggleSelect={toggleSelect}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {selectionMode ? (
        // In selection mode: no DnD context, plain list with checkboxes
        taskList
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={active.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {taskList}
          </SortableContext>

          {/* Floating ghost card shown under the cursor while dragging */}
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeDragTask ? (
              <div className="flex items-stretch gap-1 rounded-lg opacity-90 shadow-xl ring-2 ring-blue-400">
                <div className="flex items-center px-0.5 text-blue-400">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <TaskCard task={activeDragTask} onUpdate={() => {}} />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Sticky bulk action bar — appears when ≥1 task is selected */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selectedIds)}
          totalCount={tasks.length}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onExitSelection={exitSelection}
          onSuccess={fetchTasks}
        />
      )}
    </>
  );
}
