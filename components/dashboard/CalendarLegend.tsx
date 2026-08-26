"use client";

import { useCalendars } from "@/lib/hooks/useCalendarEvents";
import { cn } from "@/lib/utils/cn";

export function CalendarLegend({
  displayMode = false,
}: {
  displayMode?: boolean;
}) {
  const { data, mutate } = useCalendars();
  const calendars = [...(data?.calendars ?? [])].sort((a, b) => {
    if (a.source === b.source) return a.name.localeCompare(b.name);
    return a.source === "google_tasks" ? 1 : -1;
  });

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/calendars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    mutate();
  }

  if (!calendars.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {calendars.map((cal) => (
        <button
          key={cal.id}
          type="button"
          onClick={() => toggle(cal.id, cal.enabled)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-opacity",
            displayMode ? "text-base" : "text-sm",
            cal.enabled
              ? "border-border bg-surface"
              : "border-transparent bg-surface-hover opacity-50",
          )}
        >
          {cal.source === "google_tasks" ? (
            <span
              className="inline-flex h-3 w-3 items-center justify-center rounded-full border-2"
              style={{ borderColor: cal.color }}
            />
          ) : (
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: cal.color }}
            />
          )}
          <span className="font-medium">{cal.name}</span>
        </button>
      ))}
    </div>
  );
}
