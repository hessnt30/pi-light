import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedClient } from "@/lib/google/oauth";
import { normalizeGoogleEvent } from "@/lib/calendar/normalize";
import {
  fetchTasksForList,
  listTaskLists,
  syncTaskListsForAccount,
} from "@/lib/google/tasks";
import {
  isTaskListCalendar,
  toTaskListCalendarId,
} from "@/lib/google/calendar-rows";
import type { CalendarEvent } from "@/lib/calendar/types";
import type { CalendarRecord } from "@/lib/types/database";
import { TASKS_DEFAULT_COLOR } from "@/lib/types/database";

export async function fetchMergedEvents(
  supabase: SupabaseClient,
  householdId: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const { data: accounts } = await supabase
    .from("google_accounts")
    .select("id")
    .eq("household_id", householdId);

  if (!accounts?.length) return [];

  const accountIds = accounts.map((a) => a.id);
  const { data: calendars } = await supabase
    .from("calendars")
    .select("*")
    .in("google_account_id", accountIds)
    .eq("enabled", true);

  const events: CalendarEvent[] = [];
  const calendarFeeds = (calendars ?? []).filter(
    (cal) => !isTaskListCalendar(cal),
  );
  let taskLists = (calendars ?? []).filter((cal) => isTaskListCalendar(cal));

  if (!taskLists.length) {
    taskLists = await loadTaskListsFallback(supabase, accounts);
  }

  if (!calendarFeeds.length && !taskLists.length) return [];

  await Promise.all([
    ...calendarFeeds.map(async (cal) => {
      try {
        const auth = await getAuthenticatedClient(
          supabase,
          cal.google_account_id,
        );
        const calendar = google.calendar({ version: "v3", auth });

        const { data } = await calendar.events.list({
          calendarId: cal.google_calendar_id,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 250,
        });

        for (const item of data.items ?? []) {
          const normalized = normalizeGoogleEvent(item, cal);
          if (normalized) events.push(normalized);
        }
      } catch (err) {
        console.error(`Failed to fetch calendar ${cal.name}:`, err);
      }
    }),
    ...taskLists.map(async (cal) => {
      try {
        const auth = await getAuthenticatedClient(
          supabase,
          cal.google_account_id,
        );
        const tasks = await fetchTasksForList(
          auth,
          cal as CalendarRecord,
          timeMin,
          timeMax,
        );
        events.push(...tasks);
      } catch (err) {
        console.error(`Failed to fetch tasks ${cal.name}:`, err);
      }
    }),
  ]);

  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

async function loadTaskListsFallback(
  supabase: SupabaseClient,
  accounts: Array<{ id: string }>,
): Promise<CalendarRecord[]> {
  for (const account of accounts) {
    await syncTaskListsForAccount(supabase, account.id);
  }

  const accountIds = accounts.map((a) => a.id);
  const { data: stored } = await supabase
    .from("calendars")
    .select("*")
    .in("google_account_id", accountIds)
    .eq("enabled", true);

  const persisted = (stored ?? []).filter((cal) => isTaskListCalendar(cal));
  if (persisted.length) return persisted as CalendarRecord[];

  const live: CalendarRecord[] = [];
  for (const account of accounts) {
    try {
      const auth = await getAuthenticatedClient(supabase, account.id);
      const lists = await listTaskLists(auth);
      for (const list of lists) {
        live.push({
          id: `${account.id}:${list.id}`,
          google_account_id: account.id,
          google_calendar_id: toTaskListCalendarId(list.id),
          name: list.title,
          color: TASKS_DEFAULT_COLOR,
          enabled: true,
          is_primary: false,
          source: "google_tasks",
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`Failed to load Google Tasks for account ${account.id}:`, err);
    }
  }
  return live;
}
