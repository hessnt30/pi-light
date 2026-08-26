import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { fetchMergedEvents } from "@/lib/calendar/merge";

const querySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const events = await fetchMergedEvents(
    auth.supabase,
    auth.context.householdId,
    parsed.data.start,
    parsed.data.end,
  );

  return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
}
