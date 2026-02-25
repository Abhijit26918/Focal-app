import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";
import { logActivity } from "@/lib/activity/log";

const CompletionSchema = z.object({
  // ISO date string "yyyy-MM-dd" — defaults to today
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be yyyy-MM-dd")
    .optional(),
  notes: z.string().optional().nullable(),
});

// POST /api/habits/[id]/completions — mark a habit complete for a date
export async function POST(
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

    // Verify ownership
    const habit = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CompletionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Parse the date as local midnight to avoid timezone drift
    const dateStr = parsed.data.date ?? new Date().toISOString().slice(0, 10);
    const [year, month, day] = dateStr.split("-").map(Number);
    const completedDate = new Date(year, month - 1, day);

    // Upsert — idempotent toggle-on
    const completion = await prisma.habitCompletion.upsert({
      where: {
        habitId_completedDate: { habitId: id, completedDate },
      },
      create: {
        habitId: id,
        completedDate,
        notes: parsed.data.notes ?? null,
      },
      update: {
        notes: parsed.data.notes ?? null,
      },
    });

    logActivity({
      userId: dbUser.id,
      action: "habit.completed",
      entityType: "habit",
      entityId: id,
      entityTitle: habit.name,
      metadata: { date: dateStr },
    });

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/habits/[id]/completions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/habits/[id]/completions — unmark a habit for a date
export async function DELETE(
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

    const habit = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr =
      searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const [year, month, day] = dateStr.split("-").map(Number);
    const completedDate = new Date(year, month - 1, day);

    await prisma.habitCompletion
      .delete({
        where: {
          habitId_completedDate: { habitId: id, completedDate },
        },
      })
      .catch(() => {
        // Silently ignore if not found — idempotent
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/habits/[id]/completions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
