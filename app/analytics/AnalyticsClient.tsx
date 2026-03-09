"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductivityHeatmap } from "@/components/analytics/ProductivityHeatmap";
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Percent,
  Flame,
  Trophy,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { FocalIcon } from "@/components/ui/focal-logo";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HabitStreak {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  color: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

interface AnalyticsData {
  summary: { total: number; completed: number; active: number; completionRate: number };
  byCategory: { name: string; total: number; completed: number; active: number }[];
  byPriority: { name: string; value: number }[];
  byStatus: { name: string; value: number; color: string }[];
  completionTrend: { date: string; completed: number }[];
  heatmap: Record<string, number>;
  byHour: { hour: string; completed: number }[];
  habitStreaks: HabitStreak[];
  habitTrend: { date: string; completions: number }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "#8b5cf6", "#f59e0b", "#06b6d4", "#22c55e",
  "#6366f1", "#ec4899", "#94a3b8",
];

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "#ef4444",
  High: "#f97316",
  Medium: "#3b82f6",
  Low: "#94a3b8",
};

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function RangeSelector({
  range,
  onChange,
}: {
  range: number;
  onChange: (r: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            range === opt.value
              ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Single habit streak card */
function HabitStreakCard({ habit }: { habit: HabitStreak }) {
  const isActive =
    habit.lastCompletedDate === new Date().toISOString().split("T")[0] ||
    habit.lastCompletedDate ===
      new Date(Date.now() - 86400000).toISOString().split("T")[0];

  return (
    <Card className="relative overflow-hidden">
      {/* Color accent strip */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ background: habit.color }}
      />
      <CardContent className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {habit.name}
            </p>
            <p className="text-xs text-slate-400">
              {habit.category.replace(/([A-Z])/g, " $1").trim()}
            </p>
          </div>
          {/* Current streak badge */}
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              isActive && habit.currentStreak > 0
                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            <Flame className="h-3 w-3" />
            {habit.currentStreak}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Best: <span className="font-semibold text-slate-700 dark:text-slate-300">{habit.longestStreak}</span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5 text-green-500" />
            Total: <span className="font-semibold text-slate-700 dark:text-slate-300">{habit.totalCompletions}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex flex-1 items-center gap-2">
            <FocalIcon className="h-5 w-5 text-slate-900 dark:text-slate-50" />
            <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50">Analytics</span>
          </div>
          {/* Time-range selector */}
          <RangeSelector range={range} onChange={setRange} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-72 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !data ? (
          <p className="text-center text-slate-500">Failed to load analytics.</p>
        ) : (
          <div className="space-y-6">
            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Tasks", value: data.summary.total, icon: ListTodo, color: "text-slate-600" },
                { label: "Completed", value: data.summary.completed, icon: CheckCircle2, color: "text-green-600" },
                { label: "Active", value: data.summary.active, icon: TrendingUp, color: "text-blue-600" },
                { label: "Completion Rate", value: `${data.summary.completionRate}%`, icon: Percent, color: "text-purple-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <Icon className={`h-8 w-8 shrink-0 ${color}`} />
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Task completion trend ──────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Task Completions — Last {range} Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.completionTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      interval={range === 7 ? 0 : range === 30 ? 4 : 8}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#completedGrad)"
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Productivity heatmap ───────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Productivity Heatmap — Past Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductivityHeatmap heatmap={data.heatmap ?? {}} />
              </CardContent>
            </Card>

            {/* ── Habit Analytics ────────────────────────────────────────── */}
            {data.habitStreaks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Habit Analytics
                </h2>

                {/* Habit streak cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.habitStreaks
                    .sort((a, b) => b.currentStreak - a.currentStreak)
                    .map((habit) => (
                      <HabitStreakCard key={habit.id} habit={habit} />
                    ))}
                </div>

                {/* Habit completion trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Habit Completions — Last {range} Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data.habitTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          interval={range === 7 ? 0 : range === 30 ? 4 : 8}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                        <Bar
                          dataKey="completions"
                          name="Habits completed"
                          fill="#8b5cf6"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Most productive time of day ────────────────────────────── */}
            {data.byHour.some((h) => h.completed > 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Most Productive Time of Day
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.byHour} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 9, fill: "#94a3b8" }}
                        interval={2}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                      <Bar
                        dataKey="completed"
                        name="Tasks completed"
                        radius={[3, 3, 0, 0]}
                      >
                        {data.byHour.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.completed === Math.max(...data.byHour.map((h) => h.completed)) && entry.completed > 0
                              ? "#f59e0b"
                              : "#3b82f6"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Peak hour callout */}
                  {(() => {
                    const peak = data.byHour.reduce((a, b) => (b.completed > a.completed ? b : a));
                    if (peak.completed === 0) return null;
                    return (
                      <p className="mt-2 text-center text-xs text-slate-500">
                        Peak productivity at{" "}
                        <span className="font-semibold text-amber-600">{peak.hour}</span>
                        {" "}with{" "}
                        <span className="font-semibold">{peak.completed}</span> tasks completed
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* ── Bottom row: Category bar + Priority/Status pies ────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Tasks by Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tasks by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.byCategory.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">No tasks yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={data.byCategory}
                        layout="vertical"
                        margin={{ top: 0, right: 16, bottom: 0, left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickLine={false}
                          axisLine={false}
                          width={80}
                        />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[0, 3, 3, 0]} stackId="a" />
                        <Bar dataKey="active" name="Active" fill="#3b82f6" radius={[0, 3, 3, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Right column: Priority + Status donuts */}
              <div className="space-y-6">
                {/* By Priority */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      By Priority
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <ResponsiveContainer width="50%" height={120}>
                      <PieChart>
                        <Pie
                          data={data.byPriority.filter((p) => p.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          strokeWidth={1}
                        >
                          {data.byPriority.map((entry) => (
                            <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {data.byPriority.filter((p) => p.value > 0).map((p) => (
                        <div key={p.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: PRIORITY_COLORS[p.name] }}
                          />
                          <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                          <span className="ml-auto font-semibold text-slate-900 dark:text-slate-50">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* By Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      By Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <ResponsiveContainer width="50%" height={120}>
                      <PieChart>
                        <Pie
                          data={data.byStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          strokeWidth={1}
                        >
                          {data.byStatus.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {data.byStatus.map((s) => (
                        <div key={s.name} className="flex items-center gap-2 text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-slate-600 dark:text-slate-400">{s.name}</span>
                          <span className="ml-auto font-semibold text-slate-900 dark:text-slate-50">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
