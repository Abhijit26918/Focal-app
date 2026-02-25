import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { Status, Category, Priority } from "@prisma/client";
import { logActivity } from "@/lib/activity/log";

const BulkSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("complete"),
    taskIds: z.array(z.string().uuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("delete"),
    taskIds: z.array(z.string().uuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("setStatus"),
    taskIds: z.array(z.string().uuid()).min(1).max(200),
    status: z.enum(["ToDo", "InProgress", "Completed", "Cancelled"]),
  }),
  z.object({
    action: z.literal("setCategory"),
    taskIds: z.array(z.string().uuid()).min(1).max(200),
    category: z.enum([
      "DataScience",
      "Entrepreneurship",
      "AIResearch",
      "Fitness",
      "Studies",
      "Opportunities",
      "Personal",
    ]),
  }),
  z.object({
    action: z.literal("setPriority"),
    taskIds: z.array(z.string().uuid()).min(1).max(200),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  }),
]);

// POST /api/tasks/bulk — perform a bulk operation on the current user's tasks
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
    const parsed = BulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Always scope to tasks owned by this user
    const ownershipFilter = {
      id: { in: data.taskIds },
      userId: dbUser.id,
    };

    switch (data.action) {
      case "complete": {
        const now = new Date();
        const result = await prisma.task.updateMany({
          where: { ...ownershipFilter, status: { notIn: ["Completed", "Cancelled"] } },
          data: { status: "Completed", completedAt: now },
        });
        logActivity({
          userId: dbUser.id, action: "task.bulk_complete",
          entityType: "task", metadata: { count: result.count },
        });
        return NextResponse.json({ updated: result.count });
      }

      case "delete": {
        const result = await prisma.task.deleteMany({ where: ownershipFilter });
        logActivity({
          userId: dbUser.id, action: "task.bulk_delete",
          entityType: "task", metadata: { count: result.count },
        });
        return NextResponse.json({ deleted: result.count });
      }

      case "setStatus": {
        const status = data.status as Status;
        const result = await prisma.task.updateMany({
          where: ownershipFilter,
          data: {
            status,
            completedAt: status === Status.Completed ? new Date() : null,
          },
        });
        logActivity({
          userId: dbUser.id, action: "task.bulk_setStatus",
          entityType: "task", metadata: { count: result.count, status: data.status },
        });
        return NextResponse.json({ updated: result.count });
      }

      case "setCategory": {
        const result = await prisma.task.updateMany({
          where: ownershipFilter,
          data: { category: data.category as Category },
        });
        logActivity({
          userId: dbUser.id, action: "task.bulk_setCategory",
          entityType: "task", metadata: { count: result.count, category: data.category },
        });
        return NextResponse.json({ updated: result.count });
      }

      case "setPriority": {
        const result = await prisma.task.updateMany({
          where: ownershipFilter,
          data: { priority: data.priority as Priority },
        });
        logActivity({
          userId: dbUser.id, action: "task.bulk_setPriority",
          entityType: "task", metadata: { count: result.count, priority: data.priority },
        });
        return NextResponse.json({ updated: result.count });
      }
    }
  } catch (error) {
    console.error("[POST /api/tasks/bulk]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
