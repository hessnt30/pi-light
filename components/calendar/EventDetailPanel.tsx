"use client";

import { Modal } from "@/components/ui/Modal";
import { TaskCheckbox } from "@/components/calendar/EventBlock";
import { formatEventDate, formatEventTime } from "@/lib/utils/format";
import type { CalendarEvent } from "@/lib/calendar/types";
import { isTask } from "@/lib/calendar/types";

export function EventDetailPanel({
  event,
  timezone,
  onClose,
  onTaskToggle,
}: {
  event: CalendarEvent | null;
  timezone: string;
  onClose: () => void;
  onTaskToggle?: (event: CalendarEvent) => void;
}) {
  if (!event) return null;

  const task = isTask(event);

  return (
    <Modal open={Boolean(event)} onClose={onClose} title={event.title}>
      <div className="space-y-4">
        {task && (
          <button
            type="button"
            onClick={() => onTaskToggle?.(event)}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-surface-hover"
          >
            <TaskCheckbox
              completed={Boolean(event.completed)}
              color={event.calendarColor}
              size="md"
            />
            <span className="font-medium">
              {event.completed ? "Completed" : "Mark complete"}
            </span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: event.calendarColor }}
          />
          <span className="text-muted">
            {task ? `Task · ${event.calendarName}` : event.calendarName}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-muted">
            {task ? "Due" : "When"}
          </p>
          <p
            className={`text-lg text-foreground ${event.completed ? "line-through" : ""}`}
          >
            {formatEventDate(event.start, timezone)}
          </p>
          <p className="text-foreground">
            {formatEventTime(event, timezone)}
          </p>
        </div>

        {event.location && (
          <div>
            <p className="text-sm font-medium text-muted">Location</p>
            <p className="text-foreground">{event.location}</p>
          </div>
        )}

        {event.description && (
          <div>
            <p className="text-sm font-medium text-muted">
              {task ? "Notes" : "Details"}
            </p>
            <p className="whitespace-pre-wrap text-foreground">
              {event.description}
            </p>
          </div>
        )}

        {event.htmlLink && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-base font-medium text-background transition-opacity hover:opacity-90"
          >
            {task ? "Open in Google Tasks" : "Open in Google Calendar"}
          </a>
        )}
      </div>
    </Modal>
  );
}
