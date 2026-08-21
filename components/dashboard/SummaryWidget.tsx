"use client";

import type { CalendarView } from "@/lib/calendar/types";
import { useCalendarSummary } from "@/lib/hooks/useCalendarEvents";

const TITLES: Record<CalendarView, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
};

export function SummaryWidget({
  period,
  currentDate,
  displayMode = false,
}: {
  period: CalendarView;
  currentDate: Date;
  displayMode?: boolean;
}) {
  const { data, error, isLoading, isValidating, refresh } = useCalendarSummary(
    period,
    currentDate,
  );

  const title = TITLES[period];
  const failed = Boolean(error || data?.error);

  if (displayMode && failed) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3
          className={
            displayMode ? "text-xl font-semibold" : "text-lg font-semibold"
          }
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={isValidating}
          className="text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          {isValidating ? "…" : "Refresh"}
        </button>
      </div>

      {isLoading && !data?.text ? (
        <p className={displayMode ? "text-base text-muted" : "text-sm text-muted"}>
          Writing a summary…
        </p>
      ) : failed ? (
        <p className="text-sm text-muted">
          {data?.error ?? "Could not reach Ollama. Is it running?"}
        </p>
      ) : (
        <p
          className={
            displayMode
              ? "text-base leading-relaxed text-foreground"
              : "text-sm leading-relaxed text-foreground"
          }
        >
          {data?.text}
        </p>
      )}
    </div>
  );
}
