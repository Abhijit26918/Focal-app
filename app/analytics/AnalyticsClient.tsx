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
} from "lucide-react";
import { FocalIcon } from "@/components/ui/focal-logo";

interface AnalyticsData {
  summary: { total: number; completed: number; active: number; completionRate: number };
  byCategory: { name: string; total: number; completed: number; active: number }[];
  byPriority: { name: string; value: number }[];
  byStatus: { name: string; value: number; color: string }[];
  completionTrend: { date: string; completed: number }[];
  heatmap: Record<string, number>;
}

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

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
          <div className="flex items-center gap-2">
            <FocalIcon className="h-5 w-5 text-slate-900 dark:text-slate-50" />
            <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50">Analytics</span>
          </div>
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
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-72 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
          </div>
        ) : !data ? (
          <p className="text-center text-slate-500">Failed to load analytics.</p>
        ) : (
          <div className="space-y-6">
            {/* Summary tiles */}
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

            {/* Completion trend — last 30 days */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Task Completions — Last 30 Days
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
                      interval={4}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
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

            {/* Productivity heatmap — last 365 days */}
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

            {/* Bottom row: Category bar + Priority/Status pie */}
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
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[0, 3, 3, 0]} stackId="a" />
                        <Bar dataKey="active" name="Active" fill="#3b82f6" radius={[0, 3, 3, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Right column: two small pies stacked */}
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
