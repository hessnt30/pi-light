import type { calendar_v3, tasks_v1 } from "googleapis";
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
    kind: "event",
  };
}

function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function dueHasTime(due: string): boolean {
  const match = due.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return false;
  return match[1] !== "00" || match[2] !== "00" || match[3] !== "00";
}

export function normalizeGoogleTask(
  item: tasks_v1.Schema$Task,
  calendar: CalendarRecord,
): CalendarEvent | null {
  if (!item.id || item.deleted || !item.due) return null;

  const completed = item.status === "completed";
  const timed = dueHasTime(item.due);
  const dateKey = item.due.slice(0, 10);

  let start: string;
  let end: string;
  let allDay: boolean;

  if (timed) {
    start = item.due;
    const startMs = new Date(item.due).getTime();
    end = new Date(startMs + 30 * 60 * 1000).toISOString();
    allDay = false;
  } else {
    start = dateKey;
    end = addCalendarDays(dateKey, 1);
    allDay = true;
  }

  return {
    id: `${calendar.id}:${item.id}`,
    googleEventId: item.id,
    calendarId: calendar.id,
    calendarName: calendar.name,
    calendarColor: calendar.color,
    title: item.title?.trim() ? item.title : "(No title)",
    description: item.notes ?? undefined,
    start,
    end,
    allDay,
    htmlLink: item.webViewLink ?? undefined,
    status: "confirmed",
    kind: "task",
    completed,
  };
}
