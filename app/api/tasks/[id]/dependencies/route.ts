import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

const AddDepSchema = z.object({
  dependsOnTaskId: z.string().uuid(),
});

// BFS cycle check: returns true if adding taskId → dependsOnTaskId would create a cycle.
// Traverses the existing dependency graph starting from dependsOnTaskId to see if it
// can reach taskId (which would mean a cycle exists).
async function wouldCreateCycle(
  fromId: string,
  targetId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [fromId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnTaskId: true },
    });

    for (const dep of deps) {
      if (!visited.has(dep.dependsOnTaskId)) {
        queue.push(dep.dependsOnTaskId);
      }
    }
  }

  return false;
}

// GET /api/tasks/[id]/dependencies — list tasks this task depends on
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const deps = await prisma.taskDependency.findMany({
      where: { taskId: id },
      include: {
        dependsOnTask: {
          select: { id: true, title: true, status: true, category: true, priority: true },
        },
      },
    });

    return NextResponse.json({ dependencies: deps.map((d) => d.dependsOnTask) });
  } catch (error) {
    console.error("[GET /api/tasks/[id]/dependencies]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks/[id]/dependencies — add a dependency link
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

    const body = await req.json();
    const parsed = AddDepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { dependsOnTaskId } = parsed.data;

    if (id === dependsOnTaskId) {
      return NextResponse.json({ error: "A task cannot depend on itself" }, { status: 400 });
    }

    // Verify both tasks belong to the current user
    const [task, depTask] = await Promise.all([
      prisma.task.findFirst({ where: { id, userId: dbUser.id }, select: { id: true } }),
      prisma.task.findFirst({
        where: { id: dependsOnTaskId, userId: dbUser.id },
        select: { id: true },
      }),
    ]);

    if (!task || !depTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Guard against circular dependencies
    if (await wouldCreateCycle(dependsOnTaskId, id)) {
      return NextResponse.json(
        { error: "This would create a circular dependency" },
        { status: 400 }
      );
    }

    // Upsert handles duplicate additions gracefully
    await prisma.taskDependency.upsert({
      where: { taskId_dependsOnTaskId: { taskId: id, dependsOnTaskId } },
      create: { taskId: id, dependsOnTaskId },
      update: {},
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks/[id]/dependencies]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/dependencies?depId=<dependsOnTaskId> — remove a dependency link
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await syncUser();
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const depId = new URL(req.url).searchParams.get("depId");
    if (!depId) return NextResponse.json({ error: "depId query param required" }, { status: 400 });

    const task = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await prisma.taskDependency.deleteMany({
      where: { taskId: id, dependsOnTaskId: depId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]/dependencies]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
