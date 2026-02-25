"use client";

import { useState, useEffect } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { UserButton } from "@clerk/nextjs";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  LayoutList,
  Dumbbell,
  BookOpen,
  Brain,
  Briefcase,
  Star,
  User,
  BarChart2,
  CalendarClock,
  Calendar,
  Search,
  PieChart,
  Tag,
  X,
  Flame,
  History,
} from "lucide-react";
import { FocalIcon } from "@/components/ui/focal-logo";
import Link from "next/link";
import { CalendarView } from "@/components/calendar/CalendarView";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface DashboardClientProps {
  userName: string;
  userAvatar: string;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

const SIDEBAR_NAV = [
  { label: "All Tasks", value: "", icon: LayoutList, isToday: false },
  { label: "Today", value: "__today__", icon: CalendarClock, isToday: true },
  { label: "Calendar", value: "__calendar__", icon: Calendar, isToday: false },
  { label: "Data Science", value: "DataScience", icon: BarChart2, isToday: false },
  { label: "AI Research", value: "AIResearch", icon: Brain, isToday: false },
  { label: "Entrepreneurship", value: "Entrepreneurship", icon: Briefcase, isToday: false },
  { label: "Studies", value: "Studies", icon: BookOpen, isToday: false },
  { label: "Fitness", value: "Fitness", icon: Dumbbell, isToday: false },
  { label: "Opportunities", value: "Opportunities", icon: Star, isToday: false },
  { label: "Personal", value: "Personal", icon: User, isToday: false },
];

// "__all__" is a sentinel — SelectItem can't have empty string values
const STATUS_FILTERS = [
  { label: "All Statuses", value: "__all__" },
  { label: "To Do", value: "ToDo" },
  { label: "In Progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const PRIORITY_FILTERS = [
  { label: "All Priorities", value: "__all__" },
  { label: "Urgent", value: "Urgent" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

export function DashboardClient({ userName }: DashboardClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [priorityFilter, setPriorityFilter] = useState("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [activeTagId, setActiveTagId] = useState<string | undefined>(undefined);
  const [commandOpen, setCommandOpen] = useState(false);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Fetch user tags for sidebar
  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setTags(data.tags ?? []))
      .catch(() => {});
  }, [refreshKey]);

  // Debounce search — wait 350ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Ctrl+K / Cmd+K — open command palette
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isToday = activeNav === "__today__";
  const isCalendar = activeNav === "__calendar__";
  const categoryFilter =
    isToday || isCalendar || activeNav === "" ? undefined : activeNav;
  const activeNavLabel = SIDEBAR_NAV.find((n) => n.value === activeNav)?.label ?? "All Tasks";
  // Treat "__all__" as no filter
  const activeStatus = statusFilter === "__all__" ? undefined : statusFilter;
  const activePriority = priorityFilter === "__all__" ? undefined : priorityFilter;
  const hasActiveFilter = activeStatus || activePriority || activeNav || debouncedSearch || activeTagId;

  function clearAll() {
    setStatusFilter("__all__");
    setPriorityFilter("__all__");
    setActiveNav("");
    setSearchQuery("");
    setDebouncedSearch("");
    setActiveTagId(undefined);
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Sidebar ── */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <FocalIcon className="h-5 w-5 text-slate-900 dark:text-slate-50" />
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
            focal
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Views
          </p>
          {SIDEBAR_NAV.map(({ label, value, icon: Icon, isToday: today }) => (
            <button
              key={value}
              onClick={() => setActiveNav(value)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors ${
                activeNav === value
                  ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              } ${today && activeNav !== value ? "text-blue-600 dark:text-blue-400" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}

          {/* Tags section */}
          {tags.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tags
              </p>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTagId(activeTagId === tag.id ? undefined : tag.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    activeTagId === tag.id
                      ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                  }`}
                >
                  <Tag className="h-3.5 w-3.5 shrink-0" style={{ color: tag.color }} />
                  <span className="truncate">{tag.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Analytics + Habits links */}
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Insights
            </p>
            <Link
              href="/analytics"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              <PieChart className="h-4 w-4 shrink-0" />
              Analytics
            </Link>
            <Link
              href="/habits"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              <Flame className="h-4 w-4 shrink-0 text-orange-500" />
              Habits
            </Link>
            <Link
              href="/activity"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              <History className="h-4 w-4 shrink-0" />
              Activity
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <UserButton afterSignOutUrl="/" />
          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
            {userName}
          </span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {debouncedSearch ? `Search: "${debouncedSearch}"` : activeNavLabel}
            </h1>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              className="h-8 pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setDebouncedSearch(""); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Command palette trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 sm:flex"
            aria-label="Open command palette"
          >
            <Search className="h-3 w-3" />
            <span>Quick actions</span>
            <kbd className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] dark:bg-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Notification bell */}
          <NotificationBell />

          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Task
          </Button>
        </header>

        {/* Stats bar — hidden in calendar view */}
        {!isCalendar && <StatsBar refreshKey={refreshKey} />}

        {/* Filters bar — hidden in calendar view */}
        {!isCalendar && (
          <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-900">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilter && (
              <Badge
                variant="secondary"
                className="cursor-pointer text-xs"
                onClick={clearAll}
              >
                Clear all
              </Badge>
            )}
          </div>
        )}

        {/* Main content — Calendar or Task list */}
        {isCalendar ? (
          <main className="flex min-h-0 flex-1 overflow-hidden">
            <CalendarView refreshKey={refreshKey} onRefresh={refresh} />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-6">
            <TaskList
              filters={{
                category: categoryFilter,
                status: activeStatus,
                priority: activePriority,
                today: isToday || undefined,
                search: debouncedSearch || undefined,
                tag: activeTagId,
              }}
              refreshKey={refreshKey}
            />
          </main>
        )}
      </div>

      <TaskForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={(value) => {
          setActiveNav(value);
          setActiveTagId(undefined);
        }}
        onTaskCreated={refresh}
      />
    </div>
  );
}
