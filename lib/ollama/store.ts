import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarSummary, SummaryPeriod } from "@/lib/ollama/summarize";

export async function getStoredSummary(
  supabase: SupabaseClient,
  householdId: string,
  period: SummaryPeriod,
  rangeStart: Date,
): Promise<CalendarSummary | null> {
  const { data, error } = await supabase
    .from("calendar_summaries")
    .select("period, text, event_count, model, generated_at")
    .eq("household_id", householdId)
    .eq("period", period)
    .eq("range_start", rangeStart.toISOString())
    .maybeSingle();

  if (error) {
    console.error("Failed to load calendar summary:", error);
    return null;
  }

  if (!data) return null;

  return {
    period: data.period as SummaryPeriod,
    text: data.text,
    eventCount: data.event_count,
    model: data.model,
    generatedAt: data.generated_at,
    cached: true,
  };
}

export async function saveSummary(
  supabase: SupabaseClient,
  householdId: string,
  rangeStart: Date,
  rangeEnd: Date,
  summary: CalendarSummary,
): Promise<void> {
  const { error } = await supabase.from("calendar_summaries").upsert(
    {
      household_id: householdId,
      period: summary.period,
      range_start: rangeStart.toISOString(),
      range_end: rangeEnd.toISOString(),
      text: summary.text,
      event_count: summary.eventCount,
      model: summary.model,
      generated_at: summary.generatedAt,
    },
    { onConflict: "household_id,period,range_start" },
  );

  if (error) {
    console.error("Failed to save calendar summary:", error);
  }
}
