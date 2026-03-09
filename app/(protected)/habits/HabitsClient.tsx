"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Flame } from "lucide-react";
import { FocalIcon } from "@/components/ui/focal-logo";
import { HabitList } from "@/components/habits/HabitList";

export function HabitsClient() {
  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <FocalIcon className="h-5 w-5 text-slate-900 dark:text-slate-50" />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              focal
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Page title */}
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Habit Tracker
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <HabitList />
      </main>
    </div>
  );
}
