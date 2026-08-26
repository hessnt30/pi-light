import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedClient } from "@/lib/google/oauth";
import { syncTaskListsForAccount } from "@/lib/google/tasks";
import {
  isTaskListCalendar,
  upsertCalendarRow,
} from "@/lib/google/calendar-rows";
import { CALENDAR_COLORS } from "@/lib/types/database";

export async function syncCalendarsForAccount(
  supabase: SupabaseClient,
  accountId: string,
) {
  const auth = await getAuthenticatedClient(supabase, accountId);
  const calendar = google.calendar({ version: "v3", auth });

  const { data } = await calendar.calendarList.list({
    minAccessRole: "reader",
  });

  const items = data.items ?? [];
  const { data: existing } = await supabase
    .from("calendars")
    .select("google_calendar_id, color, enabled")
    .eq("google_account_id", accountId);

  const existingMap = new Map(
    (existing ?? [])
      .filter((c) => !isTaskListCalendar(c))
      .map((c) => [c.google_calendar_id, c]),
  );

  let colorIndex = 0;
  for (const item of items) {
    if (!item.id) continue;
    const prev = existingMap.get(item.id);

    await upsertCalendarRow(supabase, {
      google_account_id: accountId,
      google_calendar_id: item.id,
      name: item.summaryOverride ?? item.summary ?? "Calendar",
      color:
        prev?.color ??
        item.backgroundColor ??
        CALENDAR_COLORS[colorIndex % CALENDAR_COLORS.length],
      enabled: prev?.enabled ?? !item.hidden,
      is_primary: item.primary ?? false,
      source: "google_calendar",
      updated_at: new Date().toISOString(),
    });

    colorIndex++;
  }

  const tasks = await syncTaskListsForAccount(supabase, accountId, auth);

  return {
    calendars: items.length,
    taskLists: tasks.count,
    tasksNeedsReauth: tasks.needsReauth,
    tasksError: tasks.error,
  };
}

export async function syncAllHouseholdCalendars(
  supabase: SupabaseClient,
  householdId: string,
) {
  const { data: accounts } = await supabase
    .from("google_accounts")
    .select("id")
    .eq("household_id", householdId);

  for (const account of accounts ?? []) {
    await syncCalendarsForAccount(supabase, account.id);
  }
}
