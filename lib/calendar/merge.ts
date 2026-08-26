import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedClient } from "@/lib/google/oauth";
import { normalizeGoogleEvent } from "@/lib/calendar/normalize";
import type { CalendarEvent } from "@/lib/calendar/types";

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

  if (!calendars?.length) return [];

  const events: CalendarEvent[] = [];

  await Promise.all(
    calendars.map(async (cal) => {
      try {
        const auth = await getAuthenticatedClient(supabase, cal.google_account_id);
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
  );

  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}
