"use client";

import { useWeather } from "@/lib/hooks/useCalendarEvents";

export function WeatherWidget({
  lat,
  lon,
  displayMode = false,
}: {
  lat?: number | null;
  lon?: number | null;
  displayMode?: boolean;
}) {
  const { data, error } = useWeather(lat, lon);

  if (error || !data || data.error) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className={displayMode ? "mb-2 text-xl font-semibold" : "mb-2 text-lg font-semibold"}>
        Weather
      </h3>
      <div className="flex items-center gap-3">
        <span className={displayMode ? "text-4xl" : "text-3xl"}>{data.icon}</span>
        <div>
          <p className={displayMode ? "text-3xl font-light" : "text-2xl font-light"}>
            {Math.round(data.temp)}°
          </p>
          <p className={displayMode ? "text-base text-muted" : "text-sm text-muted"}>
            {data.description}
          </p>
        </div>
      </div>
    </div>
  );
}
