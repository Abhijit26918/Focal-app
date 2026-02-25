import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/auth/sync-user";

// DELETE /api/tags/[id] — delete a tag and all its task associations
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

    const tag = await prisma.tag.findFirst({ where: { id, userId: dbUser.id } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Cascade delete of task_tags is handled by Prisma schema (onDelete: Cascade)
    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tags/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
