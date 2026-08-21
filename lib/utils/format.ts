import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function formatEventTime(
  event: { start: string; end: string; allDay: boolean },
  timezone: string,
): string {
  if (event.allDay) return "All day";

  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const startStr = formatInTimeZone(start, timezone, "h:mm a");
  const endStr = formatInTimeZone(end, timezone, "h:mm a");
  return `${startStr} – ${endStr}`;
}

export function formatEventDate(
  dateStr: string,
  timezone: string,
): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return formatInTimeZone(date, timezone, "EEE, MMM d");
}

export function formatHeaderDate(date: Date, view: string): string {
  if (view === "day") return format(date, "EEEE, MMMM d, yyyy");
  if (view === "month") return format(date, "MMMM yyyy");
  return format(date, "MMMM d, yyyy");
}

export function formatUpdatedAgo(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

export function formatClock(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "h:mm a");
}

export function formatClockDate(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "EEEE, MMMM d");
}
