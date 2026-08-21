import type { calendar_v3 } from "googleapis";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { CalendarRecord } from "@/lib/types/database";

function isBirthdayEvent(
  item: calendar_v3.Schema$Event,
  calendarName: string,
): boolean {
  if (item.eventType === "birthday") return true;
  const title = (item.summary ?? "").toLowerCase();
  const cal = calendarName.toLowerCase();
  return (
    title.includes("birthday") ||
    cal.includes("birthday") ||
    cal.includes("contacts")
  );
}

export function normalizeGoogleEvent(
  item: calendar_v3.Schema$Event,
  calendar: CalendarRecord,
): CalendarEvent | null {
  if (!item.id || item.status === "cancelled") return null;

  const allDay = Boolean(item.start?.date && !item.start?.dateTime);
  const start = item.start?.dateTime ?? item.start?.date;
  const end = item.end?.dateTime ?? item.end?.date;

  if (!start || !end) return null;

  return {
    id: `${calendar.id}:${item.id}`,
    googleEventId: item.id,
    calendarId: calendar.id,
    calendarName: calendar.name,
    calendarColor: calendar.color,
    title: item.summary ?? "(No title)",
    description: item.description ?? undefined,
    location: item.location ?? undefined,
    start,
    end,
    allDay,
    timezone: item.start?.timeZone ?? undefined,
    htmlLink: item.htmlLink ?? undefined,
    status: (item.status as CalendarEvent["status"]) ?? "confirmed",
    isBirthday: isBirthdayEvent(item, calendar.name),
  };
}
