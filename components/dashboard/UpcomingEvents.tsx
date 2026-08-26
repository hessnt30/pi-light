"use client";

import { parseISO, isAfter } from "date-fns";
import { TaskCheckbox } from "@/components/calendar/EventBlock";
import { formatEventDate, formatEventTime } from "@/lib/utils/format";
import type { CalendarEvent } from "@/lib/calendar/types";
import { isTask } from "@/lib/calendar/types";

export function UpcomingEvents({
  events,
  timezone,
  limit = 5,
  displayMode = false,
}: {
  events: CalendarEvent[];
  timezone: string;
  limit?: number;
  displayMode?: boolean;
}) {
  const now = new Date();
  const upcoming = events
    .filter((e) => {
      if (isTask(e)) return !e.completed;
      return isAfter(parseISO(e.end), now);
    })
    .slice(0, limit);

  const nextEvent = upcoming[0];
  const countdown = nextEvent
    ? getCountdown(parseISO(nextEvent.start), now)
    : null;

  if (!upcoming.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className={displayMode ? "mb-2 text-xl font-semibold" : "mb-2 text-lg font-semibold"}>
          Upcoming
        </h3>
        <p className="text-muted">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className={displayMode ? "mb-3 text-xl font-semibold" : "mb-3 text-lg font-semibold"}>
        Upcoming
      </h3>

      {countdown && (
        <p className={displayMode ? "mb-3 text-base text-accent" : "mb-3 text-sm text-accent"}>
          Next in {countdown}
        </p>
      )}

      <ul className="space-y-3">
        {upcoming.map((event) => (
          <li key={event.id} className="flex gap-3">
            {isTask(event) ? (
              <span className="mt-1 shrink-0">
                <TaskCheckbox
                  completed={false}
                  color={event.calendarColor}
                />
              </span>
            ) : (
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: event.calendarColor }}
              />
            )}
            <div className="min-w-0">
              <p className={displayMode ? "truncate text-lg font-medium" : "truncate font-medium"}>
                {event.isBirthday && "🎂 "}
                {event.title}
              </p>
              <p className={displayMode ? "text-base text-muted" : "text-sm text-muted"}>
                {formatEventDate(event.start, timezone)} ·{" "}
                {formatEventTime(event, timezone)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "now";

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
