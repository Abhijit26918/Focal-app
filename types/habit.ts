export type TargetFrequency = "daily" | "weekdays" | "weekly" | "2x_week" | "3x_week";

export const FREQUENCY_LABELS: Record<TargetFrequency, string> = {
  daily: "Every day",
  weekdays: "Weekdays (Mon–Fri)",
  weekly: "Once a week",
  "2x_week": "2× per week",
  "3x_week": "3× per week",
};

export interface HabitWithStats {
  id: string;
  name: string;
  description: string | null;
  category: string;
  targetFrequency: TargetFrequency;
  icon: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  /** "yyyy-MM-dd" strings for the last 14 days */
  completionDates: string[];
  completedToday: boolean;
  streak: number;
}
