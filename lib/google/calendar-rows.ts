import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarSource } from "@/lib/types/database";

export const TASKS_CALENDAR_PREFIX = "tasks:";

export function isTaskListCalendar(cal: {
  source?: string | null;
  google_calendar_id: string;
}): boolean {
  return (
    cal.source === "google_tasks" ||
    cal.google_calendar_id.startsWith(TASKS_CALENDAR_PREFIX)
  );
}

export function resolvedCalendarSource(cal: {
  source?: string | null;
  google_calendar_id: string;
}): CalendarSource {
  return isTaskListCalendar(cal) ? "google_tasks" : "google_calendar";
}

export function toTaskListCalendarId(listId: string): string {
  return listId.startsWith(TASKS_CALENDAR_PREFIX)
    ? listId
    : `${TASKS_CALENDAR_PREFIX}${listId}`;
}

export function fromTaskListCalendarId(googleCalendarId: string): string {
  return googleCalendarId.startsWith(TASKS_CALENDAR_PREFIX)
    ? googleCalendarId.slice(TASKS_CALENDAR_PREFIX.length)
    : googleCalendarId;
}

function isMissingSourceColumn(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("source") &&
    (msg.includes("schema cache") ||
      msg.includes("column") ||
      msg.includes("could not find"))
  );
}

export async function upsertCalendarRow(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
) {
  const { error } = await supabase.from("calendars").upsert(row, {
    onConflict: "google_account_id,google_calendar_id",
  });

  if (!error) return;

  if ("source" in row && isMissingSourceColumn(error.message)) {
    const withoutSource = { ...row };
    delete withoutSource.source;
    const retry = await supabase.from("calendars").upsert(withoutSource, {
      onConflict: "google_account_id,google_calendar_id",
    });
    if (retry.error) throw new Error(retry.error.message);
    return;
  }

  throw new Error(error.message);
}
