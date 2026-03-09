import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskCard } from "@/components/tasks/TaskCard";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Base task fixture
const baseTask = {
  id: "task-1",
  title: "Write unit tests",
  description: "Set up Vitest and write tests",
  category: "DataScience",
  priority: "High",
  status: "ToDo",
  dueDate: null,
  estimatedDuration: 60,
  subtasks: [],
  tags: [],
  dependencies: [],
  recurringPattern: null,
};

describe("TaskCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("renders task title", () => {
    render(<TaskCard task={baseTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("Write unit tests")).toBeInTheDocument();
  });

  it("renders task description", () => {
    render(<TaskCard task={baseTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("Set up Vitest and write tests")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<TaskCard task={baseTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("Data Science")).toBeInTheDocument();
  });

  it("renders priority badge", () => {
    render(<TaskCard task={baseTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders estimated duration", () => {
    render(<TaskCard task={baseTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("60m")).toBeInTheDocument();
  });

  it("shows circle icon for incomplete task", () => {
    render(<TaskCard task={baseTask} onUpdate={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /mark complete/i });
    expect(btn).toBeInTheDocument();
  });

  it("shows checkmark icon for completed task", () => {
    const completedTask = { ...baseTask, status: "Completed" };
    render(<TaskCard task={completedTask} onUpdate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /mark incomplete/i })).toBeInTheDocument();
  });

  it("applies line-through style on completed task title", () => {
    const completedTask = { ...baseTask, status: "Completed" };
    render(<TaskCard task={completedTask} onUpdate={vi.fn()} />);
    const title = screen.getByText("Write unit tests");
    expect(title.className).toContain("line-through");
  });

  it("calls onUpdate after toggling complete", async () => {
    const onUpdate = vi.fn();
    render(<TaskCard task={baseTask} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
  });

  it("shows lock icon when task is blocked", () => {
    const blockedTask = {
      ...baseTask,
      dependencies: [
        { dependsOnTask: { id: "dep-1", title: "Blocker task", status: "ToDo" } },
      ],
    };
    render(<TaskCard task={blockedTask} onUpdate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /blocked by 1 task/i })).toBeInTheDocument();
  });

  it("shows toast error when clicking blocked task complete", async () => {
    const { toast } = await import("sonner");
    const blockedTask = {
      ...baseTask,
      dependencies: [
        { dependsOnTask: { id: "dep-1", title: "Blocker task", status: "ToDo" } },
      ],
    };
    render(<TaskCard task={blockedTask} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /blocked by 1 task/i }));
    expect(toast.error).toHaveBeenCalled();
  });

  it("renders tag chips", () => {
    const taggedTask = {
      ...baseTask,
      tags: [{ tag: { id: "tag-1", name: "ml", color: "#8b5cf6" } }],
    };
    render(<TaskCard task={taggedTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("ml")).toBeInTheDocument();
  });

  it("shows checkbox in selection mode", () => {
    render(
      <TaskCard task={baseTask} onUpdate={vi.fn()} selectionMode={true} selected={false} />
    );
    expect(screen.getByRole("checkbox", { name: /select/i })).toBeInTheDocument();
  });

  it("calls onToggleSelect when checkbox clicked in selection mode", () => {
    const onToggleSelect = vi.fn();
    render(
      <TaskCard
        task={baseTask}
        onUpdate={vi.fn()}
        selectionMode={true}
        selected={false}
        onToggleSelect={onToggleSelect}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /select/i }));
    expect(onToggleSelect).toHaveBeenCalledWith("task-1");
  });

  it("shows recurring badge when task has recurringPattern", () => {
    const recurringTask = {
      ...baseTask,
      recurringPattern: { type: "weekly" as const, interval: 1 },
    };
    render(<TaskCard task={recurringTask} onUpdate={vi.fn()} />);
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });
});
