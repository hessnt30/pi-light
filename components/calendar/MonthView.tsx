"use client";

import { format, isSameDay, isSameMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { getMonthWeeks } from "@/lib/calendar/ranges";
import type { CalendarEvent } from "@/lib/calendar/types";

export function MonthView({
  currentDate,
  events,
  weekStartsOn,
  onEventClick,
  onDayClick,
  displayMode = false,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  weekStartsOn: 0 | 1;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  displayMode?: boolean;
}) {
  const weeks = getMonthWeeks(currentDate, weekStartsOn);
  const dayNames = weekStartsOn === 1
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function dayEvents(day: Date) {
    return events.filter((e) => isSameDay(parseISO(e.start), day));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-border">
        {dayNames.map((name) => (
          <div
            key={name}
            className={cn(
              "py-2 text-center font-medium text-muted",
              displayMode ? "text-base" : "text-sm",
            )}
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-6">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day) => {
              const dayEvts = dayEvents(day);
              const visible = dayEvts.slice(0, 3);
              const extra = dayEvts.length - 3;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className={cn(
                    "flex flex-col border-r border-border p-1 text-left last:border-r-0 hover:bg-surface-hover",
                    !isSameMonth(day, currentDate) && "opacity-40",
                    isSameDay(day, new Date()) && "bg-accent/10",
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 font-semibold",
                      displayMode ? "text-xl" : "text-base",
                      isSameDay(day, new Date()) && "text-accent",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {visible.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick(e);
                        }}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-left font-medium",
                          displayMode ? "text-sm" : "text-xs",
                        )}
                        style={{
                          backgroundColor: `${e.calendarColor}33`,
                          color: e.calendarColor,
                        }}
                      >
                        {e.isBirthday && "🎂 "}
                        {!e.allDay && format(parseISO(e.start), "h:mm")}{" "}
                        {e.title}
                      </button>
                    ))}
                    {extra > 0 && (
                      <span className={cn("text-muted", displayMode ? "text-sm" : "text-xs")}>
                        +{extra} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
