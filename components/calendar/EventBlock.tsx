"use client";

import { cn } from "@/lib/utils/cn";
import type { CalendarEvent, LayoutEvent } from "@/lib/calendar/types";
import {
  eventHeightPercent,
  eventTopPercent,
} from "@/lib/calendar/overlap";

export function EventBlock({
  event,
  layout,
  startHour,
  endHour,
  onClick,
  displayMode = false,
}: {
  event: CalendarEvent | LayoutEvent;
  layout?: LayoutEvent;
  startHour: number;
  endHour: number;
  onClick: (event: CalendarEvent) => void;
  displayMode?: boolean;
}) {
  const top = eventTopPercent(event, startHour, endHour);
  const height = eventHeightPercent(event, startHour, endHour);
  const column = layout?.column ?? 0;
  const totalColumns = layout?.totalColumns ?? 1;
  const width = 100 / totalColumns;
  const left = column * width;

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={cn(
        "absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left transition-opacity hover:opacity-90",
        displayMode ? "text-base" : "text-sm",
        event.isBirthday && "ring-1 ring-amber-300/50",
      )}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `calc(${width}% - 4px)`,
        backgroundColor: `${event.calendarColor}22`,
        borderLeftColor: event.calendarColor,
      }}
    >
      <span className="block truncate font-medium text-foreground">
        {event.isBirthday && "🎂 "}
        {event.title}
      </span>
    </button>
  );
}

export function AllDayChip({
  event,
  onClick,
  displayMode = false,
}: {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  displayMode?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={cn(
        "truncate rounded-md border-l-4 px-2 py-1 font-medium text-foreground transition-opacity hover:opacity-90",
        displayMode ? "text-sm" : "text-xs",
        event.isBirthday && "ring-1 ring-amber-300/50",
      )}
      style={{
        backgroundColor: `${event.calendarColor}22`,
        borderLeftColor: event.calendarColor,
      }}
    >
      {event.isBirthday && "🎂 "}
      {event.title}
    </button>
  );
}
