import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CalendarEvent, CalendarView } from "@/lib/calendar/types";
import { getOllamaConfig, ollamaChat } from "@/lib/ollama/client";

export type SummaryPeriod = CalendarView;

export type CalendarSummary = {
  period: SummaryPeriod;
  text: string;
  eventCount: number;
  model: string;
  generatedAt: string;
  cached: boolean;
};

export type GenerateSummaryInput = {
  period: SummaryPeriod;
  events: CalendarEvent[];
  timezone: string;
  rangeStart: Date;
  rangeEnd: Date;
};

const PERIOD_INSTRUCTIONS: Record<SummaryPeriod, string> = {
  day: "Write 2-3 sentences covering what happens today, in time order. Call out anything that needs leaving the house or overlapping times.",
  week: "Write 3-5 sentences covering the week. Name the busiest days, birthdays, and anything that needs prep. Skip empty days.",
  month: "Write 3-5 sentences as a high-level month overview. Mention the busiest stretches, birthdays, and standout events. Do not list every item.",
};

export function formatEventsForPrompt(
  events: CalendarEvent[],
  timezone: string,
): string {
  const visible = events.filter(
    (event) => event.kind !== "task" || !event.completed,
  );
  if (!visible.length) return "(no events)";

  return visible
    .map((event) => {
      const day = event.allDay
        ? formatCivilDate(event.start.slice(0, 10))
        : formatInTimeZone(parseISO(event.start), timezone, "EEE MMM d");
      const time = event.allDay
        ? "all day"
        : `${formatInTimeZone(parseISO(event.start), timezone, "h:mm a")}–${formatInTimeZone(parseISO(event.end), timezone, "h:mm a")}`;
      const birthday = event.isBirthday ? " (birthday)" : "";
      const task = event.kind === "task" ? " (task)" : "";
      const location = event.location ? ` @ ${event.location}` : "";
      return `- ${day} ${time}: ${event.title}${birthday}${task}${location} [${event.calendarName}]`;
    })
    .join("\n");
}

function formatCivilDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEE MMM d");
}

function emptySummary(
  period: SummaryPeriod,
  rangeLabel: string,
): string {
  if (period === "day") return `Nothing on the calendar for ${rangeLabel}.`;
  if (period === "week") return `A quiet week — no events on the calendar for ${rangeLabel}.`;
  return `A quiet month — no events on the calendar for ${rangeLabel}.`;
}

export async function generateCalendarSummary(
  input: GenerateSummaryInput,
): Promise<CalendarSummary> {
  const { period, events, timezone, rangeStart, rangeEnd } = input;
  const rangeLabel = formatRangeLabel(period, rangeStart, rangeEnd, timezone);
  const generatedAt = new Date().toISOString();
  const eventCount = events.length;

  if (eventCount === 0) {
    return {
      period,
      text: emptySummary(period, rangeLabel),
      eventCount,
      model: "none",
      generatedAt,
      cached: false,
    };
  }

  const { model: configModel } = getOllamaConfig();
  const { model, content } = await ollamaChat({
    model: configModel,
    messages: [
      {
        role: "system",
        content: [
          "You write brief, warm summaries of a household family calendar.",
          "Only mention events and tasks from the provided list. Never invent events, times, or people.",
          "Use first names and weekday names. Prefer natural language over a bullet list.",
          "Keep the tone practical — useful on a wall display the family glances at.",
          "Treat items marked (task) as to-dos due that day, not appointments.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Period: ${period}`,
          `Range: ${rangeLabel}`,
          `Timezone: ${timezone}`,
          "",
          "Events:",
          formatEventsForPrompt(events, timezone),
          "",
          PERIOD_INSTRUCTIONS[period],
        ].join("\n"),
      },
    ],
  });

  return {
    period,
    text: content,
    eventCount,
    model,
    generatedAt,
    cached: false,
  };
}

function formatRangeLabel(
  period: SummaryPeriod,
  start: Date,
  end: Date,
  timezone: string,
): string {
  if (period === "day") {
    return formatInTimeZone(start, timezone, "EEEE, MMMM d, yyyy");
  }
  if (period === "month") {
    return formatInTimeZone(start, timezone, "MMMM yyyy");
  }
  const startLabel = formatInTimeZone(start, timezone, "MMM d");
  const endLabel = formatInTimeZone(end, timezone, "MMM d, yyyy");
  return `${startLabel} – ${endLabel}`;
}
