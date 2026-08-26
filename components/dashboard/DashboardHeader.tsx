"use client";

import { Button } from "@/components/ui/Button";
import { formatHeaderDate, formatJumpLabel } from "@/lib/utils/format";
import { ClockWidget } from "@/components/dashboard/ClockWidget";
import type { CalendarView } from "@/lib/calendar/types";

const views: CalendarView[] = ["week", "month", "day"];

export function DashboardHeader({
  currentDate,
  view,
  timezone,
  showClock,
  onPrev,
  onToday,
  onNext,
  onViewChange,
  onRefresh,
  onFullscreen,
  isValidating,
  displayMode = false,
  minimal = false,
}: {
  currentDate: Date;
  view: CalendarView;
  timezone: string;
  showClock: boolean;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarView) => void;
  onRefresh: () => void;
  onFullscreen: () => void;
  isValidating?: boolean;
  displayMode?: boolean;
  minimal?: boolean;
}) {
  return (
    <header
      className={
        displayMode
          ? "flex shrink-0 items-center justify-between gap-4 px-2 py-3"
          : "flex shrink-0 flex-wrap items-center justify-between gap-4 pb-4"
      }
    >
      <div className="flex items-center gap-6">
        {showClock ? (
          <ClockWidget timezone={timezone} displayMode={displayMode} />
        ) : (
          <div>
            <h1
              className={
                displayMode ? "text-3xl font-semibold" : "text-2xl font-semibold"
              }
            >
              {formatHeaderDate(currentDate, view)}
            </h1>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button size={displayMode ? "lg" : "md"} onClick={onPrev} aria-label="Previous">
            ◀
          </Button>
          <Button size={displayMode ? "lg" : "md"} onClick={onToday}>
            {formatJumpLabel(view, timezone)}
          </Button>
          <Button size={displayMode ? "lg" : "md"} onClick={onNext} aria-label="Next">
            ▶
          </Button>
        </div>

        {!minimal && (
          <div className="flex rounded-xl border border-border p-1">
            {views.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                className={
                  view === v
                    ? "rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background capitalize"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-muted capitalize hover:text-foreground"
                }
              >
                {v}
              </button>
            ))}
          </div>
        )}

        <Button
          size={displayMode ? "lg" : "md"}
          onClick={onRefresh}
          disabled={isValidating}
          aria-label="Refresh"
        >
          {isValidating ? "…" : "↻"}
        </Button>

        <Button
          size={displayMode ? "lg" : "md"}
          onClick={onFullscreen}
          aria-label="Fullscreen"
        >
          ⛶
        </Button>
      </div>
    </header>
  );
}
