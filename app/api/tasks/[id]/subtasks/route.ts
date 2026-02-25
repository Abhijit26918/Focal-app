import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

const SubtaskSchema = z.object({
  title: z.string().min(1).max(255),
});

// POST /api/tasks/[id]/subtasks — add a subtask
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;

    // Verify task ownership
    const task = await prisma.task.findFirst({ where: { id, userId: dbUser.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const body = await req.json();
    const parsed = SubtaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    // Determine next order index
    const count = await prisma.subtask.count({ where: { taskId: id } });

    const subtask = await prisma.subtask.create({
      data: { taskId: id, title: parsed.data.title, order: count },
    });

    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks/[id]/subtasks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks/[id]/subtasks — toggle subtask complete
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id: taskId } = await params;
    const body = await req.json();
    const { subtaskId, completed } = body as { subtaskId: string; completed: boolean };

    // Verify ownership via the parent task
    const task = await prisma.task.findFirst({ where: { id: taskId, userId: dbUser.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completed },
    });

    return NextResponse.json({ subtask });
  } catch (error) {
    console.error("[PATCH /api/tasks/[id]/subtasks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/subtasks?subtaskId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id: taskId } = await params;
    const subtaskId = new URL(req.url).searchParams.get("subtaskId");
    if (!subtaskId) return NextResponse.json({ error: "subtaskId required" }, { status: 400 });

    const task = await prisma.task.findFirst({ where: { id: taskId, userId: dbUser.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await prisma.subtask.delete({ where: { id: subtaskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]/subtasks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
