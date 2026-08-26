"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { AllDayChip, EventBlock } from "@/components/calendar/EventBlock";
import {
  getTimeBounds,
  layoutOverlappingEvents,
} from "@/lib/calendar/overlap";
import type { CalendarEvent } from "@/lib/calendar/types";

export function DayView({
  currentDate,
  events,
  onEventClick,
  displayMode = false,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  displayMode?: boolean;
}) {
  const dayEvents = events.filter((e) =>
    isSameDay(parseISO(e.start), currentDate),
  );
  const allDay = dayEvents.filter((e) => e.allDay);
  const timed = dayEvents.filter((e) => !e.allDay);
  const { startHour, endHour } = getTimeBounds(timed);
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const layout = layoutOverlappingEvents(timed);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          "shrink-0 border-b border-border px-4 py-3",
          isSameDay(currentDate, new Date()) && "bg-accent/10",
        )}
      >
        <div className={cn("text-muted", displayMode ? "text-lg" : "text-base")}>
          {format(currentDate, "EEEE")}
        </div>
        <div className={cn("font-semibold", displayMode ? "text-4xl" : "text-3xl")}>
          {format(currentDate, "MMMM d, yyyy")}
        </div>
      </div>

      {allDay.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-border p-3">
          {allDay.map((e) => (
            <AllDayChip
              key={e.id}
              event={e}
              onClick={onEventClick}
              displayMode={displayMode}
            />
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div
          className="relative"
          style={{ minHeight: `${hours.length * (displayMode ? 80 : 60)}px` }}
        >
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute flex w-full border-t border-border/50"
              style={{
                top: `${(i / hours.length) * 100}%`,
                height: `${100 / hours.length}%`,
              }}
            >
              <span
                className={cn(
                  "w-16 shrink-0 pr-2 text-right text-muted",
                  displayMode ? "text-sm" : "text-xs",
                )}
              >
                {format(new Date(2000, 0, 1, hour), "h a")}
              </span>
              <div className="relative flex-1 border-l border-border" />
            </div>
          ))}

          <div
            className="absolute top-0 right-0 bottom-0 left-16"
          >
            {layout.map((event) => (
              <EventBlock
                key={event.id}
                event={event}
                layout={event}
                startHour={startHour}
                endHour={endHour}
                onClick={onEventClick}
                displayMode={displayMode}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
