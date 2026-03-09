/**
 * Offline fallback page — shown by the service worker when a navigation
 * request fails because the device is offline and no cached version exists.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 shadow-lg dark:bg-slate-800">
        <span
          className="font-serif text-5xl font-bold italic text-white"
          aria-hidden
        >
          A
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        You&apos;re offline
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Focal can&apos;t reach the server right now. Check your internet
        connection — your cached data is still available on pages you&apos;ve
        visited before.
      </p>

      {/* Retry button — forces a reload which the SW will intercept again */}
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Try again
      </button>

      {/* Cached pages the user can navigate to */}
      <nav className="mt-10 flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
          Cached pages
        </p>
        {[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/analytics", label: "Analytics" },
          { href: "/habits", label: "Habits" },
          { href: "/activity", label: "Activity" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-50"
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
