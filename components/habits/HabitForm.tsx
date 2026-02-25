"use client";

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
import { toast } from "sonner";
import { FREQUENCY_LABELS, type HabitWithStats } from "@/types/habit";

const CATEGORIES = [
  { value: "DataScience", label: "Data Science" },
  { value: "Entrepreneurship", label: "Entrepreneurship" },
  { value: "AIResearch", label: "AI Research" },
  { value: "Fitness", label: "Fitness" },
  { value: "Studies", label: "Studies" },
  { value: "Opportunities", label: "Opportunities" },
  { value: "Personal", label: "Personal" },
];

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const HabitFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
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
  targetFrequency: z.enum(["daily", "weekdays", "weekly", "2x_week", "3x_week"]),
  color: z.string(),
});

type HabitFormValues = z.infer<typeof HabitFormSchema>;

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  habit?: HabitWithStats; // if provided, we're editing
}

export function HabitForm({ open, onClose, onSuccess, habit }: HabitFormProps) {
  const isEditing = !!habit;

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(HabitFormSchema),
    defaultValues: {
      name: habit?.name ?? "",
      description: habit?.description ?? "",
      category: (habit?.category as HabitFormValues["category"]) ?? "Personal",
      targetFrequency:
        (habit?.targetFrequency as HabitFormValues["targetFrequency"]) ?? "daily",
      color: habit?.color ?? "#3b82f6",
    },
  });

  // Reset form values when the habit prop changes (switching from create → edit)
  const { reset } = form;
  if (open && habit && form.getValues("name") !== habit.name) {
    reset({
      name: habit.name,
      description: habit.description ?? "",
      category: habit.category as HabitFormValues["category"],
      targetFrequency: habit.targetFrequency as HabitFormValues["targetFrequency"],
      color: habit.color,
    });
  }

  async function onSubmit(values: HabitFormValues) {
    try {
      const url = isEditing ? `/api/habits/${habit!.id}` : "/api/habits";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save habit");
        return;
      }

      toast.success(isEditing ? "Habit updated!" : "Habit created!");
      form.reset();
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Morning workout" {...field} />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this habit…"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category + Frequency in a row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="targetFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Color picker */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          className={`h-7 w-7 rounded-full transition-all ${
                            field.value === c
                              ? "ring-2 ring-offset-2 ring-slate-700 scale-110"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Saving…"
                    : "Creating…"
                  : isEditing
                  ? "Save changes"
                  : "Create habit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
