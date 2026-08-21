import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { fetchMergedEvents } from "@/lib/calendar/merge";
import { getSummaryRange } from "@/lib/calendar/ranges";
import { generateCalendarSummary } from "@/lib/ollama/summarize";
import { getStoredSummary, saveSummary } from "@/lib/ollama/store";
import { OllamaError } from "@/lib/ollama/client";
import { DEFAULT_DISPLAY_SETTINGS } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const querySchema = z.object({
  period: z.enum(["day", "week", "month"]),
  date: z.string().datetime().optional(),
  refresh: z.enum(["0", "1"]).optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    period: searchParams.get("period"),
    date: searchParams.get("date") ?? undefined,
    refresh: searchParams.get("refresh") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid period or date" },
      { status: 400 },
    );
  }

  const { period, refresh } = parsed.data;
  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();

  const { data: settings } = await auth.supabase
    .from("display_settings")
    .select("timezone, week_starts_on")
    .eq("household_id", auth.context.householdId)
    .single();

  const timezone = settings?.timezone ?? DEFAULT_DISPLAY_SETTINGS.timezone;
  const weekStartsOn = (settings?.week_starts_on === 1 ? 1 : 0) as 0 | 1;
  const range = getSummaryRange(date, period, weekStartsOn);
  const householdId = auth.context.householdId;

  if (refresh !== "1") {
    const stored = await getStoredSummary(
      auth.supabase,
      householdId,
      period,
      range.start,
    );
    if (stored) {
      return NextResponse.json({
        ...stored,
        rangeStart: range.start.toISOString(),
        rangeEnd: range.end.toISOString(),
      });
    }
  }

  const events = await fetchMergedEvents(
    auth.supabase,
    householdId,
    range.start.toISOString(),
    range.end.toISOString(),
  );

  try {
    const summary = await generateCalendarSummary({
      period,
      events,
      timezone,
      rangeStart: range.start,
      rangeEnd: range.end,
    });

    await saveSummary(
      auth.supabase,
      householdId,
      range.start,
      range.end,
      summary,
    );

    return NextResponse.json({
      ...summary,
      rangeStart: range.start.toISOString(),
      rangeEnd: range.end.toISOString(),
    });
  } catch (err) {
    if (err instanceof OllamaError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Calendar summary failed:", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
