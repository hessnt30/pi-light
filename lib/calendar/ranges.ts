import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarView } from "@/lib/calendar/types";

export function getViewRange(
  date: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1,
): { start: Date; end: Date } {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "month": {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return {
        start: startOfWeek(monthStart, { weekStartsOn }),
        end: endOfWeek(monthEnd, { weekStartsOn }),
      };
    }
    case "week":
    default:
      return {
        start: startOfWeek(date, { weekStartsOn }),
        end: endOfWeek(date, { weekStartsOn }),
      };
  }
}

/** Inclusive calendar period without the extra days month-view pads with. */
export function getSummaryRange(
  date: Date,
  period: CalendarView,
  weekStartsOn: 0 | 1,
): { start: Date; end: Date } {
  switch (period) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "week":
    default:
      return {
        start: startOfWeek(date, { weekStartsOn }),
        end: endOfWeek(date, { weekStartsOn }),
      };
  }
}

export function navigateDate(
  date: Date,
  view: CalendarView,
  direction: "prev" | "next",
): Date {
  const delta = direction === "next" ? 1 : -1;
  switch (view) {
    case "day":
      return addDays(date, delta);
    case "month":
      return addMonths(date, delta);
    case "week":
    default:
      return addDays(date, delta * 7);
  }
}

export function getWeekDays(
  date: Date,
  weekStartsOn: 0 | 1,
): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthWeeks(
  date: Date,
  weekStartsOn: 0 | 1,
): Date[][] {
  const range = getViewRange(date, "month", weekStartsOn);
  const weeks: Date[][] = [];
  let current = range.start;

  while (current <= range.end) {
    weeks.push(getWeekDays(current, weekStartsOn));
    current = addDays(current, 7);
  }

  return weeks;
}
