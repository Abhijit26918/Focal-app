export interface RecurringPattern {
  type: "daily" | "weekly" | "monthly";
  interval: number;
}

/**
 * Given a base due date and a recurring pattern, returns the next due date.
 * If baseDue is in the past, the calculation still uses it as the anchor
 * (so the next occurrence is relative to the last due date, not today).
 */
export function calculateNextDueDate(baseDue: Date, pattern: RecurringPattern): Date {
  const next = new Date(baseDue);

  switch (pattern.type) {
    case "daily":
      next.setDate(next.getDate() + pattern.interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + pattern.interval * 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + pattern.interval);
      break;
  }

  return next;
}

/**
 * Human-readable label for a recurring pattern.
 * Examples: "Daily", "Every 3 days", "Weekly", "Every 2 weeks", "Monthly"
 */
export function formatRecurringPattern(pattern: RecurringPattern): string {
  const { type, interval } = pattern;

  if (interval === 1) {
    // "Daily" | "Weekly" | "Monthly"
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  const unit =
    type === "daily" ? "days" : type === "weekly" ? "weeks" : "months";

  return `Every ${interval} ${unit}`;
}
