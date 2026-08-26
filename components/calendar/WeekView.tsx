"use client";

import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { AllDayChip, EventBlock } from "@/components/calendar/EventBlock";
import {
  getTimeBounds,
  layoutOverlappingEvents,
} from "@/lib/calendar/overlap";
import { eventOccursOnDay, getWeekDays } from "@/lib/calendar/ranges";
import type { CalendarEvent } from "@/lib/calendar/types";

export function WeekView({
  currentDate,
  events,
  weekStartsOn,
  onEventClick,
  onTaskToggle,
  displayMode = false,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  weekStartsOn: 0 | 1;
  onEventClick: (event: CalendarEvent) => void;
  onTaskToggle?: (event: CalendarEvent) => void;
  displayMode?: boolean;
}) {
  const days = getWeekDays(currentDate, weekStartsOn);
  const timedEvents = events.filter((e) => !e.allDay);
  const { startHour, endHour } = getTimeBounds(timedEvents);
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );

  function dayEvents(day: Date) {
    return events.filter((e) => eventOccursOnDay(e, day));
  }

  function allDayEvents(day: Date) {
    return dayEvents(day).filter((e) => e.allDay);
  }

  function timedDayEvents(day: Date) {
    return dayEvents(day).filter((e) => !e.allDay);
  }

  const hasAllDay = days.some((d) => allDayEvents(d).length > 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid shrink-0 border-b border-border" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
        <div />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border-l border-border px-2 py-3 text-center",
              isSameDay(day, new Date()) && "bg-accent/10",
            )}
          >
            <div className={cn("text-muted", displayMode ? "text-base" : "text-sm")}>
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "font-semibold",
                displayMode ? "text-2xl" : "text-xl",
                isSameDay(day, new Date()) && "text-accent",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div
          className="grid shrink-0 border-b border-border"
          style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}
        >
          <div className={cn("flex items-center justify-end pr-2 text-muted", displayMode ? "text-sm" : "text-xs")}>
            all-day
          </div>
          {days.map((day) => (
            <div
              key={`allday-${day.toISOString()}`}
              className="flex flex-col gap-1 border-l border-border p-1"
            >
              {allDayEvents(day).map((e) => (
                <AllDayChip
                  key={e.id}
                  event={e}
                  onClick={onEventClick}
                  onTaskToggle={onTaskToggle}
                  displayMode={displayMode}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: "4rem repeat(7, 1fr)", minHeight: `${hours.length * (displayMode ? 80 : 60)}px` }}
        >
          {/* Hour labels */}
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  "absolute right-2 -translate-y-1/2 text-muted",
                  displayMode ? "text-sm" : "text-xs",
                )}
                style={{ top: `${((hour - startHour) / hours.length) * 100}%` }}
              >
                {format(new Date(2000, 0, 1, hour), "h a")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayTimed = timedDayEvents(day);
            const layout = layoutOverlappingEvents(dayTimed);

            return (
              <div
                key={`grid-${day.toISOString()}`}
                className="relative border-l border-border"
              >
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{
                      top: `${(i / hours.length) * 100}%`,
                      height: `${100 / hours.length}%`,
                    }}
                  />
                ))}

                {layout.map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    layout={event}
                    startHour={startHour}
                    endHour={endHour}
                    onClick={onEventClick}
                    onTaskToggle={onTaskToggle}
                    displayMode={displayMode}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
