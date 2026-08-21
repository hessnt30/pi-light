"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarShell,
  useCalendarNavigation,
} from "@/components/calendar/CalendarShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CalendarLegend } from "@/components/dashboard/CalendarLegend";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { SummaryWidget } from "@/components/dashboard/SummaryWidget";
import { OfflineIndicator } from "@/components/dashboard/OfflineIndicator";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { navigateDate } from "@/lib/calendar/ranges";
import type { DisplaySettings } from "@/lib/types/database";

export function DashboardClient({
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

  const shortcuts = useMemo(
    () => ({
      onToday: goToday,
      onPrev: goPrev,
      onNext: goNext,
      onFullscreen: toggleFullscreen,
      onViewChange: setView,
    }),
    [goToday, goPrev, goNext, toggleFullscreen, setView],
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
      <div className="mb-2 flex items-center justify-between">
        <Link
          href="/settings"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Settings
        </Link>
        <div className="flex items-center gap-4">
          <OfflineIndicator
            isOffline={rangeEvents.isOffline}
            fetchedAt={rangeEvents.fetchedAt}
          />
          <Link
            href="/display"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Wall Display
          </Link>
        </div>
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
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col gap-3">
          <CalendarShell
            settings={settings}
            view={view}
            currentDate={currentDate}
            onViewChange={setView}
            onDateChange={setCurrentDate}
            refreshRef={refreshRef}
          />
          <CalendarLegend />
        </div>

        <aside className="flex flex-col gap-4">
          <SummaryWidget period={view} currentDate={currentDate} />
          {settings.show_upcoming && (
            <UpcomingEvents
              events={rangeEvents.events}
              timezone={settings.timezone}
            />
          )}
          {settings.show_weather && (
            <WeatherWidget
              lat={settings.weather_lat}
              lon={settings.weather_lon}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
