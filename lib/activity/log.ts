import { prisma } from "@/lib/db";

interface LogActivityParams {
  userId: string;
  action: string;
  entityType: "task" | "habit";
  entityId?: string;
  entityTitle?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logger.
 * Never throws — logging failures must not break the main operation.
 */
export function logActivity(params: LogActivityParams): void {
  prisma.activityLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        entityTitle: params.entityTitle ?? null,
        metadata: (params.metadata ?? null) as never,
      },
    })
    .catch((err) => {
      console.error("[logActivity]", err);
    });
}
