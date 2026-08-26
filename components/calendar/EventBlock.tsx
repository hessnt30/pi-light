"use client";

import { cn } from "@/lib/utils/cn";
import type { CalendarEvent, LayoutEvent } from "@/lib/calendar/types";
import { isTask } from "@/lib/calendar/types";
import {
  eventHeightPercent,
  eventTopPercent,
} from "@/lib/calendar/overlap";

export function TaskCheckbox({
  completed,
  color,
  onToggle,
  size = "sm",
}: {
  completed: boolean;
  color: string;
  onToggle?: () => void;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <span
      role="checkbox"
      aria-checked={completed}
      aria-label={completed ? "Mark task incomplete" : "Mark task complete"}
      tabIndex={onToggle ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      onKeyDown={(e) => {
        if (!onToggle) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2",
        dim,
        onToggle && "cursor-pointer",
      )}
      style={{
        borderColor: color,
        backgroundColor: completed ? color : "transparent",
      }}
    >
      {completed && (
        <svg
          viewBox="0 0 16 16"
          className={size === "md" ? "h-3 w-3" : "h-2.5 w-2.5"}
          fill="none"
          aria-hidden
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function EventTitle({ event }: { event: CalendarEvent }) {
  return (
    <span
      className={cn(
        "block truncate font-medium text-foreground",
        event.completed && "text-muted line-through",
      )}
    >
      {event.isBirthday && "🎂 "}
      {event.title}
    </span>
  );
}

export function EventBlock({
  event,
  layout,
  startHour,
  endHour,
  onClick,
  onTaskToggle,
  displayMode = false,
}: {
  event: CalendarEvent | LayoutEvent;
  layout?: LayoutEvent;
  startHour: number;
  endHour: number;
  onClick: (event: CalendarEvent) => void;
  onTaskToggle?: (event: CalendarEvent) => void;
  displayMode?: boolean;
}) {
  const top = eventTopPercent(event, startHour, endHour);
  const height = eventHeightPercent(event, startHour, endHour);
  const column = layout?.column ?? 0;
  const totalColumns = layout?.totalColumns ?? 1;
  const width = 100 / totalColumns;
  const left = column * width;
  const task = isTask(event);

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={cn(
        "absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left transition-opacity hover:opacity-90",
        displayMode ? "text-base" : "text-sm",
        event.isBirthday && "ring-1 ring-amber-300/50",
        event.completed && "opacity-60",
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
      <span className="flex items-start gap-1.5">
        {task && (
          <TaskCheckbox
            completed={Boolean(event.completed)}
            color={event.calendarColor}
            onToggle={onTaskToggle ? () => onTaskToggle(event) : undefined}
          />
        )}
        <EventTitle event={event} />
      </span>
    </button>
  );
}

export function AllDayChip({
  event,
  onClick,
  onTaskToggle,
  displayMode = false,
}: {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  onTaskToggle?: (event: CalendarEvent) => void;
  displayMode?: boolean;
}) {
  const task = isTask(event);

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={cn(
        "flex items-center gap-1.5 truncate rounded-md border-l-4 px-2 py-1 font-medium text-foreground transition-opacity hover:opacity-90",
        displayMode ? "text-sm" : "text-xs",
        event.isBirthday && "ring-1 ring-amber-300/50",
        event.completed && "opacity-60",
      )}
      style={{
        backgroundColor: `${event.calendarColor}22`,
        borderLeftColor: event.calendarColor,
      }}
    >
      {task && (
        <TaskCheckbox
          completed={Boolean(event.completed)}
          color={event.calendarColor}
          onToggle={onTaskToggle ? () => onTaskToggle(event) : undefined}
        />
      )}
      <span className={cn("truncate", event.completed && "text-muted line-through")}>
        {event.isBirthday && "🎂 "}
        {event.title}
      </span>
    </button>
  );
}
