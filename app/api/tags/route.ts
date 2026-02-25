import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

// Preset colors auto-assigned when creating tags without an explicit color
const TAG_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

// GET /api/tags — list all tags for the current user
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncUser();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: dbUser.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[GET /api/tags]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tags — create a tag (upserts if name already exists for user)
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
    const parsed = CreateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Auto-assign color if not specified — cycle through presets based on tag count
    let color = parsed.data.color;
    if (!color) {
      const count = await prisma.tag.count({ where: { userId: dbUser.id } });
      color = TAG_COLORS[count % TAG_COLORS.length];
    }

    // Upsert — if tag name already exists for this user, return it unchanged
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name: parsed.data.name, userId: dbUser.id } },
      create: { name: parsed.data.name, color, userId: dbUser.id },
      update: {},
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tags]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
