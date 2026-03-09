import { describe, it, expect } from "vitest";
import {
  calculateNextDueDate,
  formatRecurringPattern,
} from "@/lib/utils/recurring";

describe("calculateNextDueDate", () => {
  const base = new Date("2025-01-10");

  it("adds interval days for daily pattern", () => {
    const result = calculateNextDueDate(base, { type: "daily", interval: 1 });
    expect(result.toISOString().split("T")[0]).toBe("2025-01-11");
  });

  it("adds multiple days for daily interval > 1", () => {
    const result = calculateNextDueDate(base, { type: "daily", interval: 3 });
    expect(result.toISOString().split("T")[0]).toBe("2025-01-13");
  });

  it("adds 7 days for weekly interval 1", () => {
    const result = calculateNextDueDate(base, { type: "weekly", interval: 1 });
    expect(result.toISOString().split("T")[0]).toBe("2025-01-17");
  });

  it("adds 14 days for weekly interval 2", () => {
    const result = calculateNextDueDate(base, { type: "weekly", interval: 2 });
    expect(result.toISOString().split("T")[0]).toBe("2025-01-24");
  });

  it("adds 1 month for monthly interval 1", () => {
    const result = calculateNextDueDate(base, { type: "monthly", interval: 1 });
    expect(result.toISOString().split("T")[0]).toBe("2025-02-10");
  });

  it("does not mutate the original base date", () => {
    const original = new Date("2025-01-10");
    calculateNextDueDate(original, { type: "daily", interval: 5 });
    expect(original.toISOString().split("T")[0]).toBe("2025-01-10");
  });
});

describe("formatRecurringPattern", () => {
  it('returns "Daily" for daily interval 1', () => {
    expect(formatRecurringPattern({ type: "daily", interval: 1 })).toBe("Daily");
  });

  it('returns "Weekly" for weekly interval 1', () => {
    expect(formatRecurringPattern({ type: "weekly", interval: 1 })).toBe("Weekly");
  });

  it('returns "Monthly" for monthly interval 1', () => {
    expect(formatRecurringPattern({ type: "monthly", interval: 1 })).toBe("Monthly");
  });

  it('returns "Every 3 days" for daily interval 3', () => {
    expect(formatRecurringPattern({ type: "daily", interval: 3 })).toBe("Every 3 days");
  });

  it('returns "Every 2 weeks" for weekly interval 2', () => {
    expect(formatRecurringPattern({ type: "weekly", interval: 2 })).toBe("Every 2 weeks");
  });

  it('returns "Every 6 months" for monthly interval 6', () => {
    expect(formatRecurringPattern({ type: "monthly", interval: 6 })).toBe("Every 6 months");
  });
});
