import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { UserPreferences } from "@/types";

const prefsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
  reminderTimes: z.array(z.number().int().min(0).max(10080)).optional(), // minutes before due
  browserNotifications: z.boolean().optional(),
});

// GET /api/notifications/preferences — return the user's notification preferences
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prefs = (user.preferences as Partial<UserPreferences> | null) ?? {};
    const notifications = prefs.notifications ?? defaultNotificationPrefs();

    return NextResponse.json({ preferences: notifications });
  } catch (err) {
    console.error("[GET /api/notifications/preferences]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications/preferences — update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = prefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentPrefs = (user.preferences as Partial<UserPreferences> | null) ?? {};
    const currentNotifs = currentPrefs.notifications ?? defaultNotificationPrefs();

    const updatedNotifs = { ...currentNotifs, ...parsed.data };
    const updatedPrefs = { ...currentPrefs, notifications: updatedNotifs };

    await prisma.user.update({
      where: { clerkId },
      data: { preferences: updatedPrefs },
    });

    return NextResponse.json({ preferences: updatedNotifs });
  } catch (err) {
    console.error("[PATCH /api/notifications/preferences]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function defaultNotificationPrefs() {
  return {
    browserNotifications: true,
    emailNotifications: false,
    dailyDigest: false,
    deadlineReminders: false,
    reminderTimes: [60, 1440], // 1 hour and 24 hours before due
  };
}
