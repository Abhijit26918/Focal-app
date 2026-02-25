import { Task, Subtask, Tag, Notification, Habit, HabitCompletion } from "@prisma/client";

// ============================================
// EXTENDED TYPES (Prisma models with relations)
// ============================================

export type TaskWithRelations = Task & {
  subtasks: Subtask[];
  tags: Array<{ tag: Tag }>;
  dependencies: Array<{ dependsOnTask: Task }>;
  dependents: Array<{ task: Task }>;
};

export type TaskWithSubtasks = Task & {
  subtasks: Subtask[];
};

export type TaskWithTags = Task & {
  tags: Array<{ tag: Tag }>;
};

export type HabitWithCompletions = Habit & {
  completions: HabitCompletion[];
};

// ============================================
// FORM INPUT TYPES
// ============================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: string;
  priority: string;
  status?: string;
  dueDate?: Date | string | null;
  estimatedDuration?: number | null;
  recurringPattern?: RecurringPattern | null;
  tags?: string[];
  subtasks?: { title: string }[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  category: string;
  targetFrequency: string;
  icon?: string;
  color?: string;
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
  id: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface RecurringPattern {
  type: "daily" | "weekly" | "monthly";
  interval: number;
  endDate?: string;
}

export interface TaskFilters {
  status?: string[];
  category?: string[];
  priority?: string[];
  tags?: string[];
  search?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todayTasks: number;
  completionRate: number;
}

export interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  inProgress: number;
  completionRate: number;
}

export interface ProductivityData {
  date: string;
  completed: number;
  created: number;
  total: number;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// UI COMPONENT TYPES
// ============================================

export type ViewMode = "list" | "kanban" | "calendar" | "today";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  active?: boolean;
}

export interface NotificationPreferences {
  browserNotifications: boolean;
  emailNotifications: boolean;
  dailyDigest: boolean;
  reminderTimes: number[]; // Minutes before due date
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  defaultView: ViewMode;
  notifications: NotificationPreferences;
  dateFormat: string;
  timeFormat: "12h" | "24h";
}
