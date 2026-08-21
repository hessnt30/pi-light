"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { createClient } from "@/lib/supabase/client";
import { CALENDAR_COLORS } from "@/lib/types/database";
import type { CalendarView, DisplaySettings, ThemeMode } from "@/lib/types/database";
import { useCalendars, useSettings } from "@/lib/hooks/useCalendarEvents";
import { useTheme } from "@/lib/hooks/useTheme";

export function SettingsPageClient({
  initialSettings,
  initialHousehold,
  initialAccounts,
  role,
}: {
  initialSettings: DisplaySettings;
  initialHousehold: { id: string; name: string; invite_code: string };
  initialAccounts: Array<{ id: string; google_email: string; created_at: string }>;
  role: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: mutateSettings } = useSettings();
  const { data: calendarsData, mutate: mutateCalendars } = useCalendars();
  const { setTheme } = useTheme();

  const [settings, setSettings] = useState(initialSettings);
  const [householdName, setHouseholdName] = useState(initialHousehold.name);
  const [inviteCode, setInviteCode] = useState(initialHousehold.invite_code);
  const [joinCode, setJoinCode] = useState("");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const calendars = calendarsData?.calendars ?? [];
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  async function saveSettings(updates: Partial<DisplaySettings>) {
    setSaving(true);
    const next = { ...settings, ...updates };
    setSettings(next);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      if (updates.theme) setTheme(updates.theme as ThemeMode);
      mutateSettings();
      setMessage("Settings saved");
    }
    setSaving(false);
  }

  async function updateCalendar(
    id: string,
    updates: { enabled?: boolean; color?: string },
  ) {
    await fetch(`/api/calendars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    mutateCalendars();
  }

  async function disconnectAccount(id: string) {
    await fetch(`/api/google/accounts/${id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    mutateCalendars();
  }

  async function syncAccount(id: string) {
    await fetch(`/api/google/accounts/${id}/sync`, { method: "POST" });
    mutateCalendars();
  }

  async function regenerateInvite() {
    const res = await fetch("/api/household/invite", { method: "POST" });
    const data = await res.json();
    if (data.invite_code) setInviteCode(data.invite_code);
  }

  async function joinHousehold() {
    const res = await fetch("/api/household/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: joinCode }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setMessage("Invalid invite code");
    }
  }

  async function saveHouseholdName() {
    await fetch("/api/household", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: householdName }),
    });
    setMessage("Household name updated");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/")}>
            ← Back to calendar
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      {connected && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-green-800 dark:bg-green-950/30 dark:text-green-300">
          Google account connected successfully.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-800 dark:bg-red-950/30 dark:text-red-300">
          Connection failed. Please try again.
        </p>
      )}
      {message && (
        <p className="text-sm text-muted">{message}</p>
      )}

      {/* Google Accounts */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-semibold">Google Accounts</h2>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
            >
              <span>{account.google_email}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => syncAccount(account.id)}>
                  Sync
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => disconnectAccount(account.id)}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => { window.location.href = "/api/google/connect"; }}
        >
          Connect Google Account
        </Button>
      </section>

      {/* Calendars */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-semibold">Calendars</h2>
        {calendars.length === 0 ? (
          <p className="text-muted">Connect a Google account to see calendars.</p>
        ) : (
          <div className="space-y-4">
            {calendars.map((cal) => (
              <div
                key={cal.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{cal.name}</p>
                  <p className="text-sm text-muted">{cal.google_email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {CALENDAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateCalendar(cal.id, { color })}
                        className="h-6 w-6 rounded-full border-2 border-transparent hover:border-foreground"
                        style={{
                          backgroundColor: color,
                          outline: cal.color === color ? "2px solid var(--foreground)" : undefined,
                        }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                  <Toggle
                    checked={cal.enabled}
                    onChange={(enabled) => updateCalendar(cal.id, { enabled })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Display preferences */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-semibold">Display</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Default view</span>
            <select
              value={settings.default_view}
              onChange={(e) =>
                saveSettings({ default_view: e.target.value as CalendarView })
              }
              className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="day">Day</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-muted">Week starts on</span>
            <select
              value={settings.week_starts_on}
              onChange={(e) =>
                saveSettings({
                  week_starts_on: Number(e.target.value) as 0 | 1,
                })
              }
              className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-muted">Timezone</span>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              onBlur={() => saveSettings({ timezone: settings.timezone })}
              className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Theme</span>
            <select
              value={settings.theme}
              onChange={(e) =>
                saveSettings({ theme: e.target.value as ThemeMode })
              }
              className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <Toggle
            label="Show clock"
            checked={settings.show_clock}
            onChange={(v) => saveSettings({ show_clock: v })}
          />
          <Toggle
            label="Show upcoming events"
            checked={settings.show_upcoming}
            onChange={(v) => saveSettings({ show_upcoming: v })}
          />
          <Toggle
            label="Show weather"
            checked={settings.show_weather}
            onChange={(v) => saveSettings({ show_weather: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-muted">Weather latitude</span>
              <input
                type="number"
                step="any"
                value={settings.weather_lat ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weather_lat: e.target.value ? Number(e.target.value) : null,
                  })
                }
                onBlur={() =>
                  saveSettings({ weather_lat: settings.weather_lat })
                }
                className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Weather longitude</span>
              <input
                type="number"
                step="any"
                value={settings.weather_lon ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weather_lon: e.target.value ? Number(e.target.value) : null,
                  })
                }
                onBlur={() =>
                  saveSettings({ weather_lon: settings.weather_lon })
                }
                className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2"
              />
            </label>
          </div>
        </div>
        {saving && <p className="mt-2 text-sm text-muted">Saving…</p>}
      </section>

      {/* Household */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-semibold">Household</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              disabled={role !== "owner"}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2"
            />
            {role === "owner" && (
              <Button onClick={saveHouseholdName}>Save</Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-surface-hover px-3 py-2 text-sm">
              {inviteCode}
            </code>
            <Button
              size="sm"
              onClick={() => navigator.clipboard.writeText(inviteCode)}
            >
              Copy
            </Button>
            {role === "owner" && (
              <Button size="sm" onClick={regenerateInvite}>
                Regenerate
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter invite code to join"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2"
            />
            <Button onClick={joinHousehold}>Join</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
