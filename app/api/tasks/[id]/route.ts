import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { calculateNextDueDate, type RecurringPattern } from "@/lib/utils/recurring";
import { logActivity } from "@/lib/activity/log";

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  category: z
    .enum([
      "DataScience",
      "Entrepreneurship",
      "AIResearch",
      "Fitness",
      "Studies",
      "Opportunities",
      "Personal",
    ])
    .optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  status: z.enum(["ToDo", "InProgress", "Completed", "Cancelled"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedDuration: z.number().int().positive().optional().nullable(),
  // tagIds: when present, replaces all existing tags for the task
  tagIds: z.array(z.string().uuid()).optional(),
  // dependencyIds: when present, replaces all existing dependencies for the task
  dependencyIds: z.array(z.string().uuid()).optional(),
  // recurringPattern: when present (including null), replaces the existing pattern
  recurringPattern: z
    .object({
      type: z.enum(["daily", "weekly", "monthly"]),
      interval: z.number().int().min(1).max(365),
    })
    .optional()
    .nullable(),
});

// GET /api/tasks/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[GET /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tasks/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Ensure ownership — fetch with tags so we can copy them to the next occurrence
    const existing = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
      include: { tags: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Extract recurringPattern separately — Prisma's JSON null type requires a cast
    const { dueDate, status, tagIds, dependencyIds, recurringPattern, ...coreFields } = parsed.data;

    // Block completion if any dependencies are still incomplete
    if (status === "Completed") {
      const incompleteDeps = await prisma.taskDependency.findMany({
        where: {
          taskId: id,
          dependsOnTask: { status: { notIn: ["Completed", "Cancelled"] } },
        },
        include: {
          dependsOnTask: { select: { title: true } },
        },
      });

      if (incompleteDeps.length > 0) {
        const names = incompleteDeps
          .slice(0, 3)
          .map((d) => `"${d.dependsOnTask.title}"`)
          .join(", ");
        return NextResponse.json(
          {
            error: `Complete ${incompleteDeps.length === 1 ? "this dependency" : "these dependencies"} first: ${names}${incompleteDeps.length > 3 ? ` and ${incompleteDeps.length - 3} more` : ""}`,
          },
          { status: 400 }
        );
      }
    }

    await prisma.task.update({
      where: { id },
      data: {
        ...coreFields,
        ...(status && { status }),
        // Auto-set completedAt when marking complete
        ...(status === "Completed" && { completedAt: new Date() }),
        ...(status && status !== "Completed" && { completedAt: null }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        // Only update recurringPattern when explicitly included in the request
        ...(recurringPattern !== undefined && {
          recurringPattern: (recurringPattern ?? null) as never,
        }),
      },
    });

    // Sync tags: replace all existing task tags with the new set
    if (tagIds !== undefined) {
      await prisma.taskTag.deleteMany({ where: { taskId: id } });
      if (tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId) => ({ taskId: id, tagId })),
        });
      }
    }

    // Sync dependencies: replace all existing dependencies with the new set
    if (dependencyIds !== undefined) {
      await prisma.taskDependency.deleteMany({ where: { taskId: id } });
      if (dependencyIds.length > 0) {
        await prisma.taskDependency.createMany({
          data: dependencyIds.map((dependsOnTaskId) => ({ taskId: id, dependsOnTaskId })),
          skipDuplicates: true,
        });
      }
    }

    // Auto-spawn next occurrence when completing a recurring task
    if (status === "Completed") {
      // Use updated pattern if provided in this request, otherwise fall back to existing
      const effectivePattern = (
        recurringPattern !== undefined ? recurringPattern : existing.recurringPattern
      ) as RecurringPattern | null;

      if (effectivePattern) {
        const baseDue = existing.dueDate ?? new Date();
        const nextDue = calculateNextDueDate(new Date(baseDue), effectivePattern);

        await prisma.task.create({
          data: {
            title: existing.title,
            description: existing.description,
            category: existing.category,
            priority: existing.priority,
            status: "ToDo",
            dueDate: nextDue,
            estimatedDuration: existing.estimatedDuration,
            recurringPattern: effectivePattern as never,
            userId: existing.userId,
            // Copy tags from the existing task
            ...(existing.tags.length > 0 && {
              tags: {
                create: existing.tags.map((t) => ({ tagId: t.tagId })),
              },
            }),
          },
        });
      }
    }

    // Log the activity — completed takes priority over generic updated
    logActivity({
      userId: dbUser.id,
      action:
        status === "Completed" && existing.status !== "Completed"
          ? "task.completed"
          : "task.updated",
      entityType: "task",
      entityId: id,
      entityTitle: parsed.data.title ?? existing.title,
      metadata: {
        category: parsed.data.category ?? existing.category,
        priority: parsed.data.priority ?? existing.priority,
        status: status ?? existing.status,
      },
    });

    // Always re-fetch so the response reflects all synced relations
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[PUT /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    logActivity({
      userId: dbUser.id,
      action: "task.deleted",
      entityType: "task",
      entityId: id,
      entityTitle: existing.title,
      metadata: { category: existing.category, priority: existing.priority },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
