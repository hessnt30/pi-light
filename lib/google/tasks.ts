import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedClient } from "@/lib/google/oauth";
import { normalizeGoogleTask } from "@/lib/calendar/normalize";
import type { CalendarEvent } from "@/lib/calendar/types";
import { CALENDAR_COLORS, TASKS_DEFAULT_COLOR } from "@/lib/types/database";
import type { CalendarRecord } from "@/lib/types/database";
import {
  fromTaskListCalendarId,
  isTaskListCalendar,
  toTaskListCalendarId,
  upsertCalendarRow,
} from "@/lib/google/calendar-rows";

export type TaskSyncResult = {
  count: number;
  needsReauth: boolean;
  error?: string;
};

function googleErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as {
    code?: unknown;
    status?: unknown;
    response?: { status?: unknown };
  };
  const n = Number(e.code ?? e.status ?? e.response?.status);
  return Number.isFinite(n) ? n : undefined;
}

function googleErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Unknown Google API error";
  const e = err as {
    message?: string;
    response?: { data?: { error?: { message?: string } } };
  };
  return (
    e.response?.data?.error?.message ?? e.message ?? "Unknown Google API error"
  );
}

function isApiNotEnabled(err: unknown): boolean {
  const msg = googleErrorMessage(err).toLowerCase();
  return (
    msg.includes("has not been used") ||
    msg.includes("accessnotconfigured") ||
    msg.includes("access not configured") ||
    (msg.includes("tasks") && msg.includes("disabled"))
  );
}

export async function listTaskLists(
  auth: Awaited<ReturnType<typeof getAuthenticatedClient>>,
): Promise<Array<{ id: string; title: string }>> {
  const tasksApi = google.tasks({ version: "v1", auth });
  const lists: Array<{ id: string; title: string }> = [];
  let pageToken: string | undefined;

  do {
    const { data } = await tasksApi.tasklists.list({
      maxResults: 100,
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of data.items ?? []) {
      if (item.id) {
        lists.push({
          id: item.id,
          title: item.title?.trim() ? item.title : "Tasks",
        });
      }
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  if (!lists.length) {
    lists.push({ id: "@default", title: "Tasks" });
  }

  return lists;
}

export async function syncTaskListsForAccount(
  supabase: SupabaseClient,
  accountId: string,
  auth?: Awaited<ReturnType<typeof getAuthenticatedClient>>,
): Promise<TaskSyncResult> {
  try {
    const client = auth ?? (await getAuthenticatedClient(supabase, accountId));
    const lists = await listTaskLists(client);

    const { data: existing } = await supabase
      .from("calendars")
      .select("google_calendar_id, color, enabled")
      .eq("google_account_id", accountId);

    const existingMap = new Map(
      (existing ?? [])
        .filter((c) => isTaskListCalendar(c))
        .map((c) => [fromTaskListCalendarId(c.google_calendar_id), c]),
    );

    let colorIndex = 0;
    for (const list of lists) {
      const prev = existingMap.get(list.id);

      await upsertCalendarRow(supabase, {
        google_account_id: accountId,
        google_calendar_id: toTaskListCalendarId(list.id),
        name: list.title,
        color:
          prev?.color ??
          (colorIndex === 0
            ? TASKS_DEFAULT_COLOR
            : CALENDAR_COLORS[colorIndex % CALENDAR_COLORS.length]),
        enabled: prev?.enabled ?? true,
        is_primary: false,
        source: "google_tasks",
        updated_at: new Date().toISOString(),
      });
      colorIndex++;
    }

    return { count: lists.length, needsReauth: false };
  } catch (err) {
    const message = googleErrorMessage(err);
    console.error("Failed to sync Google Tasks lists:", message);
    if (isApiNotEnabled(err)) {
      return {
        count: 0,
        needsReauth: false,
        error:
          "Enable the Google Tasks API in Google Cloud Console, then click Sync.",
      };
    }
    const status = googleErrorStatus(err);
    if (status === 401 || status === 403) {
      return {
        count: 0,
        needsReauth: true,
        error: "Reconnect Google to grant Tasks access.",
      };
    }
    return { count: 0, needsReauth: false, error: message };
  }
}

function dueOverlapsRange(
  due: string,
  timeMin: string,
  timeMax: string,
): boolean {
  const dueKey = due.slice(0, 10);
  const min = new Date(timeMin);
  const max = new Date(timeMax);
  if (Number.isNaN(min.getTime()) || Number.isNaN(max.getTime())) {
    return (
      dueKey >= timeMin.slice(0, 10) && dueKey <= timeMax.slice(0, 10)
    );
  }
  min.setUTCDate(min.getUTCDate() - 1);
  max.setUTCDate(max.getUTCDate() + 1);
  return (
    dueKey >= min.toISOString().slice(0, 10) &&
    dueKey <= max.toISOString().slice(0, 10)
  );
}

export async function fetchTasksForList(
  auth: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  calendar: CalendarRecord,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const tasksApi = google.tasks({ version: "v1", auth });
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const { data } = await tasksApi.tasks.list({
      tasklist: fromTaskListCalendarId(calendar.google_calendar_id),
      showCompleted: true,
      showHidden: true,
      showDeleted: false,
      maxResults: 100,
      ...(pageToken ? { pageToken } : {}),
    });

    for (const item of data.items ?? []) {
      if (!item.due || !dueOverlapsRange(item.due, timeMin, timeMax)) continue;
      const normalized = normalizeGoogleTask(item, calendar);
      if (normalized) events.push(normalized);
    }

    pageToken = data.nextPageToken ?? undefined;
    pages++;
  } while (pageToken && pages < 20);

  return events;
}

export async function setTaskCompleted(
  auth: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  taskListId: string,
  taskId: string,
  completed: boolean,
) {
  const tasksApi = google.tasks({ version: "v1", auth });
  await tasksApi.tasks.patch({
    tasklist: taskListId,
    task: taskId,
    requestBody: completed
      ? { status: "completed" }
      : { status: "needsAction", completed: null },
  });
}
