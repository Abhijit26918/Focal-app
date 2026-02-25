import Link from "next/link";
import { CheckCircle2, TrendingUp, Calendar, Zap } from "lucide-react";
import { FocalIcon } from "@/components/ui/focal-logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <FocalIcon className="h-8 w-8 text-slate-900 dark:text-slate-50" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              focal
            </span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
            Manage Your Multi-Domain Life
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              In One Place
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            A comprehensive task management system designed for ambitious individuals juggling
            Data Science, Entrepreneurship, AI Research, Fitness, Studies, and Personal growth.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Zap className="h-5 w-5" />
              Start Free
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CheckCircle2 className="h-8 w-8" />}
            title="Smart Task Management"
            description="Create, organize, and track tasks across Data Science, Entrepreneurship, AI Research, Fitness, and more."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8" />}
            title="Multi-View Dashboard"
            description="Switch between Today, Calendar, List, and Kanban views. See what matters most, when it matters."
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Analytics & Insights"
            description="Track productivity patterns, completion rates, and identify which life domains need attention."
          />
          <FeatureCard
            icon={<FocalIcon className="h-8 w-8" />}
            title="Habit Tracking"
            description="Build daily habits across all your domains. Track streaks and maintain consistency."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Priority Management"
            description="Urgent, High, Medium, Low priorities with color coding and smart filtering."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-8 w-8" />}
            title="Subtasks & Dependencies"
            description="Break down complex tasks. Set dependencies to ensure proper task sequencing."
          />
        </div>

        {/* CTA */}
        <div className="mt-32 rounded-2xl bg-slate-900 px-6 py-16 text-center dark:bg-slate-800">
          <h2 className="text-3xl font-bold text-white">
            Ready to Take Control of Your Life?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Join ambitious individuals who are managing their multi-domain lives with Focal.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-slate-900 transition-colors hover:bg-slate-100"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>&copy; 2026 Focal. Built with Next.js, Prisma, and Clerk.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="text-slate-900 dark:text-slate-50">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
