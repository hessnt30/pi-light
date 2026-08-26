import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { getAuthenticatedClient } from "@/lib/google/oauth";
import { setTaskCompleted } from "@/lib/google/tasks";
import {
  fromTaskListCalendarId,
  isTaskListCalendar,
} from "@/lib/google/calendar-rows";

const patchSchema = z.object({
  calendarId: z.string().uuid(),
  taskId: z.string().min(1),
  completed: z.boolean(),
});

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { calendarId, taskId, completed } = parsed.data;

  const { data: calendar } = await auth.supabase
    .from("calendars")
    .select(
      "id, google_calendar_id, google_account_id, google_accounts!inner(household_id)",
    )
    .eq("id", calendarId)
    .single();

  if (!calendar || !isTaskListCalendar(calendar)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const googleAccount = calendar.google_accounts as unknown as {
    household_id: string;
  } | { household_id: string }[];
  const householdId = Array.isArray(googleAccount)
    ? googleAccount[0]?.household_id
    : googleAccount?.household_id;

  if (householdId !== auth.context.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const client = await getAuthenticatedClient(
      auth.supabase,
      calendar.google_account_id,
    );
    await setTaskCompleted(
      client,
      fromTaskListCalendarId(calendar.google_calendar_id),
      taskId,
      completed,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update Google Task:", err);
    const status =
      typeof err === "object" && err !== null && "code" in err
        ? Number((err as { code?: number }).code)
        : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "Reconnect Google to update tasks" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
