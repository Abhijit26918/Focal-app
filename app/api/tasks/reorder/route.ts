import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

const ReorderSchema = z.object({
  // Ordered array of active task IDs (front → back maps to sortOrder 1000, 2000, …)
  orderedIds: z.array(z.string().uuid()).min(1),
});

// PATCH /api/tasks/reorder — persist drag-and-drop order for active tasks
export async function PATCH(req: NextRequest) {
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
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderedIds } = parsed.data;

    // Verify all tasks belong to the current user before updating
    const owned = await prisma.task.findMany({
      where: { id: { in: orderedIds }, userId: dbUser.id },
      select: { id: true },
    });

    if (owned.length !== orderedIds.length) {
      return NextResponse.json(
        { error: "Some tasks not found or unauthorized" },
        { status: 403 }
      );
    }

    // Bulk-update sortOrder using raw SQL — Prisma types don't include sortOrder until
    // the dev server is restarted and `prisma generate` re-runs after the schema change.
    // Using $executeRaw bypasses the type system while behaving correctly at runtime.
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.$executeRaw`
          UPDATE tasks
          SET "sortOrder" = ${(index + 1) * 1000}
          WHERE id = ${id}::uuid
            AND "userId" = ${dbUser.id}::uuid
        `
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/tasks/reorder]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
