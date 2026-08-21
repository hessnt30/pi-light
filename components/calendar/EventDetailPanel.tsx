"use client";

import { Modal } from "@/components/ui/Modal";
import { formatEventDate, formatEventTime } from "@/lib/utils/format";
import type { CalendarEvent } from "@/lib/calendar/types";

export function EventDetailPanel({
  event,
  timezone,
  onClose,
}: {
  event: CalendarEvent | null;
  timezone: string;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <Modal open={Boolean(event)} onClose={onClose} title={event.title}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: event.calendarColor }}
          />
          <span className="text-muted">{event.calendarName}</span>
        </div>

        <div>
          <p className="text-sm font-medium text-muted">When</p>
          <p className="text-lg text-foreground">
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
            <p className="text-sm font-medium text-muted">Details</p>
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
            Open in Google Calendar
          </a>
        )}
      </div>
    </Modal>
  );
}
