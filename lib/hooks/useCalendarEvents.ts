"use client";

import useSWR from "swr";
import { getViewRange } from "@/lib/calendar/ranges";
import type { CalendarEvent, CalendarView } from "@/lib/calendar/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCalendarEvents(
  currentDate: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1,
  refreshInterval = 300000,
) {
  const range = getViewRange(currentDate, view, weekStartsOn);

  const start = range.start.toISOString();
  const end = range.end.toISOString();
  const key = `/api/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

  const { data, error, isLoading, mutate, isValidating } = useSWR<{
    events: CalendarEvent[];
    fetchedAt: string;
  }>(key, fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  return {
    events: data?.events ?? [],
    fetchedAt: data?.fetchedAt ? new Date(data.fetchedAt).getTime() : null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(),
    isOffline: Boolean(error && data),
  };
}

export function useCalendars() {
  return useSWR<{ calendars: Array<{
    id: string;
    name: string;
    color: string;
    enabled: boolean;
    google_email: string;
  }> }>("/api/calendars", fetcher, { refreshInterval: 60000 });
}

export function useSettings() {
  return useSWR("/api/settings", fetcher);
}

export function useWeather(lat?: number | null, lon?: number | null, enabled = true) {
  const hasCoords = lat != null && lon != null;
  const key = enabled
    ? hasCoords
      ? `/api/weather?lat=${lat}&lon=${lon}`
      : "/api/weather"
    : null;

  return useSWR(key, fetcher, { refreshInterval: 900000 });
}
