"use client";

import { useCallback, useMemo, useState } from "react";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { DayView } from "@/components/calendar/DayView";
import { EventDetailPanel } from "@/components/calendar/EventDetailPanel";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { navigateDate } from "@/lib/calendar/ranges";
import type { CalendarEvent, CalendarView } from "@/lib/calendar/types";
import type { DisplaySettings } from "@/lib/types/database";

export type CalendarShellProps = {
  settings: DisplaySettings;
  displayMode?: boolean;
  refreshInterval?: number;
  view?: CalendarView;
  currentDate?: Date;
  onViewChange?: (view: CalendarView) => void;
  onDateChange?: (date: Date) => void;
  onRefresh?: () => void;
  refreshRef?: React.MutableRefObject<(() => void) | null>;
};

export function CalendarShell({
  settings,
  displayMode = false,
  refreshInterval = 300000,
  view: controlledView,
  currentDate: controlledDate,
  onViewChange,
  onDateChange,
  refreshRef,
}: CalendarShellProps) {
  const [internalView, setInternalView] = useState<CalendarView>(
    settings.default_view,
  );
  const [internalDate, setInternalDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const view = controlledView ?? internalView;
  const currentDate = controlledDate ?? internalDate;

  const setView = useCallback(
    (v: CalendarView) => {
      if (onViewChange) onViewChange(v);
      else setInternalView(v);
    },
    [onViewChange],
  );

  const setCurrentDate = useCallback(
    (d: Date) => {
      if (onDateChange) onDateChange(d);
      else setInternalDate(d);
    },
    [onDateChange],
  );

  const { events, refresh, mutate } = useCalendarEvents(
    currentDate,
    view,
    settings.week_starts_on,
    refreshInterval,
  );

  if (refreshRef) {
    refreshRef.current = refresh;
  }

  const onTaskToggle = useCallback(
    async (event: CalendarEvent) => {
      if (event.kind !== "task") return;
      const completed = !event.completed;

      await mutate(
        (current) =>
          current
            ? {
                ...current,
                events: current.events.map((item) =>
                  item.id === event.id ? { ...item, completed } : item,
                ),
              }
            : current,
        { revalidate: false },
      );
      setSelectedEvent((prev) =>
        prev?.id === event.id ? { ...prev, completed } : prev,
      );

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: event.calendarId,
          taskId: event.googleEventId,
          completed,
        }),
      });

      if (!res.ok) {
        await mutate();
        setSelectedEvent((prev) =>
          prev?.id === event.id
            ? { ...prev, completed: event.completed }
            : prev,
        );
      }
    },
    [mutate],
  );

  const handlers = useMemo(
    () => ({
      goToday: () => setCurrentDate(new Date()),
      goPrev: () =>
        setCurrentDate(navigateDate(currentDate, view, "prev")),
      goNext: () =>
        setCurrentDate(navigateDate(currentDate, view, "next")),
      setView,
      setCurrentDate,
    }),
    [currentDate, view, setCurrentDate, setView],
  );

  // Expose handlers via data attribute for parent keyboard shortcuts
  (CalendarShell as unknown as { _handlers?: typeof handlers })._handlers =
    handlers;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface">
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            weekStartsOn={settings.week_starts_on}
            onEventClick={setSelectedEvent}
            onTaskToggle={onTaskToggle}
            displayMode={displayMode}
          />
        )}
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            events={events}
            weekStartsOn={settings.week_starts_on}
            onEventClick={setSelectedEvent}
            onTaskToggle={onTaskToggle}
            onDayClick={(day) => {
              setCurrentDate(day);
              setView("day");
            }}
            displayMode={displayMode}
          />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
            onTaskToggle={onTaskToggle}
            displayMode={displayMode}
          />
        )}
      </div>

      <EventDetailPanel
        event={selectedEvent}
        timezone={settings.timezone}
        onClose={() => setSelectedEvent(null)}
        onTaskToggle={onTaskToggle}
      />
    </div>
  );
}

export function useCalendarNavigation(
  settings: DisplaySettings,
  externalView?: CalendarView,
  externalDate?: Date,
) {
  const [view, setView] = useState<CalendarView>(
    externalView ?? settings.default_view,
  );
  const [currentDate, setCurrentDate] = useState(externalDate ?? new Date());
  const refreshRef = useMemo(
    () => ({ current: null as (() => void) | null }),
    [],
  );

  return { view, setView, currentDate, setCurrentDate, refreshRef };
}
