"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TagSelector, type TagOption } from "@/components/tags/TagSelector";
import { DependencySelector, type TaskOption } from "@/components/tasks/DependencySelector";
import { RefreshCw } from "lucide-react";

const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  category: z.enum([
    "DataScience",
    "Entrepreneurship",
    "AIResearch",
    "Fitness",
    "Studies",
    "Opportunities",
    "Personal",
  ]),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  status: z.enum(["ToDo", "InProgress", "Completed", "Cancelled"]),
  dueDate: z.string().optional(),
  estimatedDuration: z.string().optional(),
});

type TaskFormValues = z.infer<typeof TaskFormSchema>;

interface RecurringPattern {
  type: "daily" | "weekly" | "monthly";
  interval: number;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialValues?: Partial<TaskFormValues> & {
    id?: string;
    tagIds?: string[];
    dependencyIds?: string[];
    recurringPattern?: RecurringPattern | null;
  };
}

const CATEGORIES = [
  { value: "DataScience", label: "Data Science" },
  { value: "Entrepreneurship", label: "Entrepreneurship" },
  { value: "AIResearch", label: "AI Research" },
  { value: "Fitness", label: "Fitness" },
  { value: "Studies", label: "Studies" },
  { value: "Opportunities", label: "Opportunities" },
  { value: "Personal", label: "Personal" },
];

const PRIORITIES = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const STATUSES = [
  { value: "ToDo", label: "To Do" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

export function TaskForm({ open, onClose, onSuccess, initialValues }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialValues?.tagIds ?? []);
  const [allTasks, setAllTasks] = useState<TaskOption[]>([]);
  const [selectedDepIds, setSelectedDepIds] = useState<string[]>(initialValues?.dependencyIds ?? []);
  const [isRecurring, setIsRecurring] = useState(Boolean(initialValues?.recurringPattern));
  const [recurringType, setRecurringType] = useState<"daily" | "weekly" | "monthly">(
    initialValues?.recurringPattern?.type ?? "daily"
  );
  const [recurringInterval, setRecurringInterval] = useState(
    initialValues?.recurringPattern?.interval ?? 1
  );
  const isEditing = Boolean(initialValues?.id);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      category: initialValues?.category ?? "Personal",
      priority: initialValues?.priority ?? "Medium",
      status: initialValues?.status ?? "ToDo",
      dueDate: initialValues?.dueDate ?? "",
      estimatedDuration: initialValues?.estimatedDuration ?? "",
    },
  });

  // Sync all controlled state from initialValues whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedTagIds(initialValues?.tagIds ?? []);
    setSelectedDepIds(initialValues?.dependencyIds ?? []);
    const p = initialValues?.recurringPattern;
    setIsRecurring(Boolean(p));
    setRecurringType(p?.type ?? "daily");
    setRecurringInterval(p?.interval ?? 1);
    // Fetch tags and all tasks in parallel
    Promise.all([
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ])
      .then(([tagsData, tasksData]) => {
        setAllTags(tagsData.tags ?? []);
        setAllTasks(tasksData.tasks ?? []);
      })
      .catch(() => {/* non-critical */});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        estimatedDuration: values.estimatedDuration
          ? parseInt(values.estimatedDuration, 10)
          : null,
        tagIds: selectedTagIds,
        dependencyIds: selectedDepIds,
        recurringPattern: isRecurring
          ? { type: recurringType, interval: recurringInterval }
          : null,
      };

      const url = isEditing ? `/api/tasks/${initialValues!.id}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save task");
      }

      toast.success(isEditing ? "Task updated!" : "Task created!");
      form.reset();
      setSelectedTagIds([]);
      setSelectedDepIds([]);
      setIsRecurring(false);
      setRecurringInterval(1);
      setRecurringType("daily");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isEditing ? "Failed to update task" : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category + Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status + Due Date row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimated Duration */}
            <FormField
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 60"
                      min={1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <TagSelector
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                allTags={allTags}
                onTagCreated={(tag) => setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))}
              />
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <FormLabel>Blocked by (dependencies)</FormLabel>
              <DependencySelector
                selectedIds={selectedDepIds}
                onChange={setSelectedDepIds}
                allTasks={allTasks}
                excludeId={initialValues?.id}
              />
              {selectedDepIds.length > 0 && (
                <p className="text-[11px] text-slate-400">
                  This task cannot be completed until all dependencies are done.
                </p>
              )}
            </div>

            {/* Recurring Pattern */}
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              {/* Toggle row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-slate-400" />
                  <FormLabel className="cursor-pointer text-sm font-medium">
                    Repeat
                  </FormLabel>
                </div>
                {/* Simple toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isRecurring}
                  onClick={() => setIsRecurring((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none ${
                    isRecurring
                      ? "bg-blue-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isRecurring ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Frequency controls — only shown when repeat is on */}
              {isRecurring && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Every</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={recurringInterval}
                    onChange={(e) =>
                      setRecurringInterval(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="h-8 w-16 text-sm"
                  />
                  <Select
                    value={recurringType}
                    onValueChange={(v) =>
                      setRecurringType(v as "daily" | "weekly" | "monthly")
                    }
                  >
                    <SelectTrigger className="h-8 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">
                        {recurringInterval === 1 ? "day" : "days"}
                      </SelectItem>
                      <SelectItem value="weekly">
                        {recurringInterval === 1 ? "week" : "weeks"}
                      </SelectItem>
                      <SelectItem value="monthly">
                        {recurringInterval === 1 ? "month" : "months"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
