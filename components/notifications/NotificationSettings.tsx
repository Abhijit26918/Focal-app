"use client";

import { useEffect, useState } from "react";
import { Mail, Bell, Loader2, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationPreferences } from "@/types";

interface Prefs extends NotificationPreferences {
  deadlineReminders: boolean;
}

const DEFAULT_PREFS: Prefs = {
  browserNotifications: true,
  emailNotifications: false,
  dailyDigest: false,
  deadlineReminders: false,
  reminderTimes: [60, 1440],
};

// ── Toggle row ──────────────────────────────────────────────────────────────

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`h-5 w-9 rounded-full transition-colors ${
            checked ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              checked ? "left-[18px]" : "left-0.5"
            }`}
          />
        </div>
      </div>
    </label>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function NotificationSettings() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<{ preferences: Prefs }>({
    queryKey: ["notification-preferences"],
    queryFn: () => fetch("/api/notifications/preferences").then((r) => r.json()),
  });

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  // Sync fetched prefs into local state once loaded
  useEffect(() => {
    if (data?.preferences) {
      setPrefs({ ...DEFAULT_PREFS, ...data.preferences });
    }
  }, [data]);

  const { mutate: savePrefs, isPending: isSaving } = useMutation({
    mutationFn: (updated: Partial<Prefs>) =>
      fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(patch);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Browser notifications */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Browser Notifications
          </h3>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700">
          <Toggle
            label="Browser alerts"
            description="Get pop-up alerts for overdue and due-today tasks, even when Focal isn't your active tab."
            checked={prefs.browserNotifications}
            onChange={(v) => update({ browserNotifications: v })}
          />
        </div>
      </section>

      {/* Email notifications */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Email Notifications
          </h3>
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
          <Toggle
            label="Enable email notifications"
            description="Master switch — must be on for any emails to be sent."
            checked={prefs.emailNotifications}
            onChange={(v) =>
              update({ emailNotifications: v, dailyDigest: v ? prefs.dailyDigest : false, deadlineReminders: v ? prefs.deadlineReminders : false })
            }
          />
          <Toggle
            label="Daily digest"
            description="Receive a morning summary of overdue, due-today, and upcoming tasks every day at 7 AM."
            checked={prefs.dailyDigest}
            onChange={(v) => update({ dailyDigest: v })}
            disabled={!prefs.emailNotifications}
          />
          <Toggle
            label="Deadline reminders"
            description="Get an email when a task is due within 2 hours. Sends at most once per task per session."
            checked={prefs.deadlineReminders}
            onChange={(v) => update({ deadlineReminders: v })}
            disabled={!prefs.emailNotifications}
          />
        </div>

        {!prefs.emailNotifications && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Enable the master switch above to configure individual email notifications.
          </p>
        )}
      </section>

      {/* Save confirmation */}
      {(isSaving || saved) && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Preferences saved</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
