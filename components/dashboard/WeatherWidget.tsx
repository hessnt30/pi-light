"use client";

import { format } from "date-fns";
import { useWeather, type WeatherForecastDay } from "@/lib/hooks/useCalendarEvents";

function forecastLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEE");
}

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

  const forecast: WeatherForecastDay[] = data.forecast ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className={displayMode ? "mb-2 text-xl font-semibold" : "mb-2 text-lg font-semibold"}>
        Weather
      </h3>
      <div className="flex items-center gap-3">
        <span className={displayMode ? "text-4xl" : "text-3xl"}>{data.icon}</span>
        <div>
          <p className={displayMode ? "text-3xl font-light" : "text-2xl font-light"}>
            {Math.round(data.temp ?? 0)}°
          </p>
          <p className={displayMode ? "text-base text-muted" : "text-sm text-muted"}>
            {data.description}
          </p>
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="mt-4 grid grid-cols-5 gap-1 border-t border-border pt-3">
          {forecast.map((day, index) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-0.5 text-center"
              title={day.description}
            >
              <span
                className={
                  displayMode ? "text-sm text-muted" : "text-xs text-muted"
                }
              >
                {forecastLabel(day.date, index)}
              </span>
              <span className={displayMode ? "text-xl" : "text-lg"}>{day.icon}</span>
              <span className={displayMode ? "text-sm font-medium" : "text-xs font-medium"}>
                {Math.round(day.high)}°
              </span>
              <span className={displayMode ? "text-sm text-muted" : "text-xs text-muted"}>
                {Math.round(day.low)}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
