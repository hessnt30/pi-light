import type { CalendarEvent, LayoutEvent } from "@/lib/calendar/types";

type TimedEvent = CalendarEvent & { startMs: number; endMs: number };

function toMs(event: CalendarEvent): TimedEvent | null {
  if (event.allDay) return null;
  return {
    ...event,
    startMs: new Date(event.start).getTime(),
    endMs: new Date(event.end).getTime(),
  };
}

function overlaps(a: TimedEvent, b: TimedEvent): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

export function layoutOverlappingEvents(
  events: CalendarEvent[],
): LayoutEvent[] {
  const timed = events.map(toMs).filter(Boolean) as TimedEvent[];
  if (!timed.length) return [];

  timed.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const groups: TimedEvent[][] = [];

  for (const event of timed) {
    let placed = false;
    for (const group of groups) {
      const groupEnd = Math.max(...group.map((e) => e.endMs));
      if (event.startMs < groupEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([event]);
  }

  const result: LayoutEvent[] = [];

  for (const group of groups) {
    const columns: TimedEvent[][] = [];

    for (const event of group) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (!overlaps(lastInCol, event)) {
          columns[col].push(event);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([event]);
    }

    const totalColumns = columns.length;
    columns.forEach((col, colIndex) => {
      for (const event of col) {
        result.push({ ...event, column: colIndex, totalColumns });
      }
    });
  }

  return result;
}

export function getTimeBounds(
  events: CalendarEvent[],
  defaultStart = 6,
  defaultEnd = 22,
): { startHour: number; endHour: number } {
  let startHour = defaultStart;
  let endHour = defaultEnd;

  for (const event of events) {
    if (event.allDay) continue;
    const start = new Date(event.start);
    const end = new Date(event.end);
    startHour = Math.min(startHour, start.getHours());
    endHour = Math.max(endHour, end.getHours() + (end.getMinutes() > 0 ? 1 : 0));
  }

  startHour = Math.max(0, startHour - 1);
  endHour = Math.min(24, Math.max(endHour + 1, defaultEnd));

  return { startHour, endHour };
}

export function eventTopPercent(
  event: CalendarEvent,
  startHour: number,
  endHour: number,
): number {
  const start = new Date(event.start);
  const minutes = (start.getHours() - startHour) * 60 + start.getMinutes();
  const total = (endHour - startHour) * 60;
  return Math.max(0, (minutes / total) * 100);
}

export function eventHeightPercent(
  event: CalendarEvent,
  startHour: number,
  endHour: number,
): number {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const duration =
    (end.getTime() - start.getTime()) / (1000 * 60);
  const total = (endHour - startHour) * 60;
  return Math.max((duration / total) * 100, 2.5);
}
