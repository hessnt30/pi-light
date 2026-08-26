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
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const todayKey = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
    const tomorrowKey = addCalendarDays(todayKey, 1);
    if (dateStr === todayKey) return "Today";
    if (dateStr === tomorrowKey) return "Tomorrow";
    const [year, month, day] = dateStr.split("-").map(Number);
    return format(new Date(year, month - 1, day), "EEE, MMM d");
  }

  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return formatInTimeZone(date, timezone, "EEE, MMM d");
}

function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function formatHeaderDate(date: Date, view: string): string {
  if (view === "day") return format(date, "EEEE, MMMM d, yyyy");
  if (view === "month") return format(date, "MMMM yyyy");
  return format(date, "MMMM d, yyyy");
}

export function formatJumpLabel(view: string, timezone: string): string {
  if (view === "week") return "This Week";
  if (view === "month") return formatInTimeZone(new Date(), timezone, "MMMM");
  return "Today";
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
