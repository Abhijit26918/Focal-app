"use client";

import { useMemo } from "react";
import { addDays, format, startOfWeek, parseISO } from "date-fns";

interface Props {
  /** "yyyy-MM-dd" → completion count */
  heatmap: Record<string, number>;
}

// 5-level color scale (GitHub-style, using Tailwind classes)
const LEVEL_CLASSES = [
  "bg-slate-100 dark:bg-slate-800",          // 0 — empty
  "bg-emerald-200 dark:bg-emerald-950",       // 1 — 1–2
  "bg-emerald-300 dark:bg-emerald-800",       // 2 — 3–4
  "bg-emerald-500 dark:bg-emerald-600",       // 3 — 5–6
  "bg-emerald-700 dark:bg-emerald-400",       // 4 — 7+
];

// Short day labels aligned to Mon-start ISO weeks
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function ProductivityHeatmap({ heatmap }: Props) {
  const { weeks, monthLabels, totalCompletions, activeDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, "yyyy-MM-dd");

    // Align to the Monday of the week that contains (today - 364 days)
    const rangeStart = startOfWeek(addDays(today, -364), { weekStartsOn: 1 });

    type Cell = { date: string; count: number; isToday: boolean; isFuture: boolean };
    const weeks: Cell[][] = [];
    let cursor = new Date(rangeStart);

    while (cursor <= today) {
      const week: Cell[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(cursor, i);
        const dateStr = format(d, "yyyy-MM-dd");
        week.push({
          date: dateStr,
          count: heatmap[dateStr] ?? 0,
          isToday: dateStr === todayStr,
          isFuture: d > today,
        });
      }
      weeks.push(week);
      cursor = addDays(cursor, 7);
    }

    // Month labels: one per column where a new month starts
    const monthLabels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const month = parseISO(week[0].date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          weekIndex: wi,
          label: format(parseISO(week[0].date), "MMM"),
        });
        lastMonth = month;
      }
    });

    // Summary stats
    let totalCompletions = 0;
    let activeDays = 0;
    for (const count of Object.values(heatmap)) {
      totalCompletions += count;
      if (count > 0) activeDays++;
    }

    return { weeks, monthLabels, totalCompletions, activeDays };
  }, [heatmap]);

  // Cell size: 12px (w-3 h-3) + 4px gap (gap-1) = 16px per column/row
  const COL_WIDTH = 16;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        {/* Day-of-week labels */}
        <div className="mr-1 flex flex-col gap-1 pt-5">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="flex h-3 items-center">
              <span className="w-7 text-right text-[9px] leading-none text-slate-400">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Columns */}
        <div>
          {/* Month labels row */}
          <div className="relative mb-1 h-4">
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={`${label}-${weekIndex}`}
                className="absolute text-[10px] leading-none text-slate-500 dark:text-slate-400"
                style={{ left: weekIndex * COL_WIDTH }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(({ date, count, isToday, isFuture }) => (
                  <div key={date} className="group/cell relative">
                    {/* Cell */}
                    <div
                      className={[
                        "h-3 w-3 rounded-sm transition-transform group-hover/cell:scale-125",
                        isFuture
                          ? "opacity-0 pointer-events-none"
                          : LEVEL_CLASSES[getLevel(count)],
                        isToday
                          ? "ring-1 ring-slate-500 ring-offset-1 dark:ring-slate-400"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />

                    {/* Tooltip — pure CSS, no JS state */}
                    {!isFuture && (
                      <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1.5 text-[10px] leading-snug text-white shadow-xl group-hover/cell:visible dark:bg-slate-700">
                        <p className="font-semibold">
                          {count === 0
                            ? "No completions"
                            : `${count} task${count !== 1 ? "s" : ""} completed`}
                        </p>
                        <p className="text-slate-400">
                          {format(parseISO(date), "EEEE, MMM d, yyyy")}
                        </p>
                        {/* Tooltip arrow */}
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: stats + legend */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalCompletions}
          </span>{" "}
          completions across{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {activeDays}
          </span>{" "}
          active days in the past year
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Less</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
          ))}
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
}
