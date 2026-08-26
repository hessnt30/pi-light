import { NextResponse } from "next/server";

const FORECAST_DAYS = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat") ?? process.env.WEATHER_LAT ?? "40.7128";
  const lon = searchParams.get("lon") ?? process.env.WEATHER_LON ?? "-74.0060";

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=${FORECAST_DAYS}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    const data = await res.json();

    const code = data.current?.weather_code ?? 0;
    const temp = data.current?.temperature_2m;
    const dates: string[] = data.daily?.time ?? [];
    const codes: number[] = data.daily?.weather_code ?? [];
    const highs: number[] = data.daily?.temperature_2m_max ?? [];
    const lows: number[] = data.daily?.temperature_2m_min ?? [];

    return NextResponse.json({
      temp,
      description: weatherDescription(code),
      icon: weatherIcon(code),
      forecast: dates.map((date, i) => ({
        date,
        high: highs[i],
        low: lows[i],
        description: weatherDescription(codes[i] ?? 0),
        icon: weatherIcon(codes[i] ?? 0),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 503 });
  }
}

function weatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 49) return "🌫️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}
