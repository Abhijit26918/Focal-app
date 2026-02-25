import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { logActivity } from "@/lib/activity/log";

const CreateTaskSchema = z.object({
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
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  status: z.enum(["ToDo", "InProgress", "Completed", "Cancelled"]).default("ToDo"),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedDuration: z.number().int().positive().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
  dependencyIds: z.array(z.string().uuid()).optional(),
  recurringPattern: z
    .object({
      type: z.enum(["daily", "weekly", "monthly"]),
      interval: z.number().int().min(1).max(365),
    })
    .optional()
    .nullable(),
});

// GET /api/tasks — list tasks for the current user
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const today = searchParams.get("today") === "true";
    const search = searchParams.get("search")?.trim();
    const tag = searchParams.get("tag");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const overdue = searchParams.get("overdue") === "true";

    // Today filter: tasks due today (midnight to 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Determine dueDate range filter — priority: today > overdue > from/to range
    const dueDateFilter = today
      ? { gte: todayStart, lte: todayEnd }
      : overdue
        ? { lt: todayStart }
        : from && to
          ? { gte: new Date(from), lte: new Date(to) }
          : undefined;

    const tasks = await prisma.task.findMany({
      where: {
        userId: dbUser.id,
        ...(status && { status: status as never }),
        ...(category && { category: category as never }),
        ...(priority && { priority: priority as never }),
        ...(dueDateFilter && { dueDate: dueDateFilter }),
        // Exclude completed/cancelled for today/overdue views
        ...((today || overdue) && { status: { notIn: ["Completed", "Cancelled"] } }),
        // Full-text search across title and description
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        // Filter by tag ID
        ...(tag && { tags: { some: { tagId: tag } } }),
      },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, title: true, status: true } },
          },
        },
      },
      // sortOrder is new and not yet in Prisma types — cast as never until generate runs
      orderBy: [{ sortOrder: "asc" } as never, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[GET /api/tasks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks — create a task
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = CreateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { dueDate, tagIds, dependencyIds, recurringPattern, ...rest } = parsed.data;

    const task = await prisma.task.create({
      data: {
        ...rest,
        userId: dbUser.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        // Store recurringPattern as JSON — cast needed because Prisma types JSON as InputJsonValue
        recurringPattern: (recurringPattern ?? null) as never,
        ...(tagIds && tagIds.length > 0 && {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: {
        subtasks: true,
        tags: { include: { tag: true } },
      },
    });

    // Link dependencies after the task exists (FK constraint requires task to exist first)
    if (dependencyIds && dependencyIds.length > 0) {
      await prisma.taskDependency.createMany({
        data: dependencyIds.map((dependsOnTaskId) => ({
          taskId: task.id,
          dependsOnTaskId,
        })),
        skipDuplicates: true,
      });
    }

    logActivity({
      userId: dbUser.id,
      action: "task.created",
      entityType: "task",
      entityId: task.id,
      entityTitle: task.title,
      metadata: { category: task.category, priority: task.priority },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
