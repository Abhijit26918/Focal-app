// Force dynamic so Clerk's ClerkProvider is not invoked during static prerendering
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 shadow-lg dark:bg-slate-800">
        <span className="font-serif text-5xl font-bold italic text-white" aria-hidden>
          A
        </span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
