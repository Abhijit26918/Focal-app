import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

const UpdateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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
  targetFrequency: z
    .enum(["daily", "weekdays", "weekly", "2x_week", "3x_week"])
    .optional(),
  icon: z.string().optional().nullable(),
  color: z.string().optional(),
});

// PUT /api/habits/[id] — update a habit
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

    const existing = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateHabitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description,
        }),
        ...(parsed.data.category !== undefined && {
          category: parsed.data.category,
        }),
        ...(parsed.data.targetFrequency !== undefined && {
          targetFrequency: parsed.data.targetFrequency,
        }),
        ...(parsed.data.icon !== undefined && { icon: parsed.data.icon }),
        ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      },
    });

    return NextResponse.json({ habit });
  } catch (error) {
    console.error("[PUT /api/habits/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/habits/[id] — delete a habit and all its completions
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

    const existing = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/habits/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
