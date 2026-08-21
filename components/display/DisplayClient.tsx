"use client";

import { useCallback, useMemo } from "react";
import {
  CalendarShell,
  useCalendarNavigation,
} from "@/components/calendar/CalendarShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { OfflineIndicator } from "@/components/dashboard/OfflineIndicator";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { navigateDate } from "@/lib/calendar/ranges";
import type { DisplaySettings } from "@/lib/types/database";

export function DisplayClient({
  settings,
}: {
  settings: DisplaySettings;
}) {
  const { view, setView, currentDate, setCurrentDate, refreshRef } =
    useCalendarNavigation(settings);
  const { toggle: toggleFullscreen } = useFullscreen();

  const rangeEvents = useCalendarEvents(
    currentDate,
    view,
    settings.week_starts_on,
    180000,
  );

  const goToday = useCallback(() => setCurrentDate(new Date()), [setCurrentDate]);
  const goPrev = useCallback(
    () => setCurrentDate(navigateDate(currentDate, view, "prev")),
    [currentDate, view, setCurrentDate],
  );
  const goNext = useCallback(
    () => setCurrentDate(navigateDate(currentDate, view, "next")),
    [currentDate, view, setCurrentDate],
  );

  useKeyboardShortcuts(
    useMemo(
      () => ({
        onToday: goToday,
        onPrev: goPrev,
        onNext: goNext,
        onFullscreen: toggleFullscreen,
        onViewChange: setView,
      }),
      [goToday, goPrev, goNext, toggleFullscreen, setView],
    ),
  );

  return (
    <div className="flex h-screen flex-col p-4">
      <div className="flex items-center justify-end pb-2">
        <OfflineIndicator
          isOffline={rangeEvents.isOffline}
          fetchedAt={rangeEvents.fetchedAt}
        />
      </div>

      <DashboardHeader
        currentDate={currentDate}
        view={view}
        timezone={settings.timezone}
        showClock={settings.show_clock}
        onPrev={goPrev}
        onToday={goToday}
        onNext={goNext}
        onViewChange={setView}
        onRefresh={() => {
          refreshRef.current?.();
          rangeEvents.refresh();
        }}
        onFullscreen={toggleFullscreen}
        isValidating={rangeEvents.isValidating}
        displayMode
        minimal
      />

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_320px]">
        <CalendarShell
          settings={settings}
          displayMode
          refreshInterval={180000}
          view={view}
          currentDate={currentDate}
          onViewChange={setView}
          onDateChange={setCurrentDate}
          refreshRef={refreshRef}
        />

        <aside className="hidden flex-col gap-4 xl:flex">
          {settings.show_upcoming && (
            <UpcomingEvents
              events={rangeEvents.events}
              timezone={settings.timezone}
              displayMode
            />
          )}
          {settings.show_weather && (
            <WeatherWidget
              lat={settings.weather_lat}
              lon={settings.weather_lon}
              displayMode
            />
          )}
        </aside>
      </div>
    </div>
  );
}
